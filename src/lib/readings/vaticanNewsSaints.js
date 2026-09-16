import { DAILY_TIME_ZONE, getDateKeyInTimeZone, isValidDateKey } from "../liturgicalSchedule.js";

export const VATICAN_NEWS_SAINTS_URL = "https://www.vaticannews.va/es/santos.html";
export const VATICAN_NEWS_SAINTS_PATH = "https://www.vaticannews.va/es/santos";
export const VATICAN_NEWS_PROVIDER = "Vatican News";

const SPANISH_MONTHS = Object.freeze([
	"enero",
	"febrero",
	"marzo",
	"abril",
	"mayo",
	"junio",
	"julio",
	"agosto",
	"septiembre",
	"octubre",
	"noviembre",
	"diciembre",
]);

const DESCRIPTOR_WORDS = Object.freeze([
	"abad",
	"abadessa",
	"abadesa",
	"beato",
	"beata",
	"confesor",
	"confesora",
	"diácono",
	"diacono",
	"doctor",
	"eremita",
	"fundador",
	"fundadora",
	"mártir",
	"martir",
	"mártires",
	"martires",
	"monje",
	"monja",
	"obispo",
	"papa",
	"presbítero",
	"presbitero",
	"presbíteros",
	"presbiteros",
	"religiosa",
	"religioso",
	"sacerdote",
	"santa",
	"santo",
	"santas",
	"santos",
	"virgen",
	"viuda",
]);

const DESCRIPTOR_PATTERN = new RegExp(`^(?:${DESCRIPTOR_WORDS.join("|")})(?:\\b|\\s)`, "iu");
const NAME_PATTERN = /^[\p{L}\p{M}\d]+(?:[ .'’'\-]+[\p{L}\p{M}\d]+)*(?:\s+y\s+[\p{L}\p{M}\d]+(?:[ .'’'\-]+[\p{L}\p{M}\d]+)*)?$/u;

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
	const namedEntities = {
		amp: "&",
		apos: "'",
		nbsp: " ",
		quot: '"',
	};

	return value
		.replace(/&#x([\da-f]+);/giu, (_, code) => String.fromCodePoint(parseInt(code, 16)))
		.replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&([a-z]+);/giu, (match, entity) => namedEntities[entity.toLowerCase()] || match);
}

function htmlToText(value) {
	return normalizeWhitespace(decodeHtml(value
		.replace(/<br\s*\/?>/giu, " ")
		.replace(/<[^>]*>/gu, " ")));
}

function normalizedComparison(value) {
	return typeof value === "string" ? normalizeWhitespace(value).toLocaleLowerCase("es-CL") : "";
}

function normalizedDateLabel(dateKey) {
	const [, month, day] = dateKey.split("-").map(Number);
	return `${day} ${SPANISH_MONTHS[month - 1]}`;
}

function stripLeadingSaintPrefix(value) {
	return value.replace(/^(?:(?:s|ss|b|bb)\.\s*|(?:san|santa|santos|santas|beato|beata|beatos|beatas)\s+)/iu, "").trim();
}

function assertName(value, context) {
	const name = normalizeWhitespace(value).replace(/[.;:]+$/u, "");
	if (!name || !NAME_PATTERN.test(name)) {
		throw new Error(`Ambiguous Vatican News saint name in ${context}`);
	}
	return name;
}

function extractNamesFromHeading(heading, index) {
	const cleanedHeading = stripLeadingSaintPrefix(normalizeWhitespace(heading));
	if (!cleanedHeading) throw new Error(`Empty Vatican News saint heading at index ${index}`);

	const [firstPart, ...descriptorParts] = cleanedHeading.split(",").map(normalizeWhitespace);
	const names = [assertName(firstPart, `heading ${index}`)];

	for (const descriptorPart of descriptorParts) {
		if (!descriptorPart) throw new Error(`Empty Vatican News saint descriptor at index ${index}`);

		const descriptorMatch = descriptorPart.match(new RegExp(`^(?:${DESCRIPTOR_WORDS.join("|")})\\s+y\\s+(.+)$`, "iu"));
		if (descriptorMatch && !DESCRIPTOR_PATTERN.test(descriptorMatch[1])) {
			names.push(assertName(descriptorMatch[1], `heading ${index}`));
			continue;
		}

		if (!DESCRIPTOR_PATTERN.test(descriptorPart)) {
			throw new Error(`Ambiguous Vatican News saint descriptor at index ${index}`);
		}
	}

	return names;
}

function extractDateLabel(html) {
	const match = html.match(/<span\b[^>]*\bid=["']dataFilter-text["'][^>]*>([\s\S]*?)<\/span>/iu);
	return match ? htmlToText(match[1]) : "";
}

function extractSaintHeadings(html) {
	const sections = [...html.matchAll(/<section\b(?=[^>]*\bclass=["'][^"']*\bsection--isStatic\b[^"']*["'])[^>]*>([\s\S]*?)<\/section>/giu)];
	if (sections.length === 0) throw new Error("Vatican News saint sections were not found");

	return sections.map((section, index) => {
		const heading = section[1].match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/iu);
		if (!heading) throw new Error(`Vatican News saint heading ${index} was not found`);
		return htmlToText(heading[1]);
	});
}

export function getVaticanNewsDailyUrl(dateKey) {
	if (!isValidDateKey(dateKey)) throw new Error(`Invalid Vatican News date: ${dateKey}`);
	const [, month, day] = dateKey.split("-");
	return `${VATICAN_NEWS_SAINTS_PATH}/${month}/${day}.html`;
}

export function getChileDateKey(date = new Date()) {
	return getDateKeyInTimeZone(date, DAILY_TIME_ZONE);
}

export function parseVaticanNewsSaintNames(html, dateKey) {
	if (typeof html !== "string" || html.length === 0) throw new Error("Vatican News returned an empty document");
	if (!isValidDateKey(dateKey)) throw new Error(`Invalid Vatican News date: ${dateKey}`);

	const pageTitle = html.match(/<h1\b[^>]*class=["'][^"']*\bcontent__innerTitle\b[^"']*["'][^>]*>([\s\S]*?)<\/h1>/iu);
	if (!pageTitle || normalizedComparison(htmlToText(pageTitle[1])) !== "santo del día") {
		throw new Error("Vatican News page title does not match the saint calendar");
	}

	const sourceDate = normalizedComparison(extractDateLabel(html));
	if (sourceDate !== normalizedComparison(normalizedDateLabel(dateKey))) {
		throw new Error(`Vatican News date mismatch: expected ${dateKey}, received ${sourceDate || "unknown"}`);
	}

	const names = extractSaintHeadings(html).flatMap(extractNamesFromHeading);
	const normalizedNames = names.map(normalizedComparison);
	if (names.length === 0 || normalizedNames.some((name) => !name)) {
		throw new Error("Vatican News returned no usable saint names");
	}
	if (new Set(normalizedNames).size !== normalizedNames.length) {
		throw new Error("Vatican News returned duplicate saint names");
	}

	return names;
}

export function buildSupplementalSaints(dateKey, names, fetchedAt = new Date().toISOString()) {
	if (!isValidDateKey(dateKey)) throw new Error(`Invalid Vatican News date: ${dateKey}`);
	if (!Array.isArray(names) || names.length === 0) throw new Error("Vatican News names are required");
	return names.map((name) => ({
		name: assertName(name, "published capture"),
		source: {
			provider: VATICAN_NEWS_PROVIDER,
			url: VATICAN_NEWS_SAINTS_URL,
			verified: true,
			attribution: VATICAN_NEWS_PROVIDER,
			reviewedForDate: dateKey,
			fetchedAt,
		},
	}));
}

export function haveSameSaintNames(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
	return left.every((saint, index) => normalizedComparison(saint?.name) === normalizedComparison(right[index]?.name));
}
