import fs from "node:fs";
import path from "node:path";
import {
	DAILY_TIME_ZONE,
	formatDailyDate,
	formatDateKey,
	getDateKeyInTimeZone,
	getNextMidnight,
	resolveReadingDate,
	resolveSundayDateKey,
} from "./liturgicalSchedule.js";
import { validateReadingEntry } from "./readings/validateReading.js";

export {
	DAILY_TIME_ZONE,
	formatDailyDate,
	formatDateKey,
	getDateKeyInTimeZone,
	getNextMidnight,
	resolveReadingDate,
	resolveSundayDateKey,
} from "./liturgicalSchedule.js";

export class ReadingRequestError extends Error {
	constructor(message) {
		super(message);
		this.name = "ReadingRequestError";
		this.status = 400;
	}
}

export class ReadingUnavailableError extends Error {
	constructor(message) {
		super(message);
		this.name = "ReadingUnavailableError";
		this.status = 404;
	}
}

function loadDailyReadingsFile(year) {
	const filePath = path.join(
		process.cwd(),
		"public",
		"data",
		"daily-readings",
		`${year}.json`
	);

	if (!fs.existsSync(filePath)) {
		throw new ReadingUnavailableError(`Lectura aún no disponible para ${year}`);
	}

	const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
	if (!data || !Array.isArray(data.entries)) {
		throw new Error(`El calendario litúrgico de ${year} no tiene un formato válido`);
	}

	return data;
}

function findEntryByDateKey(dateKey) {
	const year = dateKey.slice(0, 4);
	const data = loadDailyReadingsFile(year);
	return data.entries.find((item) => item?.date === dateKey) || null;
}

export function getPublishedReading({
	dateKey,
	mode = "today",
	now = new Date(),
	timeZone = DAILY_TIME_ZONE,
} = {}) {
	if (!["today", "date", "sunday"].includes(mode)) {
		throw new ReadingRequestError("El modo de lectura no es válido");
	}

	let resolvedDateKey;
	let resolvedMode = mode;
	if (mode === "sunday") {
		resolvedDateKey = resolveSundayDateKey({ now, timeZone });
	} else {
		const resolved = resolveReadingDate({
			dateKey: mode === "date" ? dateKey : undefined,
			now,
			timeZone,
		});
		resolvedDateKey = resolved.dateKey;
		resolvedMode = resolved.mode;
	}

	const entry = findEntryByDateKey(resolvedDateKey);
	if (!entry) throw new ReadingUnavailableError(`Lectura aún no disponible para ${resolvedDateKey}`);

	const validation = validateReadingEntry(entry);
	if (!validation.valid) {
		throw new ReadingUnavailableError(`La lectura publicada para ${resolvedDateKey} aún no está completa`);
	}

	return {
		...entry,
		dateKey: resolvedDateKey,
		dateLabel: formatDateKey(resolvedDateKey),
		timeZone,
		mode: resolvedMode,
		nextChangeAt: resolvedMode === "today" ? getNextMidnight(now, timeZone).toISOString() : null,
	};
}

export function getDailyReading({ date = new Date(), timeZone = DAILY_TIME_ZONE } = {}) {
	const dateKey = getDateKeyInTimeZone(date, timeZone);
	const entry = findEntryByDateKey(dateKey);

	if (Array.isArray(entry?.readings)) {
		const validation = validateReadingEntry(entry);
		if (!validation.valid) throw new Error(`Las lecturas de ${dateKey} aún no están completas`);

		return {
			...entry,
			dateKey,
			nextChangeAt: getNextMidnight(date, timeZone).toISOString(),
		};
	}

	if (!entry?.gospel?.reference || !entry.gospel.passageId || !entry.gospel.excerpt) {
		throw new Error(`No hay un evangelio válido para ${dateKey}`);
	}

	return {
		...entry,
		dateKey,
		nextChangeAt: getNextMidnight(date, timeZone).toISOString(),
	};
}
