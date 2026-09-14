import { createHash } from "node:crypto";

const STOP_WORDS = new Set([
	"a", "al", "algo", "como", "con", "de", "del", "el", "en", "es", "la", "las", "lo", "los",
	"más", "por", "que", "qué", "se", "su", "sus", "un", "una", "y", "o", "para", "este", "esta",
]);

function cleanText(value, maximumLength = 240) {
	if (typeof value !== "string") return "";
	return value.replace(/\s+/g, " ").trim().slice(0, maximumLength);
}

function stableAnchorId(type, text) {
	return `anchor_${createHash("sha256").update(`${type}|${text}`).digest("hex").slice(0, 16)}`;
}

function getReadingItems(entry) {
	if (Array.isArray(entry?.readings)) return entry.readings;
	if (entry?.gospel) return [{ ...entry.gospel, type: "gospel" }];
	return [];
}

function significantTerms(text) {
	return [...new Set(text.toLocaleLowerCase("es-CL").match(/[\p{L}\d]{4,}/gu) || [])].filter(
		(term) => !STOP_WORDS.has(term),
	);
}

export function createAnchor({ type, text, reference = null }) {
	const normalizedText = cleanText(text);
	if (!normalizedText) return null;
	return {
		id: stableAnchorId(type || "reading", normalizedText),
		type: type || "reading",
		text: normalizedText,
		reference: cleanText(reference, 200) || null,
	};
}

export function extractReadingAnchors(entry) {
	const anchors = [];
	const seen = new Set();
	for (const reading of getReadingItems(entry)) {
		const type = typeof reading?.type === "string" ? reading.type : "reading";
		const reference = cleanText(reading?.excerptReference || reading?.reference, 200) || null;
		for (const candidate of [reading?.title, reading?.excerpt]) {
			const anchor = createAnchor({ type, text: candidate, reference });
			if (!anchor || seen.has(anchor.id)) continue;
			seen.add(anchor.id);
			anchors.push(anchor);
		}
	}
	return anchors;
}

export function buildVerifiedReadingContext(entry) {
	const items = getReadingItems(entry);
	return {
		date: entry?.date,
		calendar: entry?.calendar,
		liturgicalYear: entry?.liturgicalYear,
		celebration: cleanText(entry?.celebration, 300),
		readings: items.map((reading) => ({
			type: reading?.type,
			reference: cleanText(reading?.reference, 200),
			title: cleanText(reading?.title, 240),
			excerpt: cleanText(reading?.excerpt, 2000),
			excerptReference: cleanText(reading?.excerptReference, 200),
		})),
	};
}

export function getAnchorTerms(anchor) {
	return significantTerms(`${anchor?.text || ""} ${anchor?.reference || ""}`);
}

export function hasAnchorEvidence(text, anchor) {
	const lowerText = typeof text === "string" ? text.toLocaleLowerCase("es-CL") : "";
	return getAnchorTerms(anchor).some((term) => lowerText.includes(term));
}
