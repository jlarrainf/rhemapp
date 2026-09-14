import { SavedReadingValidationError, validateSavedReadingPayload } from "./validation.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAVED_ITEM_FIELDS = [
	"id",
	"content_type",
	"canonical_key",
	"title",
	"reference",
	"snapshot_json",
	"created_at",
	"updated_at",
].join(", ");

const SAVED_ITEM_SELECT = `${SAVED_ITEM_FIELDS}, saved_item_groups(group_id, created_at, reading_groups(id, name, is_default))`;

export class SavedReadingPersistenceError extends Error {
	constructor(message = "Saved reading persistence failed") {
		super(message);
		this.name = "SavedReadingPersistenceError";
		this.status = 503;
	}
}

export class SavedReadingNotFoundError extends Error {
	constructor() {
		super("No se encontró la lectura guardada");
		this.name = "SavedReadingNotFoundError";
		this.status = 404;
	}
}

function validateSavedReadingId(value) {
	if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
		throw new SavedReadingValidationError("El identificador del guardado no es válido");
	}
	return value.toLowerCase();
}

function mapGroupMembership(membership) {
	const group = Array.isArray(membership?.reading_groups)
		? membership.reading_groups[0]
		: membership?.reading_groups;
	if (!group?.id) return null;
	return {
		id: group.id,
		name: group.name,
		isDefault: group.is_default === true,
		createdAt: membership.created_at ?? null,
	};
}

export function mapSavedItem(row) {
	return {
		id: row.id,
		contentType: row.content_type,
		canonicalKey: row.canonical_key,
		title: row.title,
		reference: row.reference,
		excerpt: row.snapshot_json?.excerpt ?? null,
		snapshot: row.snapshot_json ?? {},
		groups: Array.isArray(row.saved_item_groups)
			? row.saved_item_groups.map(mapGroupMembership).filter(Boolean)
			: [],
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function assertSupabaseResult(result, message) {
	if (result.error) {
		const error = new SavedReadingPersistenceError(message);
		error.cause = result.error;
		throw error;
	}
	return result.data;
}

async function findSavedItem(supabase, userId, contentType, canonicalKey) {
	const result = await supabase
		.from("saved_items")
		.select(SAVED_ITEM_SELECT)
		.eq("user_id", userId)
		.eq("content_type", contentType)
		.eq("canonical_key", canonicalKey)
		.maybeSingle();
	return assertSupabaseResult(result, "No se pudo consultar el guardado");
}

export async function listSavedReadings(supabase, userId) {
	const result = await supabase
		.from("saved_items")
		.select(SAVED_ITEM_SELECT)
		.eq("user_id", userId)
		.order("created_at", { ascending: false });
	const rows = assertSupabaseResult(result, "No se pudieron cargar tus lecturas guardadas");
	return (rows || []).map(mapSavedItem);
}

export async function saveReading({ supabase, userId, payload }) {
	if (typeof userId !== "string" || !userId) throw new SavedReadingValidationError("La cuenta no es válida");
	const normalized = validateSavedReadingPayload(payload);
	const row = {
		user_id: userId,
		content_type: normalized.contentType,
		canonical_key: normalized.canonicalKey,
		title: normalized.title,
		reference: normalized.reference,
		snapshot_json: normalized.snapshotJson,
	};

	const insertResult = await supabase
		.from("saved_items")
		.insert(row)
		.select(SAVED_ITEM_SELECT)
		.maybeSingle();

	if (!insertResult.error && insertResult.data) {
		return { created: true, item: mapSavedItem(insertResult.data) };
	}
	if (!insertResult.error) throw new SavedReadingPersistenceError("No se pudo recuperar el guardado creado");

	if (insertResult.error.code !== "23505") {
		const error = new SavedReadingPersistenceError("No se pudo guardar la lectura");
		error.cause = insertResult.error;
		throw error;
	}

	const existing = await findSavedItem(
		supabase,
		userId,
		normalized.contentType,
		normalized.canonicalKey,
	);
	if (!existing) throw new SavedReadingPersistenceError("No se pudo recuperar el guardado existente");
	return { created: false, item: mapSavedItem(existing) };
}

export async function deleteSavedReading(supabase, userId, savedItemId) {
	const normalizedId = validateSavedReadingId(savedItemId);
	const result = await supabase
		.from("saved_items")
		.delete()
		.eq("id", normalizedId)
		.eq("user_id", userId)
		.select("id")
		.maybeSingle();
	const row = assertSupabaseResult(result, "No se pudo eliminar la lectura guardada");
	if (!row) throw new SavedReadingNotFoundError();
	return { id: row.id, deleted: true };
}

export { SAVED_ITEM_FIELDS, SAVED_ITEM_SELECT };
