import { createSupabaseAdminClient } from "../supabase/admin.js";
import {
	DAILY_TIME_ZONE,
	ReadingUnavailableError,
	formatDateKey,
	getDateKeyInTimeZone,
	getNextMidnight,
	getDailyReading,
	getPublishedEntryForDate,
	getPublishedReading,
	resolveReadingDate,
	resolveSundayDateKey,
} from "../dailyReading.js";
import { validatePublishedEntry } from "../readings/validatePublishedEntry.js";
import { normalizeLiturgicalMetadata, normalizeSupplementalSaints } from "../readings/liturgicalMetadata.js";

const VERSION_FIELDS = "id, reading_key, payload_json, published_by, source_suggestion_id, rollback_of, created_at, superseded_at";

function enrichPublishedEntry(entry) {
	const celebrations = normalizeLiturgicalMetadata(entry);
	const supplementalSaints = normalizeSupplementalSaints(entry);
	const entryWithoutSupplementalSaints = { ...entry };
	delete entryWithoutSupplementalSaints.supplementalSaints;
	return {
		...entryWithoutSupplementalSaints,
		...(celebrations.length > 0 ? { celebrations } : {}),
		...(supplementalSaints.length > 0 ? { supplementalSaints } : {}),
	};
}

function buildLegacyPublishedReading(entry, dateKey, mode, timeZone) {
	const validation = validatePublishedEntry(entry);
	if (!validation.valid) return null;
	return {
		...enrichPublishedEntry(entry),
		dateKey,
		dateLabel: formatDateKey(dateKey),
		timeZone,
		mode,
		nextChangeAt: null,
	};
}

function readingKey(dateKey) {
	return `chile:${dateKey}`;
}

async function findActiveVersion(dateKey) {
	let supabaseAdmin;
	try {
		supabaseAdmin = createSupabaseAdminClient();
	} catch {
		return null;
	}

	try {
		const result = await supabaseAdmin
			.from("published_reading_versions")
			.select(VERSION_FIELDS)
			.eq("reading_key", readingKey(dateKey))
			.is("superseded_at", null)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle();
		if (result.error || !result.data) return null;
		const validation = validatePublishedEntry(result.data.payload_json, { allowLegacy: false });
		return validation.valid ? result.data : null;
	} catch {
		return null;
	}
}

export async function getActivePublishedEntry(dateKey) {
	const version = await findActiveVersion(dateKey);
	return version?.payload_json || null;
}

export async function getCurrentPublishedEntry(dateKey) {
	return (await getActivePublishedEntry(dateKey)) || getPublishedEntryForDate(dateKey);
}

function resolveRequestedDateKey({ dateKey, mode = "today", now, timeZone }) {
	if (mode === "sunday") return resolveSundayDateKey({ now, timeZone });
	return resolveReadingDate({
		dateKey: mode === "date" ? dateKey : undefined,
		now,
		timeZone,
	}).dateKey;
}

export async function getPublishedReadingWithOverrides({
	dateKey,
	mode = "today",
	now = new Date(),
	timeZone = DAILY_TIME_ZONE,
} = {}) {
	let base = null;
	let baseError = null;
	try {
		base = getPublishedReading({ dateKey, mode, now, timeZone });
	} catch (error) {
		baseError = error;
	}

	let resolvedDateKey;
	try {
		resolvedDateKey = base?.dateKey || resolveRequestedDateKey({ dateKey, mode, now, timeZone });
	} catch {
		throw baseError || new ReadingUnavailableError("La fecha de lectura no es válida");
	}

	const override = await getActivePublishedEntry(resolvedDateKey);
	if (!override) {
		if (base) return base;
		try {
			const legacyEntry = getPublishedEntryForDate(resolvedDateKey);
			const legacyReading = buildLegacyPublishedReading(legacyEntry, resolvedDateKey, mode, timeZone);
			if (legacyReading) return legacyReading;
		} catch {
			// The original request error below contains the actionable public response.
		}
		throw baseError || new ReadingUnavailableError(`Lectura aún no disponible para ${resolvedDateKey}`);
	}

	const resolvedMode = base?.mode || mode;
	return {
		...enrichPublishedEntry(override),
		dateKey: resolvedDateKey,
		dateLabel: formatDateKey(resolvedDateKey),
		timeZone,
		mode: resolvedMode,
		nextChangeAt: resolvedMode === "today" ? getNextMidnight(now, timeZone).toISOString() : null,
	};
}

export async function getDailyReadingWithOverrides({ date = new Date(), timeZone = DAILY_TIME_ZONE } = {}) {
	const dateKey = getDateKeyInTimeZone(date, timeZone);
	const override = await getActivePublishedEntry(dateKey);
	if (override) {
		return {
			...enrichPublishedEntry(override),
			dateKey,
			nextChangeAt: getNextMidnight(date, timeZone).toISOString(),
		};
	}

	return getDailyReading({ date, timeZone });
}

export function buildSuggestedPublishedPayload(entry, suggestion) {
	const validation = validatePublishedEntry(entry, { allowLegacy: false });
	if (!validation.valid || !suggestion || entry.date !== suggestion.date) return null;
	const readings = entry.readings.map((reading) => {
		if (reading.type !== suggestion.readingType) return reading;
		return {
			...reading,
			reference: suggestion.reference,
			excerptReference: suggestion.reference,
			source: { ...reading.source, url: suggestion.sourceUrl, verified: true },
		};
	});
	if (!readings.some((reading) => reading.type === suggestion.readingType)) return null;
	return {
		...entry,
		readings,
		source: { ...entry.source, url: suggestion.sourceUrl, verified: true },
	};
}

export { readingKey };
