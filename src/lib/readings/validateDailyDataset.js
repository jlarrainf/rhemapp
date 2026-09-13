import { getGospelReading, validatePublishedEntry } from "./validatePublishedEntry.js";

function isValidDateKey(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year
		&& date.getUTCMonth() === month - 1
		&& date.getUTCDate() === day;
}

function dateRange(start, end) {
	if (!isValidDateKey(start) || !isValidDateKey(end)) return [];

	const dates = [];
	for (let cursor = new Date(`${start}T12:00:00Z`); cursor <= new Date(`${end}T12:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
		dates.push(cursor.toISOString().slice(0, 10));
	}
	return dates;
}

export function validateDailyDataset(data, {
	year,
	start,
	end,
	expectedReferences = {},
} = {}) {
	const errors = [];
	const entries = Array.isArray(data?.entries) ? data.entries : [];
	const byDate = new Map();

	for (const entry of entries) {
		if (byDate.has(entry?.date)) errors.push(`Fecha duplicada: ${entry.date}`);
		byDate.set(entry?.date, entry);
		if (!isValidDateKey(entry?.date)) errors.push(`Fecha inválida: ${entry?.date}`);
		if (entry?.calendar !== "chile") errors.push(`${entry?.date}: el calendario debe ser chile`);
		if (String(entry?.liturgicalYear) !== String(year)) errors.push(`${entry?.date}: año litúrgico incorrecto`);

		const validation = validatePublishedEntry(entry);
		if (!validation.valid) {
			for (const validationError of validation.errors) errors.push(`${entry?.date}: ${validationError}`);
		}

		const gospel = getGospelReading(entry);
		if (expectedReferences[entry?.date] && gospel?.reference !== expectedReferences[entry.date]) {
			errors.push(`${entry.date}: se esperaba ${expectedReferences[entry.date]} y se encontró ${gospel?.reference || "sin Evangelio"}`);
		}
		if (expectedReferences[entry?.date]
			&& entry.date !== "2026-09-10"
			&& entry.date !== "2026-09-13"
			&& entry.source?.ordoValidated !== true) {
			errors.push(`${entry.date}: la selección debe estar validada contra el Ordo chileno`);
		}
		if (/[…]|\.\.\./.test(gospel?.excerpt || "")) errors.push(`${entry?.date}: la frase parece truncada`);
	}

	for (const date of dateRange(start, end)) {
		if (!byDate.has(date)) errors.push(`Falta lectura para ${date}`);
	}

	return {
		valid: errors.length === 0,
		errors,
		entryCount: entries.length,
	};
}
