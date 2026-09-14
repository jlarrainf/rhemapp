import { buildPrivateShareUrl } from "./publicUrls.js";
import { createShareToken, hashShareToken } from "./tokens.js";
import {
	ShareNotFoundError,
	ShareUnavailableError,
	ShareValidationError,
	validatePrivateSharePayload,
	validateShareId,
	normalizeShareSource,
} from "./validation.js";

const SHARE_FIELDS = [
	"id",
	"owner_user_id",
	"resource_type",
	"resource_id",
	"revoked_at",
	"expires_at",
	"created_at",
].join(", ");

const PUBLIC_RESOURCE_FIELDS = "content_type, title, reference, snapshot_json";

export class SharePersistenceError extends Error {
	constructor(message = "Share persistence failed") {
		super(message);
		this.name = "SharePersistenceError";
		this.status = 503;
	}
}

function assertResult(result, message) {
	if (result?.error) {
		const error = new SharePersistenceError(message);
		error.cause = result.error;
		throw error;
	}
	return result?.data;
}

function validateOwnerId(ownerUserId) {
	if (typeof ownerUserId !== "string" || !ownerUserId) {
		throw new ShareValidationError("La cuenta no es válida");
	}
	return ownerUserId;
}

function mapShare(row, token = null, siteUrl = null) {
	return {
		id: row.id,
		resourceType: row.resource_type,
		revokedAt: row.revoked_at ?? null,
		expiresAt: row.expires_at ?? null,
		createdAt: row.created_at ?? null,
		...(token && siteUrl ? { url: buildPrivateShareUrl(token, siteUrl) } : {}),
	};
}

async function assertSavedReadingOwner(supabase, ownerUserId, resourceId) {
	const result = await supabase
		.from("saved_items")
		.select("id")
		.eq("id", resourceId)
		.eq("user_id", ownerUserId)
		.maybeSingle();
	const row = assertResult(result, "No se pudo comprobar el contenido compartido");
	if (!row) throw new ShareNotFoundError();
}

export async function createPrivateShare({ supabase, ownerUserId, payload, siteUrl }) {
	const normalizedOwnerId = validateOwnerId(ownerUserId);
	const resource = validatePrivateSharePayload(payload);
	await assertSavedReadingOwner(supabase, normalizedOwnerId, resource.resourceId);

	const { token, tokenHash } = createShareToken();
	const result = await supabase
		.from("shares")
		.insert({
			token_hash: tokenHash,
			owner_user_id: normalizedOwnerId,
			resource_type: resource.resourceType,
			resource_id: resource.resourceId,
			expires_at: null,
		})
		.select(SHARE_FIELDS)
		.single();
	const row = assertResult(result, "No se pudo crear el enlace compartido");
	if (!row) throw new SharePersistenceError("No se pudo recuperar el enlace creado");
	return { share: mapShare(row, token, siteUrl) };
}

export async function revokePrivateShare({ supabase, ownerUserId, shareId }) {
	const normalizedOwnerId = validateOwnerId(ownerUserId);
	const normalizedShareId = validateShareId(shareId);
	const result = await supabase
		.from("shares")
		.update({ revoked_at: new Date().toISOString() })
		.eq("id", normalizedShareId)
		.eq("owner_user_id", normalizedOwnerId)
		.is("revoked_at", null)
		.select("id, revoked_at")
		.maybeSingle();
	const row = assertResult(result, "No se pudo revocar el enlace compartido");
	if (!row) throw new ShareNotFoundError();
	return { id: row.id, revoked: true, revokedAt: row.revoked_at };
}

async function getShareByHash(supabase, tokenHash) {
	const result = await supabase
		.from("shares")
		.select(SHARE_FIELDS)
		.eq("token_hash", tokenHash)
		.maybeSingle();
	return assertResult(result, "No se pudo resolver el enlace compartido");
}

function isExpired(row, now) {
	return Boolean(row.expires_at && new Date(row.expires_at).getTime() <= now.getTime());
}

function mapPrivateSnapshot(row) {
	const snapshot = row.snapshot_json && typeof row.snapshot_json === "object" && !Array.isArray(row.snapshot_json)
		? row.snapshot_json
		: {};
	const metadata = snapshot.metadata && typeof snapshot.metadata === "object" && !Array.isArray(snapshot.metadata)
		? snapshot.metadata
		: {};
	const source = normalizeShareSource(metadata.source);
	return {
		contentType: row.content_type,
		title: row.title,
		reference: row.reference,
		excerpt: typeof snapshot.excerpt === "string" ? snapshot.excerpt : "",
		metadata: {
			...(typeof metadata.date === "string" ? { date: metadata.date } : {}),
			...(typeof metadata.calendar === "string" ? { calendar: metadata.calendar } : {}),
			...(typeof metadata.readingType === "string" ? { readingType: metadata.readingType } : {}),
			...(typeof metadata.verseId === "string" ? { verseId: metadata.verseId } : {}),
			...(typeof metadata.passageId === "string" ? { passageId: metadata.passageId } : {}),
		},
		...(source ? { source } : {}),
	};
}

export async function resolvePrivateShare({ supabaseAdmin, token, now = new Date() }) {
	let tokenHash;
	try {
		tokenHash = hashShareToken(token);
	} catch {
		throw new ShareUnavailableError();
	}

	const share = await getShareByHash(supabaseAdmin, tokenHash);
	if (!share || share.revoked_at || isExpired(share, now) || share.resource_type !== "saved-reading") {
		throw new ShareUnavailableError();
	}

	const result = await supabaseAdmin
		.from("saved_items")
		.select(PUBLIC_RESOURCE_FIELDS)
		.eq("id", share.resource_id)
		.maybeSingle();
	const savedItem = assertResult(result, "No se pudo resolver el contenido compartido");
	if (!savedItem) throw new ShareUnavailableError();

	return {
		kind: "private",
		shareId: share.id,
		createdAt: share.created_at,
		resource: mapPrivateSnapshot(savedItem),
	};
}

export { SHARE_FIELDS, mapPrivateSnapshot };
