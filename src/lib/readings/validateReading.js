import { validateLiturgicalMetadata } from "./liturgicalMetadata.js";

const READING_TYPES = Object.freeze([
	"first-reading",
	"psalm",
	"second-reading",
	"gospel",
]);

const REQUIRED_READING_TYPES = Object.freeze([
	"first-reading",
	"psalm",
	"gospel",
]);

const ORDER_BY_TYPE = Object.freeze({
	"first-reading": 1,
	psalm: 2,
	"second-reading": 3,
	gospel: 4,
});

const REFERENCE_PATTERN = /^[\p{L}\d][\p{L}\d .'-]*\s+\d+(?:\s*[:.,]\s*\d+[a-z]?(?:\s*[-—]\s*(?:\d+\s*[:.]\s*)?\d+[a-z]?)?(?:\s*[,;. ]\s*\d+[a-z]?(?:\s*[-—]\s*\d+[a-z]?)?)*)?$/u;
const PASSAGE_ID_PATTERN = /^[A-Z0-9]{3}\.\d+\.[0-9]+[a-z]?(?:-[0-9]+(?:\.[0-9]+)?[a-z]?)?(?:,[0-9]+[a-z]?(?:-[0-9]+(?:\.[0-9]+)?[a-z]?)?)*$/;
const SUFFIX_PATTERN = /^[a-z]$/;

export class ReadingValidationError extends Error {
	constructor(errors) {
		super(`La entrada litúrgica no es válida: ${errors.join("; ")}`);
		this.name = "ReadingValidationError";
		this.errors = errors;
	}
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value, maximumLength = 500) {
	return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maximumLength;
}

function isValidIsoDate(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year
		&& date.getUTCMonth() === month - 1
		&& date.getUTCDate() === day;
}

function isValidReference(value) {
	return isNonEmptyString(value, 200) && REFERENCE_PATTERN.test(value.trim());
}

function isValidPassageId(value) {
	return isNonEmptyString(value, 200) && PASSAGE_ID_PATTERN.test(value.trim());
}

function isValidSource(source) {
	if (!isPlainObject(source)) return false;
	if (!isNonEmptyString(source.provider, 200) || source.verified !== true) return false;

	try {
		const url = new URL(source.url);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function isPositiveInteger(value) {
	return Number.isInteger(value) && value > 0;
}

function validateRange(range, path, errors) {
	if (!isPlainObject(range)) {
		errors.push(`${path}: debe ser un objeto`);
		return null;
	}

	if (!isPositiveInteger(range.chapter)) errors.push(`${path}.chapter: debe ser un entero positivo`);
	if (!isPositiveInteger(range.start)) errors.push(`${path}.start: debe ser un entero positivo`);
	if (!isPositiveInteger(range.end)) errors.push(`${path}.end: debe ser un entero positivo`);

	for (const suffixField of ["startSuffix", "endSuffix"]) {
		if (range[suffixField] !== undefined && (typeof range[suffixField] !== "string" || !SUFFIX_PATTERN.test(range[suffixField]))) {
			errors.push(`${path}.${suffixField}: debe ser una letra minúscula`);
		}
	}

	if ("endChapter" in range && !isPositiveInteger(range.endChapter)) {
		errors.push(`${path}.endChapter: debe ser un entero positivo`);
	}

	if (isPositiveInteger(range.chapter) && isPositiveInteger(range.endChapter) && range.endChapter < range.chapter) {
		errors.push(`${path}: el capítulo final no puede ser anterior al inicial`);
	}

	if ((!range.endChapter || range.endChapter === range.chapter)
		&& isPositiveInteger(range.start)
		&& isPositiveInteger(range.end)
		&& range.end < range.start) {
		errors.push(`${path}: el versículo final no puede ser anterior al inicial`);
	}

	return range;
}

function compareRangeStart(left, right) {
	if (left.chapter !== right.chapter) return left.chapter - right.chapter;
	return left.start - right.start;
}

function validateRanges(ranges, path, errors) {
	if (!Array.isArray(ranges) || ranges.length === 0) {
		errors.push(`${path}: debe contener al menos un rango`);
		return;
	}

	const validRanges = ranges
		.map((range, index) => validateRange(range, `${path}[${index}]`, errors))
		.filter(Boolean);

	for (let index = 1; index < validRanges.length; index += 1) {
		if (compareRangeStart(validRanges[index - 1], validRanges[index]) > 0) {
			errors.push(`${path}: los rangos deben estar ordenados`);
			break;
		}
	}
}

function validateSource(source, path, errors) {
	if (!isValidSource(source)) {
		errors.push(`${path}: requiere proveedor, URL HTTP(S) y verificación explícita`);
	}
}

function validateReading(reading, index, errors) {
	const path = `readings[${index}]`;
	if (!isPlainObject(reading)) {
		errors.push(`${path}: debe ser un objeto`);
		return;
	}

	if (!READING_TYPES.includes(reading.type)) {
		errors.push(`${path}.type: tipo de lectura no permitido`);
	}

	if (!Number.isInteger(reading.order) || reading.order < 1 || reading.order > READING_TYPES.length) {
		errors.push(`${path}.order: debe ser un entero entre 1 y 4`);
	} else if (READING_TYPES.includes(reading.type) && reading.order !== ORDER_BY_TYPE[reading.type]) {
		errors.push(`${path}.order: no corresponde al tipo ${reading.type}`);
	}

	if (!isValidReference(reading.reference)) errors.push(`${path}.reference: referencia bíblica inválida`);
	if (!isValidPassageId(reading.passageId)) errors.push(`${path}.passageId: identificador de pasaje inválido`);
	validateRanges(reading.ranges, `${path}.ranges`, errors);
	if (!isNonEmptyString(reading.title, 500)) errors.push(`${path}.title: título requerido`);
	if (!isNonEmptyString(reading.excerpt, 2000)) errors.push(`${path}.excerpt: extracto requerido`);
	if (!isValidReference(reading.excerptReference)) {
		errors.push(`${path}.excerptReference: referencia del extracto inválida`);
	}
	validateSource(reading.source, `${path}.source`, errors);
}

export function validateReadingEntry(entry) {
	const errors = [];

	if (!isPlainObject(entry)) return { valid: false, errors: ["entrada: debe ser un objeto"] };
	if (!isValidIsoDate(entry.date)) errors.push("date: debe usar una fecha ISO válida (YYYY-MM-DD)");
	if (entry.calendar !== "chile") errors.push("calendar: debe ser chile");
	if (typeof entry.liturgicalYear !== "string" || !/^\d{4}$/.test(entry.liturgicalYear)) {
		errors.push("liturgicalYear: debe usar el formato YYYY");
	}
	if (typeof entry.celebration !== "string") errors.push("celebration: debe ser una cadena");
	validateSource(entry.source, "source", errors);
	const metadataValidation = validateLiturgicalMetadata(entry);
	errors.push(...metadataValidation.errors);

	if (!Array.isArray(entry.readings) || entry.readings.length === 0) {
		errors.push("readings: debe contener lecturas");
		return { valid: errors.length === 0, errors };
	}

	entry.readings.forEach((reading, index) => validateReading(reading, index, errors));

	const validTypes = entry.readings
		.map((reading) => reading?.type)
		.filter((type) => READING_TYPES.includes(type));
	const duplicateTypes = validTypes.filter((type, index) => validTypes.indexOf(type) !== index);
	if (duplicateTypes.length > 0) errors.push(`readings: no puede repetir tipos (${[...new Set(duplicateTypes)].join(", ")})`);

	for (const requiredType of REQUIRED_READING_TYPES) {
		if (!validTypes.includes(requiredType)) errors.push(`readings: falta la lectura obligatoria ${requiredType}`);
	}

	const expectedOrder = entry.readings.map((reading) => ORDER_BY_TYPE[reading?.type]).filter(Boolean);
	if (expectedOrder.some((order, index) => order !== entry.readings[index]?.order)) {
		errors.push("readings: las lecturas deben estar en orden litúrgico");
	}

	return { valid: errors.length === 0, errors };
}

export function assertValidReadingEntry(entry) {
	const result = validateReadingEntry(entry);
	if (!result.valid) throw new ReadingValidationError(result.errors);
	return entry;
}

export const READING_ORDER = ORDER_BY_TYPE;
export const READING_TYPES_LIST = READING_TYPES;
