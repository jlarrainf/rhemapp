import { isValidDateKey } from "../liturgicalSchedule.js";
import { MOBILE_DAILY_PATH, NOTIFICATION_READING_TYPES } from "./constants.js";

function normalizeBaseUrl(baseUrl) {
	const url = new URL(baseUrl);
	if (!/^https?:$/i.test(url.protocol)) throw new Error("La URL base no es válida");
	return url.origin;
}

export function createDailyReadingDeepLink({ baseUrl, dateKey, mode = "today", readingType }) {
	if (!isValidDateKey(dateKey)) throw new Error("La fecha del aviso no es válida");
	if (mode !== "today") throw new Error("Los avisos no pueden abrir la lectura dominical anticipada");
	if (readingType !== undefined && !NOTIFICATION_READING_TYPES.includes(readingType)) {
		throw new Error("El tipo de lectura no es válido");
	}
	const url = new URL(`${normalizeBaseUrl(baseUrl)}${MOBILE_DAILY_PATH}`);
	url.searchParams.set("date", dateKey);
	if (readingType) url.searchParams.set("reading", readingType);
	return url.toString();
}

export function parseDailyReadingDeepLink(value) {
	try {
		const url = new URL(value);
		if (url.pathname !== MOBILE_DAILY_PATH) return { ok: false, error: "Ruta no válida" };
		const allowed = new Set(["date", "mode", "reading"]);
		for (const key of url.searchParams.keys()) if (!allowed.has(key)) return { ok: false, error: "Parámetro no permitido" };
		const dateKey = url.searchParams.get("date");
		const mode = url.searchParams.get("mode");
		const readingType = url.searchParams.get("reading");
		if (url.searchParams.getAll("date").length > 1 || url.searchParams.getAll("mode").length > 1 || url.searchParams.getAll("reading").length > 1) {
			return { ok: false, error: "Parámetro repetido" };
		}
		if (dateKey && mode) return { ok: false, error: "No se pueden combinar date y mode" };
		if (dateKey && !isValidDateKey(dateKey)) return { ok: false, error: "Fecha no válida" };
		if (mode && !["today", "sunday"].includes(mode)) return { ok: false, error: "Modo no válido" };
		if (readingType && !NOTIFICATION_READING_TYPES.includes(readingType)) return { ok: false, error: "Lectura no válida" };
		return { ok: true, dateKey: dateKey || null, mode: mode || null, readingType: readingType || null };
	} catch {
		return { ok: false, error: "Enlace no válido" };
	}
}
