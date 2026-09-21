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
	"arcángel",
	"arcangel",
	"apóstol",
	"apostol",
	"apóstoles",
	"apostoles",
	"beato",
	"beata",
	"canónigo",
	"canonigo",
	"cardenal",
	"catequista",
	"carmelita",
	"carmelitas",
	"conde",
	"condesa",
	"confesor",
	"confesora",
	"diácono",
	"diacono",
	"discípula",
	"discipula",
	"discípulas",
	"discipulas",
	"discípulo",
	"discipulo",
	"discípulos",
	"discipulos",
	"doctor",
	"doctora",
	"doctoras",
	"duque",
	"duquesa",
	"eremita",
	"evangelista",
	"franciscana",
	"franciscano",
	"franciscanas",
	"franciscanos",
	"fundador",
	"fundadora",
	"hermana",
	"hermano",
	"hija",
	"hijo",
	"mártir",
	"martir",
	"mártires",
	"martires",
	"monje",
	"monja",
	"obispo",
	"papa",
	"patrón",
	"patron",
	"patrona",
	"presbítero",
	"presbitero",
	"presbíteros",
	"presbiteros",
	"protectora",
	"reina",
	"rey",
	"religiosa",
	"religioso",
	"sacerdote",
	"sacerdotes",
	"soldado",
	"soldados",
	"santa",
	"santo",
	"santas",
	"santos",
	"virgen",
	"viuda",
	"médico",
	"medico",
	"filósofo",
	"filosofo",
]);

const DESCRIPTOR_PATTERN = new RegExp(`^(?:${DESCRIPTOR_WORDS.join("|")})(?:\\b|\\s)`, "iu");
const DESCRIPTOR_AND_NAME_PATTERN = new RegExp(`^((?:${DESCRIPTOR_WORDS.join("|")})(?:\\b|\\s)+)y\\s+(.+)$`, "iu");
const DESCRIPTOR_CONNECTOR_PATTERN = /^(?:a|al|como|con|de|del|desde|en|entre|para|por|según|segun|sin|junto)(?:\b|\s)/iu;
const NON_SAINT_HEADING_PATTERN = /^(?:conmemoraci[oó]n|dedicaci[oó]n|fiesta|memoria|presentaci[oó]n|solemnidad)\b/iu;
const NAME_PATTERN = /^[\p{L}\p{M}\p{N}\p{Sk}]+(?:[ .'’'()\-]+[\p{L}\p{M}\p{N}\p{Sk}]+)*(?:\s+y\s+[\p{L}\p{M}\p{N}\p{Sk}]+(?:[ .'’'()\-]+[\p{L}\p{M}\p{N}\p{Sk}]+)*)?[)]?$/u;

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function decodeHtml(value) {
	const namedEntities = {
		amp: "&",
		apos: "'",
		Aacute: "Á",
		aacute: "á",
		Eacute: "É",
		eacute: "é",
		Iacute: "Í",
		iacute: "í",
		Ntilde: "Ñ",
		ntilde: "ñ",
		nbsp: " ",
		Oacute: "Ó",
		oacute: "ó",
		quot: '"',
		Uacute: "Ú",
		uacute: "ú",
		uuml: "ü",
		lt: "<",
		gt: ">",
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

function normalizedDateLabelComparison(value) {
	const normalized = normalizedComparison(value);
	return normalized.replace(/^(0?\d{1,2})(\s+)/u, (_, day, separator) => `${Number(day)}${separator}`);
}

function stripLeadingSaintPrefix(value, index) {
	const prefix = value.match(/^(?:(?:ss|bb|s|b)\.\s*|(?:san|santa|santos|santas|beato|beata|beatos|beatas)\s+)/iu);
	if (!prefix) {
		if (/^nuestra\s+señora\b/iu.test(value)) return value;
		throw new Error(`Ambiguous Vatican News saint heading at index ${index}`);
	}

	const name = value.slice(prefix[0].length).trim();
	if (!name) throw new Error(`Empty Vatican News saint heading at index ${index}`);
	return name;
}

function cleanName(value) {
	return normalizeWhitespace(value).replace(/[.;:]+$/u, "");
}

function isDescriptorPart(value) {
	const part = normalizeWhitespace(value);
	return Boolean(part) && (DESCRIPTOR_PATTERN.test(part) || DESCRIPTOR_CONNECTOR_PATTERN.test(part) || /^\p{Ll}/u.test(part));
}

function isNameCandidate(value) {
	const name = cleanName(value);
	const openingParentheses = (name.match(/\(/gu) || []).length;
	const closingParentheses = (name.match(/\)/gu) || []).length;
	return Boolean(name)
		&& /^\p{Lu}/u.test(name)
		&& openingParentheses === closingParentheses
		&& !isDescriptorPart(name)
		&& NAME_PATTERN.test(name);
}

function assertName(value, context) {
	const name = cleanName(value);
	if (!isNameCandidate(name)) {
		throw new Error(`Ambiguous Vatican News saint name in ${context}`);
	}
	return name;
}

function extractNamesFromHeading(heading, index) {
	const normalizedHeading = normalizeWhitespace(heading);
	if (NON_SAINT_HEADING_PATTERN.test(normalizedHeading)) return [];

	const cleanedHeading = stripLeadingSaintPrefix(normalizedHeading, index);

	const [firstPart, ...descriptorParts] = cleanedHeading.split(",").map(normalizeWhitespace);
	const names = [assertName(firstPart, `heading ${index}`)];

	for (const descriptorPart of descriptorParts) {
		if (!descriptorPart) throw new Error(`Empty Vatican News saint descriptor at index ${index}`);

		const leadingNameMatch = descriptorPart.match(/^y\s+(.+)$/iu);
		if (leadingNameMatch) {
			if (isDescriptorPart(leadingNameMatch[1])) {
				throw new Error(`Ambiguous Vatican News saint descriptor at index ${index}`);
			}
			names.push(assertName(leadingNameMatch[1], `heading ${index}`));
			continue;
		}

		const descriptorAndNameMatch = descriptorPart.match(DESCRIPTOR_AND_NAME_PATTERN);
		if (descriptorAndNameMatch) {
			const candidate = descriptorAndNameMatch[2];
			if (isDescriptorPart(candidate)) continue;
			if (isNameCandidate(candidate)) {
				names.push(assertName(candidate, `heading ${index}`));
				continue;
			}
			throw new Error(`Ambiguous Vatican News saint descriptor at index ${index}`);
		}

		if (isNameCandidate(descriptorPart)) {
			names.push(assertName(descriptorPart, `heading ${index}`));
			continue;
		}

		if (!isDescriptorPart(descriptorPart)) {
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

	const sourceDate = normalizedDateLabelComparison(extractDateLabel(html));
	if (sourceDate !== normalizedDateLabelComparison(normalizedDateLabel(dateKey))) {
		throw new Error(`Vatican News date mismatch: expected ${dateKey}, received ${sourceDate || "unknown"}`);
	}

	const names = extractSaintHeadings(html).flatMap(extractNamesFromHeading);
	const normalizedNames = names.map(normalizedComparison);
	if (normalizedNames.some((name) => !name)) {
		throw new Error("Vatican News returned no usable saint names");
	}
	if (new Set(normalizedNames).size !== normalizedNames.length) {
		throw new Error("Vatican News returned duplicate saint names");
	}

	return names;
}

export function buildSupplementalSaints(dateKey, names, fetchedAt = new Date().toISOString()) {
	if (!isValidDateKey(dateKey)) throw new Error(`Invalid Vatican News date: ${dateKey}`);
	if (!Array.isArray(names)) throw new Error("Vatican News names are required");
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
