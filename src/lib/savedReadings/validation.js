import { createSavedReadingIdentity, SavedReadingKeyError } from "./canonicalKeys.js";

const MAX_TITLE_LENGTH = 500;
const MAX_REFERENCE_LENGTH = 300;
const MAX_EXCERPT_LENGTH = 2000;

export class SavedReadingValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = "SavedReadingValidationError";
		this.status = 422;
	}
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value, fieldName, maximumLength) {
	if (typeof value !== "string") throw new SavedReadingValidationError(`${fieldName} es requerido`);
	const normalized = value.trim();
	if (!normalized) throw new SavedReadingValidationError(`${fieldName} no puede estar vacío`);
	if (normalized.length > maximumLength) {
		throw new SavedReadingValidationError(`${fieldName} supera el máximo permitido`);
	}
	return normalized;
}

function getReadingSource(payload) {
	if (isPlainObject(payload.reading)) return payload.reading;
	if (isPlainObject(payload.entry?.gospel)) return payload.entry.gospel;
	if (isPlainObject(payload.gospel)) return payload.gospel;
	if (isPlainObject(payload.verse)) return payload.verse;
	return payload;
}

function getSnapshotInput(payload) {
	if (payload.snapshot === undefined) return {};
	if (!isPlainObject(payload.snapshot)) {
		throw new SavedReadingValidationError("El snapshot debe ser un objeto");
	}
	return payload.snapshot;
}

function getFirstString(...values) {
	return values.find((value) => typeof value === "string" && value.trim()) ?? null;
}

function getSnapshotSource(payload) {
	const source = isPlainObject(payload.reading?.source)
		? payload.reading.source
		: isPlainObject(payload.source) ? payload.source : null;
	if (!source) return null;

	const provider = typeof source.provider === "string" ? source.provider.trim().slice(0, 200) : "";
	const url = typeof source.url === "string" ? source.url.trim().slice(0, 500) : "";
	const verified = typeof source.verified === "boolean" ? source.verified : undefined;
	if (url) {
		try {
			const parsed = new URL(url);
			if (!['http:', 'https:'].includes(parsed.protocol)) return null;
		} catch {
			return null;
		}
	}
	if (!provider && !url && verified === undefined) return null;
	return {
		...(provider ? { provider } : {}),
		...(url ? { url } : {}),
		...(verified !== undefined ? { verified } : {}),
	};
}

function getSnapshotMetadata(payload, contentType) {
	const source = getSnapshotSource(payload);
	if (contentType === "liturgical-reading") {
		const entry = isPlainObject(payload.entry) ? payload.entry : payload;
		const reading = isPlainObject(payload.reading) ? payload.reading : null;
		return {
			...(typeof payload.date === "string" || typeof entry.date === "string"
				? { date: payload.date ?? entry.date }
				: {}),
			...(typeof payload.calendar === "string" || typeof entry.calendar === "string"
				? { calendar: payload.calendar ?? entry.calendar }
				: {}),
			...(typeof payload.readingType === "string" || typeof reading?.type === "string"
				? { readingType: payload.readingType ?? reading.type }
				: {}),
			...(source ? { source } : {}),
		};
	}

	if (contentType === "random-verse") {
		return {
			...(typeof payload.verseId === "string" ? { verseId: payload.verseId } : {}),
			...(typeof payload.passageId === "string" && payload.verseId === undefined
				? { passageId: payload.passageId }
				: {}),
			...(source ? { source } : {}),
		};
	}

	return {
		...(typeof payload.bibleId === "string" ? { bibleId: payload.bibleId } : {}),
		...(typeof payload.passageId === "string" ? { passageId: payload.passageId } : {}),
		...(Array.isArray(payload.ranges) ? { ranges: payload.ranges } : {}),
		...(source ? { source } : {}),
	};
}

export function validateSavedReadingPayload(payload) {
	if (!isPlainObject(payload)) throw new SavedReadingValidationError("El cuerpo debe ser un objeto JSON");

	let identity;
	try {
		identity = createSavedReadingIdentity(payload);
	} catch (error) {
		if (error instanceof SavedReadingKeyError) throw error;
		throw new SavedReadingValidationError("El contenido no es válido para guardar");
	}

	const source = getReadingSource(payload);
	const snapshotInput = getSnapshotInput(payload);
	const reference = normalizeText(
		getFirstString(snapshotInput.reference, source.reference, payload.reference),
		"La referencia",
		MAX_REFERENCE_LENGTH,
	);
	const title = normalizeText(
		getFirstString(snapshotInput.title, source.title, payload.title, reference),
		"El título",
		MAX_TITLE_LENGTH,
	);
	const excerpt = normalizeText(
		getFirstString(snapshotInput.excerpt, source.excerpt, payload.excerpt, source.verse, payload.verse),
		"El extracto",
		MAX_EXCERPT_LENGTH,
	);

	const snapshot = {
		contentType: identity.contentType,
		canonicalKey: identity.canonicalKey,
		title,
		reference,
		excerpt,
		metadata: getSnapshotMetadata(payload, identity.contentType),
	};

	return {
		...identity,
		title,
		reference,
		snapshot,
		snapshotJson: snapshot,
	};
}
