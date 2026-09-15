import { validateReadingEntry } from "./validateReading.js";
import { validateLiturgicalMetadata } from "./liturgicalMetadata.js";

function isNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0;
}

function validateLegacyEntry(entry) {
	const errors = [];
	const gospel = entry?.gospel;

	if (!gospel?.reference) errors.push("falta gospel.reference");
	if (!gospel?.passageId) errors.push("falta gospel.passageId");
	if (!gospel?.excerpt) errors.push("falta gospel.excerpt");
	if (!gospel?.excerptReference) errors.push("falta gospel.excerptReference");
	if (!Array.isArray(gospel?.ranges) || gospel.ranges.length === 0) errors.push("faltan rangos estructurados");
	if (!isNonEmptyString(entry?.source?.provider)) errors.push("falta source.provider");
	if (!isNonEmptyString(entry?.source?.url)) errors.push("falta source.url");
	if (entry?.source?.verified !== true) errors.push("source.verified debe ser true");
	errors.push(...validateLiturgicalMetadata(entry).errors);

	return { valid: errors.length === 0, errors, legacy: true };
}

export function validatePublishedEntry(entry, { allowLegacy = true } = {}) {
	if (Array.isArray(entry?.readings)) {
		return { ...validateReadingEntry(entry), legacy: false };
	}

	if (!allowLegacy) {
		return {
			valid: false,
			errors: ["falta readings[]; la entrada todavía usa el formato legacy"],
			legacy: true,
		};
	}

	return validateLegacyEntry(entry);
}

export function getGospelReading(entry) {
	return entry?.readings?.find((reading) => reading?.type === "gospel") || entry?.gospel || null;
}
