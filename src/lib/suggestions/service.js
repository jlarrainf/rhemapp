import {
	createReadingVersionRollbackAuditEntry,
	createSuggestionAuditEntry,
	AUDIT_ACTIONS,
} from "../audit/events.js";
import { SUGGESTION_STATUS, SUGGESTION_STATUSES, canTransition } from "./constants.js";
import {
	SuggestionConflictError,
	SuggestionNotFoundError,
	SuggestionPersistenceError,
	SuggestionSelfReviewError,
	SuggestionValidationError,
	validatePublishedPayload,
	validateReviewPayload,
	validateRollbackId,
	validateSuggestionId,
	validateSuggestionPayload,
} from "./validation.js";
import { generateAndPersistLectioAdaptation } from "../lectio/service.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUGGESTION_FIELDS = [
	"id",
	"author_user_id",
	"date",
	"reading_type",
	"reference",
	"source_url",
	"body",
	"status",
	"created_at",
	"updated_at",
	"reviewed_at",
	"published_at",
].join(", ");
const EVENT_FIELDS = [
	"id",
	"suggestion_id",
	"actor_user_id",
	"from_status",
	"to_status",
	"comment",
	"created_at",
	"retention_until",
	"anonymized_at",
].join(", ");
const VERSION_FIELDS = [
	"id",
	"reading_key",
	"payload_json",
	"published_by",
	"source_suggestion_id",
	"rollback_of",
	"created_at",
	"superseded_at",
].join(", ");

function assertSupabaseResult(result, message) {
	if (result?.error) {
		const error = new SuggestionPersistenceError(message);
		error.cause = result.error;
		throw error;
	}
	return result.data;
}

function assertUserId(userId) {
	if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) {
		throw new SuggestionValidationError("La cuenta no es válida");
	}
	return userId.toLowerCase();
}

function addRetentionMonths(date = new Date()) {
	const result = new Date(date);
	result.setUTCFullYear(result.getUTCFullYear() + 1);
	return result.toISOString();
}

function mapSuggestion(row, author = null) {
	return {
		id: row.id,
		authorId: row.author_user_id,
		authorName: author?.display_name || null,
		date: row.date,
		readingType: row.reading_type,
		reference: row.reference,
		sourceUrl: row.source_url,
		body: row.body,
		status: row.status,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		reviewedAt: row.reviewed_at,
		publishedAt: row.published_at,
	};
}

function mapEvent(row) {
	return {
		id: row.id,
		suggestionId: row.suggestion_id,
		actorId: row.actor_user_id,
		fromStatus: row.from_status,
		toStatus: row.to_status,
		comment: row.comment,
		createdAt: row.created_at,
		retentionUntil: row.retention_until,
		anonymizedAt: row.anonymized_at,
	};
}

function mapVersion(row) {
	return {
		id: row.id,
		readingKey: row.reading_key,
		payload: row.payload_json,
		publishedBy: row.published_by,
		sourceSuggestionId: row.source_suggestion_id,
		rollbackOf: row.rollback_of,
		createdAt: row.created_at,
		supersededAt: row.superseded_at,
	};
}

async function insertAudit(supabaseAdmin, entry, message) {
	return assertSupabaseResult(await supabaseAdmin.from("audit_logs").insert(entry), message);
}

async function getSuggestionById(supabase, suggestionId, fields = SUGGESTION_FIELDS) {
	const id = validateSuggestionId(suggestionId);
	const row = assertSupabaseResult(
		await supabase.from("reading_suggestions").select(fields).eq("id", id).maybeSingle(),
		"No se pudo consultar la sugerencia",
	);
	if (!row) throw new SuggestionNotFoundError();
	return row;
}

export async function createSuggestion({ supabase, userId, payload }) {
	const authorUserId = assertUserId(userId);
	const normalized = validateSuggestionPayload(payload);
	const result = await supabase
		.from("reading_suggestions")
		.insert({
			author_user_id: authorUserId,
			date: normalized.date,
			reading_type: normalized.readingType,
			reference: normalized.reference,
			source_url: normalized.sourceUrl,
			body: normalized.body,
		})
		.select(SUGGESTION_FIELDS)
		.single();

	if (result.error?.code === "23505") {
		throw new SuggestionConflictError("Ya existe una sugerencia igual pendiente de revisión");
	}
	const row = assertSupabaseResult(result, "No se pudo guardar la sugerencia");
	return { suggestion: mapSuggestion(row) };
}

export async function listOwnSuggestions(supabase, userId) {
	const authorUserId = assertUserId(userId);
	const rows = assertSupabaseResult(
		await supabase
			.from("reading_suggestions")
			.select(SUGGESTION_FIELDS)
			.eq("author_user_id", authorUserId)
			.order("created_at", { ascending: false }),
		"No se pudieron cargar tus sugerencias",
	);
	return (rows || []).map((row) => mapSuggestion(row));
}

export async function listEditorialSuggestions({ supabaseAdmin, status = null, limit = 50 }) {
	if (status !== null && !SUGGESTION_STATUSES.includes(status)) {
		throw new SuggestionValidationError("El filtro de estado no es válido");
	}
	const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
	let query = supabaseAdmin
		.from("reading_suggestions")
		.select(SUGGESTION_FIELDS)
		.order("created_at", { ascending: true })
		.limit(safeLimit);
	if (status) query = query.eq("status", status);
	const rows = assertSupabaseResult(await query, "No se pudo cargar la cola editorial");
	const authorIds = [...new Set((rows || []).map((row) => row.author_user_id).filter(Boolean))];
	let authors = [];
	if (authorIds.length > 0) {
		authors = assertSupabaseResult(
			await supabaseAdmin.from("profiles").select("user_id, display_name").in("user_id", authorIds),
			"No se pudieron cargar los datos de trazabilidad",
		);
	}
	const authorsById = new Map((authors || []).map((author) => [author.user_id, author]));
	return (rows || []).map((row) => mapSuggestion(row, authorsById.get(row.author_user_id)));
}

export async function listSuggestionEvents({ supabaseAdmin, suggestionId }) {
	const id = validateSuggestionId(suggestionId);
	const rows = assertSupabaseResult(
		await supabaseAdmin.from("suggestion_events").select(EVENT_FIELDS).eq("suggestion_id", id).order("created_at", { ascending: true }),
		"No se pudo cargar el historial editorial",
	);
	return (rows || []).map(mapEvent);
}

export async function reviewSuggestion({ supabaseAdmin, suggestionId, actorUserId, payload, now = new Date() }) {
	const id = validateSuggestionId(suggestionId);
	const actorId = assertUserId(actorUserId);
	const review = validateReviewPayload(payload);
	const current = await getSuggestionById(supabaseAdmin, id);
	if (current.author_user_id === actorId) throw new SuggestionSelfReviewError();
	if (review.expectedStatus && review.expectedStatus !== current.status) {
		throw new SuggestionConflictError();
	}
	if (!canTransition(current.status, review.status) || review.status === SUGGESTION_STATUS.PUBLISHED) {
		throw new SuggestionConflictError(`No se puede cambiar de ${current.status} a ${review.status}`);
	}

	const reviewedAt = now.toISOString();
	const updated = assertSupabaseResult(
		await supabaseAdmin
			.from("reading_suggestions")
			.update({ status: review.status, reviewed_at: reviewedAt })
			.eq("id", id)
			.eq("status", current.status)
			.select(SUGGESTION_FIELDS)
			.maybeSingle(),
		"No se pudo actualizar el estado editorial",
	);
	if (!updated) throw new SuggestionConflictError();

	const eventResult = await supabaseAdmin
		.from("suggestion_events")
		.insert({
			suggestion_id: id,
			actor_user_id: actorId,
			from_status: current.status,
			to_status: review.status,
			comment: review.comment,
			retention_until: addRetentionMonths(now),
		})
		.select(EVENT_FIELDS)
		.single();
	if (eventResult.error) {
		await supabaseAdmin.from("reading_suggestions").update({ status: current.status, reviewed_at: current.reviewed_at }).eq("id", id).eq("status", review.status);
		throw new SuggestionPersistenceError("No se pudo registrar la decisión editorial");
	}

	try {
		await insertAudit(
			supabaseAdmin,
			createSuggestionAuditEntry({
				actorUserId: actorId,
				action: AUDIT_ACTIONS.suggestionReviewed,
				suggestionId: id,
				metadata: { fromStatus: current.status, toStatus: review.status, comment: review.comment },
			}),
			"No se pudo registrar la auditoría editorial",
		);
	} catch (error) {
		await supabaseAdmin.from("suggestion_events").delete().eq("id", eventResult.data.id);
		await supabaseAdmin.from("reading_suggestions").update({ status: current.status, reviewed_at: current.reviewed_at }).eq("id", id).eq("status", review.status);
		throw error;
	}

	return { suggestion: mapSuggestion(updated), event: mapEvent(eventResult.data) };
}

function validatePublishConsistency(suggestion, payload) {
	const reading = payload.readings.find((item) => item?.type === suggestion.reading_type);
	if (payload.date !== suggestion.date) throw new SuggestionValidationError("La entrada publicada debe usar la fecha de la sugerencia");
	if (!reading) throw new SuggestionValidationError("La entrada publicada debe contener el tipo de lectura sugerido");
	if (reading.reference !== suggestion.reference || reading.excerptReference !== suggestion.reference) {
		throw new SuggestionValidationError("La referencia publicada debe coincidir con la sugerencia");
	}
	if (payload.source?.url !== suggestion.source_url || payload.source?.verified !== true) {
		throw new SuggestionValidationError("La fuente principal debe coincidir y estar verificada");
	}
	if (reading.source?.url !== suggestion.source_url || reading.source?.verified !== true) {
		throw new SuggestionValidationError("La fuente de la lectura debe coincidir y estar verificada");
	}
}

async function getActiveVersion(supabaseAdmin, readingKey) {
	return assertSupabaseResult(
		await supabaseAdmin
			.from("published_reading_versions")
			.select(VERSION_FIELDS)
			.eq("reading_key", readingKey)
			.is("superseded_at", null)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle(),
		"No se pudo consultar la versión publicada",
	);
}

async function replaceActiveVersion({ supabaseAdmin, readingKey, payload, actorUserId, sourceSuggestionId = null, rollbackOf = null, now = new Date() }) {
	const active = await getActiveVersion(supabaseAdmin, readingKey);
	const supersededAt = now.toISOString();
	if (active) {
		const updated = assertSupabaseResult(
			await supabaseAdmin
				.from("published_reading_versions")
				.update({ superseded_at: supersededAt })
				.eq("id", active.id)
				.is("superseded_at", null)
				.select("id")
				.maybeSingle(),
			"No se pudo cerrar la versión publicada anterior",
		);
		if (!updated) throw new SuggestionConflictError("La versión publicada cambió mientras se procesaba la operación");
	}

	const inserted = await supabaseAdmin
		.from("published_reading_versions")
		.insert({
			reading_key: readingKey,
			payload_json: payload,
			published_by: actorUserId,
			source_suggestion_id: sourceSuggestionId,
			rollback_of: rollbackOf,
		})
		.select(VERSION_FIELDS)
		.single();
	if (inserted.error) {
		if (active) await supabaseAdmin.from("published_reading_versions").update({ superseded_at: null }).eq("id", active.id).eq("superseded_at", supersededAt);
		if (inserted.error.code === "23505") throw new SuggestionConflictError("La publicación cambió mientras se procesaba la operación");
		throw new SuggestionPersistenceError("No se pudo crear la versión publicada");
	}

	return { active, version: inserted.data, supersededAt };
}

async function undoVersionReplacement({ supabaseAdmin, replacement, suggestionId = null, restoreSuggestion = false }) {
	if (replacement?.version?.id) {
		await supabaseAdmin.from("published_reading_versions").delete().eq("id", replacement.version.id);
	}
	if (replacement?.active?.id) {
		await supabaseAdmin
			.from("published_reading_versions")
			.update({ superseded_at: null })
			.eq("id", replacement.active.id)
			.eq("superseded_at", replacement.supersededAt);
	}
	if (restoreSuggestion && suggestionId) {
		await supabaseAdmin
			.from("reading_suggestions")
			.update({ status: SUGGESTION_STATUS.APPROVED, published_at: null })
			.eq("id", suggestionId)
			.eq("status", SUGGESTION_STATUS.PUBLISHED);
	}
}

export async function publishSuggestion({ supabaseAdmin, suggestionId, actorUserId, payload, now = new Date() }) {
	const id = validateSuggestionId(suggestionId);
	const actorId = assertUserId(actorUserId);
	const suggestion = await getSuggestionById(supabaseAdmin, id);
	if (suggestion.status !== SUGGESTION_STATUS.APPROVED) {
		throw new SuggestionConflictError("Solo se puede publicar una sugerencia aprobada");
	}
	const normalizedPayload = validatePublishedPayload(payload);
	validatePublishConsistency(suggestion, normalizedPayload);
	const readingKey = `chile:${suggestion.date}`;
	const replacement = await replaceActiveVersion({
		supabaseAdmin,
		readingKey,
		payload: normalizedPayload,
		actorUserId: actorId,
		sourceSuggestionId: id,
		now,
	});

	const updated = await supabaseAdmin
		.from("reading_suggestions")
		.update({ status: SUGGESTION_STATUS.PUBLISHED, published_at: now.toISOString() })
		.eq("id", id)
		.eq("status", SUGGESTION_STATUS.APPROVED)
		.select(SUGGESTION_FIELDS)
		.maybeSingle();
	if (updated.error || !updated.data) {
		await undoVersionReplacement({ supabaseAdmin, replacement, suggestionId: id, restoreSuggestion: false });
		if (updated.error) throw new SuggestionPersistenceError("No se pudo marcar la sugerencia como publicada");
		throw new SuggestionConflictError();
	}

	const eventResult = await supabaseAdmin
		.from("suggestion_events")
		.insert({
			suggestion_id: id,
			actor_user_id: actorId,
			from_status: SUGGESTION_STATUS.APPROVED,
			to_status: SUGGESTION_STATUS.PUBLISHED,
			comment: "Publicación validada",
			retention_until: addRetentionMonths(now),
		})
		.select(EVENT_FIELDS)
		.single();
	if (eventResult.error) {
		await undoVersionReplacement({ supabaseAdmin, replacement, suggestionId: id, restoreSuggestion: true });
		throw new SuggestionPersistenceError("No se pudo registrar el evento de publicación");
	}

	try {
		await insertAudit(
			supabaseAdmin,
			createSuggestionAuditEntry({
				actorUserId: actorId,
				action: AUDIT_ACTIONS.suggestionPublished,
				suggestionId: id,
				metadata: { readingKey, versionId: replacement.version.id },
			}),
			"No se pudo registrar la publicación editorial",
		);
	} catch (error) {
		await supabaseAdmin.from("suggestion_events").delete().eq("id", eventResult.data.id);
		await undoVersionReplacement({ supabaseAdmin, replacement, suggestionId: id, restoreSuggestion: true });
		throw error;
	}

	try {
		await generateAndPersistLectioAdaptation({
			supabaseAdmin,
			readingKey,
			reading: normalizedPayload,
			now,
			trigger: "publication",
		});
	} catch (error) {
		console.error("Lectio no pudo prepararse después de publicar la lectura", {
			name: error?.name || "UnknownError",
			code: error?.code || null,
		});
	}

	return { suggestion: mapSuggestion(updated.data), version: mapVersion(replacement.version), event: mapEvent(eventResult.data) };
}

export async function rollbackPublishedVersion({ supabaseAdmin, versionId, actorUserId, now = new Date() }) {
	const id = validateRollbackId(versionId);
	const actorId = assertUserId(actorUserId);
	const target = assertSupabaseResult(
		await supabaseAdmin.from("published_reading_versions").select(VERSION_FIELDS).eq("id", id).maybeSingle(),
		"No se pudo consultar la versión a revertir",
	);
	if (!target) throw new SuggestionNotFoundError("No se encontró la versión publicada");
	if (target.superseded_at) throw new SuggestionConflictError("Solo se puede revertir la versión publicada activa");

	const previous = assertSupabaseResult(
		await supabaseAdmin
			.from("published_reading_versions")
			.select(VERSION_FIELDS)
			.eq("reading_key", target.reading_key)
			.lt("created_at", target.created_at)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle(),
		"No se pudo consultar la versión anterior",
	);
	if (!previous) throw new SuggestionNotFoundError("No existe una versión anterior para revertir");
	validatePublishedPayload(previous.payload_json);
	const replacement = await replaceActiveVersion({
		supabaseAdmin,
		readingKey: target.reading_key,
		payload: previous.payload_json,
		actorUserId: actorId,
		sourceSuggestionId: previous.source_suggestion_id,
		rollbackOf: target.id,
		now,
	});
	try {
		await insertAudit(
			supabaseAdmin,
			createReadingVersionRollbackAuditEntry({
				actorUserId: actorId,
				versionId: target.id,
				readingKey: target.reading_key,
				replacementVersionId: replacement.version.id,
			}),
			"No se pudo registrar la reversión editorial",
		);
	} catch (error) {
		await undoVersionReplacement({ supabaseAdmin, replacement });
		throw error;
	}
	return { version: mapVersion(replacement.version), restoredFrom: mapVersion(previous) };
}

export async function deleteSuggestion({ supabaseAdmin, suggestionId, actorUserId }) {
	const id = validateSuggestionId(suggestionId);
	const actorId = assertUserId(actorUserId);
	const current = await getSuggestionById(supabaseAdmin, id);
	if (current.status !== SUGGESTION_STATUS.REJECTED) {
		throw new SuggestionConflictError("Solo se puede eliminar una sugerencia rechazada");
	}
	await insertAudit(
		supabaseAdmin,
		createSuggestionAuditEntry({ actorUserId: actorId, action: AUDIT_ACTIONS.suggestionDeleted, suggestionId: id, metadata: { previousStatus: current.status } }),
		"No se pudo registrar la eliminación editorial",
	);
	const result = await supabaseAdmin.from("reading_suggestions").delete().eq("id", id).eq("status", SUGGESTION_STATUS.REJECTED).select("id").maybeSingle();
	const row = assertSupabaseResult(result, "No se pudo eliminar la sugerencia");
	if (!row) throw new SuggestionConflictError();
	return { id: row.id, deleted: true };
}

export { EVENT_FIELDS, SUGGESTION_FIELDS, VERSION_FIELDS, mapSuggestion, mapVersion };
