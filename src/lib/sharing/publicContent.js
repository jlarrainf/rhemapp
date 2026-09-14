import fs from "node:fs";
import path from "node:path";
import { getPublishedReadingWithOverrides } from "../editorial/publishedReadings.js";
import { PublicShareValidationError } from "./publicUrls.js";
import { ShareUnavailableError } from "./validation.js";

const BIBLE_API_BASE_URL = process.env.BIBLE_API_BASE_URL || "https://rest.api.bible";
const BIBLE_API_PROVIDER = "API.Bible";

function safeSource(source) {
	if (!source || typeof source !== "object" || Array.isArray(source)) return null;
	const provider = typeof source.provider === "string" ? source.provider.trim().slice(0, 200) : "";
	const url = typeof source.url === "string" ? source.url.trim().slice(0, 500) : "";
	if (!provider && !url) return null;
	if (url) {
		try {
			const parsed = new URL(url);
			if (!["http:", "https:"].includes(parsed.protocol)) return null;
		} catch {
			return null;
		}
	}
	return {
		...(provider ? { provider } : {}),
		...(url ? { url } : {}),
	};
}

function getReadingItems(entry) {
	if (Array.isArray(entry?.readings)) return entry.readings;
	if (entry?.gospel) return [{ ...entry.gospel, type: "gospel" }];
	return [];
}

function unavailable() {
	throw new ShareUnavailableError();
}

function loadPublicVerses() {
	try {
		const filePath = path.join(process.cwd(), "public", "data", "verses.json");
		const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
		return Array.isArray(data?.verses) ? data.verses : [];
	} catch {
		return [];
	}
}

function stripHtml(value) {
	return String(value || "")
		.replace(/<br\s*\/?\s*>/gi, "\n")
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;/gi, " ")
		.replace(/&amp;/gi, "&")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/\r\n/g, "\n")
		.trim();
}

async function fetchBiblePassage(descriptor) {
	const apiKey = process.env.BIBLE_API_KEY;
	if (!apiKey) unavailable();

	const url = new URL(
		`/v1/bibles/${encodeURIComponent(descriptor.bibleId)}/passages/${encodeURIComponent(descriptor.passageId)}`,
		BIBLE_API_BASE_URL,
	);
	url.searchParams.set("content-type", "text");
	url.searchParams.set("include-verse-numbers", "false");
	let response;
	try {
		response = await fetch(url, {
			cache: "no-store",
			headers: { "api-key": apiKey, Accept: "application/json" },
		});
	} catch {
		unavailable();
	}
	if (!response.ok) unavailable();

	let data;
	try {
		data = await response.json();
	} catch {
		unavailable();
	}
	const content = stripHtml(data?.data?.content);
	const reference = typeof data?.data?.reference === "string" && data.data.reference.trim()
		? data.data.reference.trim()
		: descriptor.passageId;
	if (!content) unavailable();
	return {
		contentType: descriptor.contentType,
		title: reference,
		reference,
		excerpt: content,
		passageContent: content,
		copyright: typeof data?.data?.copyright === "string" ? data.data.copyright.trim() : "",
		source: { provider: BIBLE_API_PROVIDER },
		metadata: { bibleId: descriptor.bibleId, passageId: descriptor.passageId },
	};
}

export async function resolvePublicShare(descriptor) {
	if (!descriptor || typeof descriptor !== "object") {
		throw new PublicShareValidationError("El enlace compartido no es válido");
	}

	if (descriptor.contentType === "liturgical-reading") {
		let entry;
		try {
			entry = await getPublishedReadingWithOverrides({ dateKey: descriptor.date, mode: "date" });
		} catch {
			unavailable();
		}
		const reading = getReadingItems(entry).find((item) => item?.type === descriptor.readingType);
		if (!reading?.reference || !reading.excerpt) unavailable();
		return {
			kind: "public",
			resource: {
				contentType: descriptor.contentType,
				title: reading.title || reading.reference,
				reference: reading.excerptReference || reading.reference,
				excerpt: reading.excerpt,
				passageId: reading.passageId || null,
				ranges: Array.isArray(reading.ranges) ? reading.ranges : [],
				date: entry.date,
				dateLabel: entry.dateLabel,
				celebration: entry.celebration || "",
				source: safeSource(reading.source || entry.source),
				metadata: { readingType: reading.type, calendar: entry.calendar || descriptor.calendar },
			},
		};
	}

	if (descriptor.contentType === "random-verse") {
		const verse = loadPublicVerses().find((item) =>
			typeof item?.verseId === "string" && item.verseId.toUpperCase() === descriptor.verseId);
		if (!verse?.verse || !verse.reference) unavailable();
		return {
			kind: "public",
			resource: {
				contentType: descriptor.contentType,
				title: "Versículo aleatorio",
				reference: verse.reference,
				excerpt: verse.verse,
				source: { provider: "Rhemapp" },
				metadata: { verseId: descriptor.verseId },
			},
		};
	}

	return { kind: "public", resource: await fetchBiblePassage(descriptor) };
}

export { safeSource, stripHtml };
