import fs from "node:fs";
import path from "node:path";

export const DAILY_TIME_ZONE = "America/Santiago";

function getDatePartsInTimeZone(date, timeZone = DAILY_TIME_ZONE) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	return {
		year: parts.find((part) => part.type === "year")?.value || "1970",
		month: parts.find((part) => part.type === "month")?.value || "01",
		day: parts.find((part) => part.type === "day")?.value || "01",
	};
}

export function getDateKeyInTimeZone(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
	return `${year}-${month}-${day}`;
}

export function formatDailyDate(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	return new Intl.DateTimeFormat("es-CL", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		timeZone,
	}).format(date);
}

export function getNextMidnight(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	const currentKey = getDateKeyInTimeZone(date, timeZone);
	let candidate = new Date(date.getTime() + 1000);

	// Avanzar por minutos evita asumir que todos los días duran 24 horas.
	for (let index = 0; index < 48 * 60; index += 1) {
		if (getDateKeyInTimeZone(candidate, timeZone) !== currentKey) {
			return candidate;
		}
		candidate = new Date(candidate.getTime() + 60 * 1000);
	}

	return new Date(date.getTime() + 24 * 60 * 60 * 1000);
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
		throw new Error(`No existe el calendario litúrgico para ${year}`);
	}

	const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
	if (!data || !Array.isArray(data.entries)) {
		throw new Error(`El calendario litúrgico de ${year} no tiene un formato válido`);
	}

	return data;
}

export function getDailyReading({ date = new Date(), timeZone = DAILY_TIME_ZONE } = {}) {
	const dateKey = getDateKeyInTimeZone(date, timeZone);
	const year = dateKey.slice(0, 4);
	const data = loadDailyReadingsFile(year);
	const entry = data.entries.find((item) => item?.date === dateKey);

	if (!entry?.gospel?.reference || !entry.gospel.passageId || !entry.gospel.excerpt) {
		throw new Error(`No hay un evangelio válido para ${dateKey}`);
	}

	return {
		...entry,
		dateKey,
		nextChangeAt: getNextMidnight(date, timeZone).toISOString(),
	};
}

