import { createCanonicalKey, DEFAULT_BIBLE_ID } from "../savedReadings/canonicalKeys.js";

export const PUBLIC_SHARE_CONTENT_TYPES = Object.freeze([
	"liturgical-reading",
	"random-verse",
	"bible-passage",
]);

export const PUBLIC_SHARE_MODES = Object.freeze([
	"today",
	"date",
	"sunday",
	"random",
	"passage",
]);

export const PUBLIC_READING_TYPES = Object.freeze([
	"first-reading",
	"psalm",
	"second-reading",
	"gospel",
]);

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VERSE_ID_PATTERN = /^[A-Z0-9]{3}\.\d+\.[0-9]+[a-z]?(?:-(?:(?:[A-Z0-9]{3}\.)?\d+(?:\.\d+)?[a-z]?))?$/i;
const UUID_SAFE_ORIGIN_PATTERN = /^https?:\/\//i;

export class PublicShareValidationError extends Error {
	constructor(message = "El enlace compartido no es válido") {
		super(message);
		this.name = "PublicShareValidationError";
		this.status = 400;
	}
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireString(value, fieldName, maximumLength = 200) {
	if (typeof value !== "string" || !value.trim() || value.length > maximumLength) {
		throw new PublicShareValidationError(`${fieldName} no es válido`);
	}
	return value.trim();
}

function normalizeDate(value) {
	const date = requireString(value, "La fecha", 10);
	if (!ISO_DATE_PATTERN.test(date)) throw new PublicShareValidationError("La fecha no es válida");
	const parsed = new Date(`${date}T00:00:00.000Z`);
	if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
		throw new PublicShareValidationError("La fecha no es válida");
	}
	return date;
}

function normalizeMode(value, allowedModes) {
	const mode = requireString(value, "El modo", 20).toLowerCase();
	if (!allowedModes.includes(mode)) throw new PublicShareValidationError("El modo no es válido");
	return mode;
}

function normalizeReadingType(value) {
	const readingType = requireString(value, "El tipo de lectura", 40).toLowerCase();
	if (!PUBLIC_READING_TYPES.includes(readingType)) {
		throw new PublicShareValidationError("El tipo de lectura no es válido");
	}
	return readingType;
}

function normalizeCalendar(value = "chile") {
	const calendar = requireString(value, "El calendario", 40).toLowerCase();
	if (calendar !== "chile") throw new PublicShareValidationError("El calendario no está disponible");
	return calendar;
}

function normalizeVerseId(value) {
	const verseId = requireString(value, "El ID del versículo", 160).toUpperCase();
	if (!VERSE_ID_PATTERN.test(verseId)) throw new PublicShareValidationError("El ID del versículo no es válido");
	return verseId;
}

function normalizeRange(range) {
	if (!isPlainObject(range)) throw new PublicShareValidationError("Los rangos del pasaje no son válidos");
	const chapter = Number(range.chapter);
	const start = Number(range.start);
	const end = Number(range.end ?? range.start);
	const endChapter = Number(range.endChapter ?? range.chapter);
	const validSuffix = (suffix) => suffix === undefined || (typeof suffix === "string" && /^[a-z]$/i.test(suffix));
	if (![chapter, start, end, endChapter].every((number) => Number.isInteger(number) && number > 0)
		|| endChapter < chapter
		|| (endChapter === chapter && end < start)
		|| !validSuffix(range.startSuffix)
		|| !validSuffix(range.endSuffix)) {
		throw new PublicShareValidationError("Los rangos del pasaje no son válidos");
	}
	return {
		chapter,
		start,
		end,
		...(endChapter !== chapter ? { endChapter } : {}),
		...(range.startSuffix !== undefined ? { startSuffix: range.startSuffix.toLowerCase() } : {}),
		...(range.endSuffix !== undefined ? { endSuffix: range.endSuffix.toLowerCase() } : {}),
	};
}

function normalizeRanges(value) {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value) || value.length > 32) {
		throw new PublicShareValidationError("Los rangos del pasaje no son válidos");
	}
	const unique = new Map();
	for (const range of value.map(normalizeRange)) {
		const key = JSON.stringify(range);
		unique.set(key, range);
	}
	return [...unique.values()].sort((left, right) =>
		left.chapter - right.chapter
		|| left.start - right.start
		|| (left.endChapter || left.chapter) - (right.endChapter || right.chapter)
		|| left.end - right.end
		|| (left.startSuffix || "").localeCompare(right.startSuffix || "")
		|| (left.endSuffix || "").localeCompare(right.endSuffix || ""));
}

function normalizePublicDescriptor(input) {
	if (!isPlainObject(input)) throw new PublicShareValidationError("El contenido compartido no es válido");
	const contentType = requireString(input.contentType ?? input.type, "El tipo de contenido", 40).toLowerCase();
	if (!PUBLIC_SHARE_CONTENT_TYPES.includes(contentType)) {
		throw new PublicShareValidationError("El tipo de contenido no está disponible para compartir");
	}

	if (contentType === "liturgical-reading") {
		const date = normalizeDate(input.date);
		const calendar = normalizeCalendar(input.calendar);
		const readingType = normalizeReadingType(input.readingType ?? input.typeOfReading);
		const mode = normalizeMode(input.mode ?? "date", ["today", "date", "sunday"]);
		return { contentType, date, calendar, mode, readingType };
	}

	if (contentType === "random-verse") {
		return {
			contentType,
			mode: normalizeMode(input.mode ?? "random", ["random"]),
			verseId: normalizeVerseId(input.verseId ?? input.passageId),
		};
	}

	const bibleId = requireString(input.bibleId ?? DEFAULT_BIBLE_ID, "La traducción bíblica", 100).toLowerCase();
	const passageId = requireString(input.passageId ?? input.chapterId, "El ID del pasaje", 160).toUpperCase();
	const ranges = normalizeRanges(input.ranges);
	try {
		createCanonicalKey({ contentType, bibleId, passageId, ranges });
	} catch {
		throw new PublicShareValidationError("El pasaje compartido no es válido");
	}
	if (bibleId !== DEFAULT_BIBLE_ID) {
		throw new PublicShareValidationError("La traducción bíblica solicitada no está disponible");
	}
	return { contentType, mode: normalizeMode(input.mode ?? "passage", ["passage"]), bibleId, passageId, ranges };
}

export function normalizePublicShareDescriptor(input) {
	return normalizePublicDescriptor(input);
}

export function buildPublicShareUrl(input, origin) {
	const descriptor = normalizePublicDescriptor(input);
	const base = typeof origin === "string" && UUID_SAFE_ORIGIN_PATTERN.test(origin)
		? origin
		: "http://localhost:3000";
	const url = new URL("/share", base);
	url.searchParams.set("type", descriptor.contentType);
	url.searchParams.set("mode", descriptor.mode);

	if (descriptor.contentType === "liturgical-reading") {
		url.searchParams.set("date", descriptor.date);
		url.searchParams.set("calendar", descriptor.calendar);
		url.searchParams.set("readingType", descriptor.readingType);
	} else if (descriptor.contentType === "random-verse") {
		url.searchParams.set("verseId", descriptor.verseId);
	} else {
		url.searchParams.set("bibleId", descriptor.bibleId);
		url.searchParams.set("passageId", descriptor.passageId);
		if (descriptor.ranges.length > 0) url.searchParams.set("ranges", JSON.stringify(descriptor.ranges));
	}

	return url.toString();
}

export function buildPrivateShareUrl(token, origin) {
	if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
		throw new PublicShareValidationError("El token de compartir no es válido");
	}
	const base = typeof origin === "string" && UUID_SAFE_ORIGIN_PATTERN.test(origin)
		? origin
		: "http://localhost:3000";
	return new URL(`/share/${token}`, base).toString();
}

function getSingleParam(searchParams, name, required = false) {
	let values;
	if (typeof searchParams?.getAll === "function") {
		values = searchParams.getAll(name);
	} else {
		const value = searchParams?.[name];
		values = value === undefined ? [] : Array.isArray(value) ? value : [value];
	}
	if (values.length > 1) throw new PublicShareValidationError("El enlace compartido no es válido");
	if (required && !values[0]) throw new PublicShareValidationError("El enlace compartido está incompleto");
	return values[0];
}

function parseRangesParam(value) {
	if (value === undefined) return undefined;
	try {
		return JSON.parse(value);
	} catch {
		throw new PublicShareValidationError("Los rangos del pasaje no son válidos");
	}
}

export function parsePublicShareSearchParams(searchParams) {
	const type = getSingleParam(searchParams, "type", true);
	const mode = getSingleParam(searchParams, "mode", true);
	if (type === "liturgical-reading") {
		return normalizePublicDescriptor({
			contentType: type,
			mode,
			date: getSingleParam(searchParams, "date", true),
			calendar: getSingleParam(searchParams, "calendar") || "chile",
			readingType: getSingleParam(searchParams, "readingType", true),
		});
	}
	if (type === "random-verse") {
		return normalizePublicDescriptor({
			contentType: type,
			mode,
			verseId: getSingleParam(searchParams, "verseId", true),
		});
	}
	return normalizePublicDescriptor({
		contentType: type,
		mode,
		bibleId: getSingleParam(searchParams, "bibleId") || DEFAULT_BIBLE_ID,
		passageId: getSingleParam(searchParams, "passageId", true),
		ranges: parseRangesParam(getSingleParam(searchParams, "ranges")),
	});
}

export { normalizeRanges };
