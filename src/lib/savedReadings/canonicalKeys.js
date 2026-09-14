const DEFAULT_BIBLE_ID = "b32b9d1b64b4ef29-01";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CALENDAR_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BIBLE_ID_PATTERN = /^[a-z0-9-]{1,100}$/i;
const PASSAGE_ID_PATTERN = /^[A-Z0-9]{3}\.\d+(?:\.[0-9]+[a-z]?(?:-[0-9]+(?:\.[0-9]+)?[a-z]?)?(?:,[0-9]+[a-z]?(?:-[0-9]+(?:\.[0-9]+)?[a-z]?)?)*)?$/i;
const VERSE_ID_PATTERN = /^[A-Z0-9]{3}\.\d+\.[0-9]+[a-z]?(?:-(?:(?:[A-Z0-9]{3}\.)?\d+(?:\.\d+)?[a-z]?))?$/i;
const READING_TYPES = Object.freeze([
	"first-reading",
	"psalm",
	"second-reading",
	"gospel",
]);

const CONTENT_TYPE_ALIASES = Object.freeze({
	"liturgical-reading": "liturgical-reading",
	"daily-reading": "liturgical-reading",
	"random-verse": "random-verse",
	verse: "random-verse",
	"bible-passage": "bible-passage",
	passage: "bible-passage",
});

export const SAVED_CONTENT_TYPES = Object.freeze([
	"liturgical-reading",
	"random-verse",
	"bible-passage",
]);

export class SavedReadingKeyError extends Error {
	constructor(message) {
		super(message);
		this.name = "SavedReadingKeyError";
		this.status = 422;
	}
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value) {
	if (!isPlainObject(value)) throw new SavedReadingKeyError("El contenido a guardar debe ser un objeto");
	return value;
}

function normalizeContentType(value) {
	if (typeof value !== "string") throw new SavedReadingKeyError("El tipo de contenido es requerido");
	const normalized = CONTENT_TYPE_ALIASES[value.trim().toLowerCase()];
	if (!normalized) throw new SavedReadingKeyError("El tipo de contenido no es válido");
	return normalized;
}

function normalizeIsoDate(value) {
	if (typeof value !== "string" || !ISO_DATE_PATTERN.test(value)) {
		throw new SavedReadingKeyError("La fecha debe usar el formato YYYY-MM-DD");
	}

	const date = new Date(`${value}T00:00:00.000Z`);
	if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
		throw new SavedReadingKeyError("La fecha no es válida");
	}

	return value;
}

function normalizeCalendar(value = "chile") {
	if (typeof value !== "string") throw new SavedReadingKeyError("El calendario es requerido");
	const normalized = value.trim().toLowerCase();
	if (!CALENDAR_PATTERN.test(normalized)) throw new SavedReadingKeyError("El calendario no es válido");
	return normalized;
}

function normalizeReadingType(value) {
	if (typeof value !== "string") throw new SavedReadingKeyError("El tipo de lectura es requerido");
	const normalized = value.trim().toLowerCase();
	if (!READING_TYPES.includes(normalized)) throw new SavedReadingKeyError("El tipo de lectura no es válido");
	return normalized;
}

function normalizeBibleId(value = DEFAULT_BIBLE_ID) {
	if (typeof value !== "string" || !BIBLE_ID_PATTERN.test(value.trim())) {
		throw new SavedReadingKeyError("La traducción bíblica no es válida");
	}
	return value.trim().toLowerCase();
}

function normalizePassageId(value) {
	if (typeof value !== "string" || !PASSAGE_ID_PATTERN.test(value.trim())) {
		throw new SavedReadingKeyError("El ID del pasaje no es válido");
	}
	return value.trim().toUpperCase();
}

function normalizeVerseId(value) {
	if (typeof value !== "string" || !VERSE_ID_PATTERN.test(value.trim())) {
		throw new SavedReadingKeyError("El ID del versículo no es válido");
	}
	return value.trim().toUpperCase();
}

function normalizePositiveInteger(value, fieldName) {
	if (!Number.isInteger(value) || value < 1) {
		throw new SavedReadingKeyError(`${fieldName} debe ser un entero positivo`);
	}
	return value;
}

function normalizeSuffix(value, fieldName) {
	if (value === undefined) return undefined;
	if (typeof value !== "string" || !/^[a-z]$/i.test(value)) {
		throw new SavedReadingKeyError(`${fieldName} debe ser una letra`);
	}
	return value.toLowerCase();
}

function normalizeRange(range) {
	if (!isPlainObject(range)) throw new SavedReadingKeyError("Cada rango debe ser un objeto");

	const chapter = normalizePositiveInteger(range.chapter, "El capítulo");
	const start = normalizePositiveInteger(range.start, "El versículo inicial");
	const end = normalizePositiveInteger(range.end ?? range.start, "El versículo final");
	const endChapter = normalizePositiveInteger(range.endChapter ?? chapter, "El capítulo final");
	const startSuffix = normalizeSuffix(range.startSuffix, "El sufijo inicial");
	const endSuffix = normalizeSuffix(range.endSuffix, "El sufijo final");

	if (endChapter < chapter || (endChapter === chapter && end < start)) {
		throw new SavedReadingKeyError("El rango del pasaje no es válido");
	}

	return {
		chapter,
		start,
		end,
		...(endChapter !== chapter ? { endChapter } : {}),
		...(startSuffix ? { startSuffix } : {}),
		...(endSuffix ? { endSuffix } : {}),
	};
}

function compareRanges(left, right) {
	return left.chapter - right.chapter
		|| left.start - right.start
		|| (left.endChapter || left.chapter) - (right.endChapter || right.chapter)
		|| left.end - right.end
		|| (left.startSuffix || "").localeCompare(right.startSuffix || "")
		|| (left.endSuffix || "").localeCompare(right.endSuffix || "");
}

function rangeFingerprint(range) {
	return [
		range.chapter,
		range.start,
		range.startSuffix || "",
		range.endChapter || range.chapter,
		range.end,
		range.endSuffix || "",
	].join(".");
}

function normalizeRanges(value) {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value) || value.length > 32) {
		throw new SavedReadingKeyError("Los rangos del pasaje no son válidos");
	}

	const unique = new Map();
	for (const range of value.map(normalizeRange)) unique.set(rangeFingerprint(range), range);
	return [...unique.values()].sort(compareRanges);
}

function parseVerseToken(value, fieldName) {
	const match = /^(\d+)([a-z]?)$/i.exec(value);
	if (!match) throw new SavedReadingKeyError(`${fieldName} no es válido`);
	return {
		value: normalizePositiveInteger(Number(match[1]), fieldName),
		suffix: match[2] ? match[2].toLowerCase() : undefined,
	};
}

function parsePassageSelector(passageId) {
	const [book, chapterText, ...selectorParts] = passageId.split(".");
	const chapter = normalizePositiveInteger(Number(chapterText), "El capítulo");
	const selector = selectorParts.join(".");
	if (!selector) return { book, chapter, ranges: [] };

	const ranges = selector.split(",").map((part) => {
		const segments = part.split("-");
		if (segments.length > 2) throw new SavedReadingKeyError("El ID del pasaje no es válido");

		const start = parseVerseToken(segments[0], "El versículo inicial");
		const endText = segments[1] || segments[0];
		const endParts = endText.split(".");
		if (endParts.length > 2) throw new SavedReadingKeyError("El ID del pasaje no es válido");

		const hasEndChapter = endParts.length === 2;
		const end = parseVerseToken(endParts.at(-1), "El versículo final");
		const endChapter = hasEndChapter
			? normalizePositiveInteger(Number(endParts[0]), "El capítulo final")
			: chapter;

		return normalizeRange({
			chapter,
			start: start.value,
			startSuffix: start.suffix,
			end: end.value,
			endSuffix: end.suffix,
			...(hasEndChapter ? { endChapter } : {}),
		});
	});

	return { book, chapter, ranges: normalizeRanges(ranges) };
}

function serializeRange(range, previousRange) {
	const sameChapterAsPrevious = Boolean(
		previousRange
		&& previousRange.endChapter === undefined
		&& previousRange.chapter === range.chapter,
	);
	const start = `${range.start}${range.startSuffix || ""}`;
	const end = `${range.end}${range.endSuffix || ""}`;
	const startPrefix = sameChapterAsPrevious ? "" : `${range.chapter}.`;
	const endPrefix = range.endChapter === undefined ? "" : `${range.endChapter}.`;
	const isSingleVerse = range.endChapter === undefined
		&& range.start === range.end
		&& (range.startSuffix || "") === (range.endSuffix || "");

	return `${startPrefix}${start}${isSingleVerse ? "" : `-${endPrefix}${end}`}`;
}

function serializeRanges(book, ranges) {
	return `${book}.${ranges.map((range, index) => serializeRange(range, ranges[index - 1])).join(",")}`;
}

function getLiturgicalReadingParts(input) {
	const entry = isPlainObject(input.entry) ? input.entry : input;
	const date = input.date ?? entry.date;
	const calendar = input.calendar ?? entry.calendar ?? "chile";
	let readingType = input.readingType ?? input.reading?.type;

	if (readingType === undefined && READING_TYPES.includes(input.type)) readingType = input.type;
	if (readingType === undefined && entry.gospel && !Array.isArray(entry.readings)) readingType = "gospel";
	if (readingType === undefined && Array.isArray(entry.readings) && entry.readings.length === 1) {
		readingType = entry.readings[0]?.type;
	}

	return {
		date: normalizeIsoDate(date),
		calendar: normalizeCalendar(calendar),
		readingType: normalizeReadingType(readingType),
	};
}

function createLiturgicalReadingKey(input) {
	const { date, calendar, readingType } = getLiturgicalReadingParts(input);
	return `liturgical-reading:${calendar}:${date}:${readingType}`;
}

function createRandomVerseKey(input) {
	const verseId = input.verseId ?? input.passageId;
	const normalizedVerseId = normalizeVerseId(verseId);
	if (input.verseId !== undefined && input.passageId !== undefined
		&& normalizeVerseId(input.passageId) !== normalizedVerseId) {
		throw new SavedReadingKeyError("Los IDs del versículo no coinciden");
	}
	return `random-verse:${normalizedVerseId}`;
}

function createBiblePassageKey(input) {
	const passageId = normalizePassageId(input.passageId ?? input.chapterId);
	const parsedPassage = parsePassageSelector(passageId);
	const ranges = normalizeRanges(input.ranges);
	const passageRanges = parsedPassage.ranges;

	if (ranges.length > 0 && passageRanges.length > 0
		&& serializeRanges(parsedPassage.book, ranges) !== serializeRanges(parsedPassage.book, passageRanges)) {
		throw new SavedReadingKeyError("El ID y los rangos del pasaje no coinciden");
	}

	const selectorRanges = ranges.length > 0 ? ranges : passageRanges;
	const selector = selectorRanges.length > 0
		? serializeRanges(parsedPassage.book, selectorRanges)
		: `${parsedPassage.book}.${parsedPassage.chapter}`;

	return `bible-passage:${normalizeBibleId(input.bibleId)}:${selector}`;
}

export function createCanonicalKey(input) {
	const normalizedInput = requireObject(input);
	const contentType = normalizeContentType(normalizedInput.contentType);

	switch (contentType) {
		case "liturgical-reading":
			return createLiturgicalReadingKey(normalizedInput);
		case "random-verse":
			return createRandomVerseKey(normalizedInput);
		case "bible-passage":
			return createBiblePassageKey(normalizedInput);
		default:
			throw new SavedReadingKeyError("El tipo de contenido no es válido");
	}
}

export function createSavedReadingIdentity(input) {
	const normalizedInput = requireObject(input);
	const contentType = normalizeContentType(normalizedInput.contentType);
	return {
		contentType,
		canonicalKey: createCanonicalKey({ ...normalizedInput, contentType }),
	};
}

export { DEFAULT_BIBLE_ID };
