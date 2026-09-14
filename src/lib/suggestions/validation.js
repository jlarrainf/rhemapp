import { validatePublishedEntry } from "../readings/validatePublishedEntry.js";
import { READING_TYPES, SUGGESTION_LIMITS, SUGGESTION_STATUSES, REVIEWABLE_STATUSES } from "./constants.js";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REFERENCE_PATTERN = /^[\p{L}\d][\p{L}\d .'-]*\s+\d+(?:\s*[:.,]\s*\d+[a-z]?(?:\s*[-—]\s*(?:\d+\s*[:.]\s*)?\d+[a-z]?)?(?:\s*[,;. ]\s*\d+[a-z]?(?:\s*[-—]\s*\d+[a-z]?)?)*)?$/u;

export class SuggestionValidationError extends Error {
	constructor(message, errors = []) {
		super(message);
		this.name = "SuggestionValidationError";
		this.errors = errors.length > 0 ? errors : [message];
		this.status = 422;
	}
}

export class SuggestionNotFoundError extends Error {
	constructor(message = "No se encontró la sugerencia") {
		super(message);
		this.name = "SuggestionNotFoundError";
		this.status = 404;
	}
}

export class SuggestionConflictError extends Error {
	constructor(message = "La sugerencia cambió mientras la revisabas. Recarga la cola e inténtalo nuevamente") {
		super(message);
		this.name = "SuggestionConflictError";
		this.status = 409;
	}
}

export class SuggestionSelfReviewError extends Error {
	constructor() {
		super("No puedes revisar tu propia sugerencia");
		this.name = "SuggestionSelfReviewError";
		this.status = 403;
	}
}

export class SuggestionPersistenceError extends Error {
	constructor(message = "No se pudo guardar la sugerencia") {
		super(message);
		this.name = "SuggestionPersistenceError";
		this.status = 503;
	}
}

export class SuggestionRateLimitError extends Error {
	constructor(retryAfterSeconds = 3600) {
		super("Se alcanzó el límite temporal de sugerencias. Inténtalo más tarde");
		this.name = "SuggestionRateLimitError";
		this.status = 429;
		this.retryAfterSeconds = retryAfterSeconds;
	}
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value, fieldName, maximumLength) {
	if (typeof value !== "string") throw new SuggestionValidationError(`${fieldName} es requerido`);
	const normalized = value.trim();
	if (!normalized) throw new SuggestionValidationError(`${fieldName} no puede estar vacío`);
	if (normalized.length > maximumLength) {
		throw new SuggestionValidationError(`${fieldName} supera el máximo permitido de ${maximumLength} caracteres`);
	}
	return normalized;
}

function isValidIsoDate(value) {
	if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function isValidReadingReference(value) {
	return typeof value === "string"
		&& value.trim().length > 0
		&& value.trim().length <= SUGGESTION_LIMITS.maxReferenceLength
		&& REFERENCE_PATTERN.test(value.trim());
}

function normalizeSourceUrl(value) {
	const sourceUrl = normalizeText(value, "La fuente", SUGGESTION_LIMITS.maxSourceUrlLength);
	let parsed;
	try {
		parsed = new URL(sourceUrl);
	} catch {
		throw new SuggestionValidationError("La fuente debe ser una URL válida");
	}
	if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
		throw new SuggestionValidationError("La fuente debe usar una URL HTTP(S) pública");
	}
	return parsed.toString();
}

function assertKnownFields(payload, allowedFields, label) {
	const fields = Object.keys(payload).sort();
	const allowed = [...allowedFields].sort();
	if (fields.length !== allowed.length || fields.some((field, index) => field !== allowed[index])) {
		throw new SuggestionValidationError(`${label} contiene campos no permitidos`);
	}
}

export function validateSuggestionPayload(payload) {
	if (!isPlainObject(payload)) throw new SuggestionValidationError("La sugerencia debe enviarse como un objeto JSON");
	assertKnownFields(payload, ["body", "date", "readingType", "reference", "sourceUrl"], "La sugerencia");
	if (!isValidIsoDate(payload.date)) throw new SuggestionValidationError("La fecha debe usar el formato válido YYYY-MM-DD");
	if (!READING_TYPES.includes(payload.readingType)) {
		throw new SuggestionValidationError("El tipo de lectura no está disponible");
	}
	const reference = normalizeText(payload.reference, "La referencia", SUGGESTION_LIMITS.maxReferenceLength);
	if (!isValidReadingReference(reference)) throw new SuggestionValidationError("La referencia bíblica no es válida");
	const body = normalizeText(payload.body, "La descripción", SUGGESTION_LIMITS.maxBodyLength);
	if (/[<>]/.test(body) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(body)) {
		throw new SuggestionValidationError("La descripción contiene caracteres no permitidos");
	}

	return {
		date: payload.date,
		readingType: payload.readingType,
		reference,
		sourceUrl: normalizeSourceUrl(payload.sourceUrl),
		body,
	};
}

export function validateSuggestionId(value) {
	if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
		throw new SuggestionValidationError("El identificador de la sugerencia no es válido");
	}
	return value.toLowerCase();
}

export function validateReviewPayload(payload) {
	if (!isPlainObject(payload)) throw new SuggestionValidationError("La revisión debe enviarse como un objeto JSON");
	const fields = Object.keys(payload);
	if (fields.some((field) => !["status", "comment", "expectedStatus"].includes(field))) {
		throw new SuggestionValidationError("La revisión contiene campos no permitidos");
	}
	if (!REVIEWABLE_STATUSES.includes(payload.status)) {
		throw new SuggestionValidationError("El estado editorial no es válido");
	}
	const comment = normalizeText(payload.comment, "El comentario editorial", SUGGESTION_LIMITS.maxCommentLength);
	if (payload.expectedStatus !== undefined && !SUGGESTION_STATUSES.includes(payload.expectedStatus)) {
		throw new SuggestionValidationError("El estado esperado no es válido");
	}
	return { status: payload.status, comment, expectedStatus: payload.expectedStatus || null };
}

export function validatePublishedPayload(payload) {
	const validation = validatePublishedEntry(payload, { allowLegacy: false });
	if (!validation.valid) {
		throw new SuggestionValidationError(
			"La entrada que se quiere publicar no está completa ni verificada",
			validation.errors,
		);
	}
	return payload;
}

export function validateRollbackId(value) {
	if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
		throw new SuggestionValidationError("El identificador de la versión no es válido");
	}
	return value.toLowerCase();
}

export { isPlainObject, isValidIsoDate };
