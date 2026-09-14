import {
	DAILY_PATH,
	NOTIFICATION_READING_MODE,
	NOTIFICATION_READING_TYPES,
} from "./constants.js";
import { isValidDateKey } from "../liturgicalSchedule.js";

const ALLOWED_KEYS = new Set(["date", "mode", "reading"]);

export function createDailyReadingDeepLink({ baseUrl, dateKey, mode = NOTIFICATION_READING_MODE, reading } = {}) {
	if (typeof baseUrl !== "string" || !baseUrl) throw new Error("La URL base del deep link es obligatoria");
	if (!isValidDateKey(dateKey)) throw new Error("La fecha del deep link no es válida");
	if (mode !== NOTIFICATION_READING_MODE) throw new Error("Las notificaciones solo abren la lectura diaria vigente");

	const url = new URL(DAILY_PATH, baseUrl);
	url.searchParams.set("date", dateKey);
	if (reading !== undefined) {
		if (!NOTIFICATION_READING_TYPES.includes(reading)) throw new Error("El tipo de lectura del deep link no es válido");
		url.searchParams.set("reading", reading);
	}
	return url.toString();
}

export function parseDailyReadingDeepLink(value) {
	let url;
	try {
		url = new URL(value, "https://rhemapp.invalid");
	} catch {
		return { ok: false, error: "El deep link no es una URL válida" };
	}
	if (url.pathname !== DAILY_PATH) return { ok: false, error: "El deep link no apunta a Daily" };
	for (const key of url.searchParams.keys()) {
		if (!ALLOWED_KEYS.has(key)) return { ok: false, error: "El deep link contiene parámetros no permitidos" };
	}

	const date = url.searchParams.get("date");
	const mode = url.searchParams.get("mode");
	const reading = url.searchParams.get("reading");
	if (!date && mode !== "today" && mode !== "sunday") return { ok: false, error: "El deep link debe indicar una fecha o un modo válido" };
	if (date && mode) return { ok: false, error: "El deep link no puede combinar fecha y modo" };
	if (date && !isValidDateKey(date)) return { ok: false, error: "La fecha del deep link no es válida" };
	if (mode && !["today", "sunday"].includes(mode)) return { ok: false, error: "El modo del deep link no es válido" };
	if (reading && !NOTIFICATION_READING_TYPES.includes(reading)) return { ok: false, error: "El tipo de lectura del deep link no es válido" };

	return { ok: true, dateKey: date || null, mode: mode || null, readingType: reading || null };
}
