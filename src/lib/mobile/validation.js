import {
	DEFAULT_NOTIFICATION_LOCAL_TIME,
	DEFAULT_NOTIFICATION_TIMEZONE,
	MAX_GOOGLE_ID_TOKEN_LENGTH,
	MAX_GOOGLE_NONCE_LENGTH,
	MAX_PUSH_TOKEN_LENGTH,
	NOTIFICATION_PLATFORM,
} from "./constants.js";

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const GOOGLE_ID_TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const GOOGLE_NONCE_PATTERN = /^[A-Za-z0-9_-]+$/;

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isValidIanaTimezone(value) {
	if (typeof value !== "string" || value.trim().length === 0 || value.length > 100) return false;
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
		return true;
	} catch {
		return false;
	}
}

export function normalizeTimezone(value) {
	return isValidIanaTimezone(value) ? value.trim() : DEFAULT_NOTIFICATION_TIMEZONE;
}

export function isValidLocalTime(value) {
	return typeof value === "string" && TIME_PATTERN.test(value);
}

export function normalizeLocalTime(value) {
	if (!isValidLocalTime(value)) throw new Error("La hora debe usar el formato HH:MM");
	return value;
}

export function validateNotificationPreferencesPatch(payload) {
	if (!isPlainObject(payload)) return { ok: false, error: "Las preferencias no tienen un formato válido." };
	const allowed = new Set(["enabled", "localTime", "timezone"]);
	const fields = Object.keys(payload);
	if (fields.length === 0 || fields.some((field) => !allowed.has(field))) {
		return { ok: false, error: "Solo puedes cambiar activación, hora y zona horaria." };
	}
	const updates = {};
	if (Object.hasOwn(payload, "enabled")) {
		if (typeof payload.enabled !== "boolean") return { ok: false, error: "La activación no es válida." };
		updates.enabled = payload.enabled;
	}
	if (Object.hasOwn(payload, "localTime")) {
		if (!isValidLocalTime(payload.localTime)) return { ok: false, error: "La hora debe usar el formato HH:MM." };
		updates.local_time = payload.localTime;
	}
	if (Object.hasOwn(payload, "timezone")) {
		if (!isValidIanaTimezone(payload.timezone)) return { ok: false, error: "La zona horaria IANA no es válida." };
		updates.timezone = payload.timezone.trim();
	}
	return { ok: true, updates };
}

export function createNotificationPreferenceView(row) {
	return {
		enabled: Boolean(row?.enabled),
		localTime: isValidLocalTime(String(row?.local_time || "").slice(0, 5))
			? String(row.local_time).slice(0, 5)
			: DEFAULT_NOTIFICATION_LOCAL_TIME,
		timezone: normalizeTimezone(row?.timezone),
	};
}

export function validatePushRegistration(payload) {
	if (!isPlainObject(payload) || payload.platform !== NOTIFICATION_PLATFORM) {
		return { ok: false, error: "Solo se pueden registrar dispositivos Android." };
	}
	if (typeof payload.token !== "string") return { ok: false, error: "El token del dispositivo no es válido." };
	const token = payload.token.trim();
	if (!token || token.length > MAX_PUSH_TOKEN_LENGTH || /[\u0000-\u001f\u007f]/u.test(token)) {
		return { ok: false, error: "El token del dispositivo no es válido." };
	}
	return { ok: true, token };
}

export function validatePushUnregister(payload) {
	if (!isPlainObject(payload) || typeof payload.deviceId !== "string" || !UUID_PATTERN.test(payload.deviceId)) {
		return { ok: false, error: "El dispositivo seleccionado no es válido." };
	}
	return { ok: true, deviceId: payload.deviceId.toLowerCase() };
}

export function validateMobileRefresh(payload) {
	if (!isPlainObject(payload) || typeof payload.refreshToken !== "string") {
		return { ok: false, error: "La sesión móvil no es válida." };
	}
	const refreshToken = payload.refreshToken.trim();
	if (!refreshToken || refreshToken.length > 8192) return { ok: false, error: "La sesión móvil no es válida." };
	return { ok: true, refreshToken };
}

export function validateMobileGoogleLogin(payload) {
	if (!isPlainObject(payload) || typeof payload.idToken !== "string" || typeof payload.nonce !== "string") {
		return { ok: false, error: "La credencial de Google no es válida." };
	}
	const idToken = payload.idToken.trim();
	const nonce = payload.nonce.trim();
	if (!idToken || idToken.length > MAX_GOOGLE_ID_TOKEN_LENGTH || !GOOGLE_ID_TOKEN_PATTERN.test(idToken) || !nonce || nonce.length > MAX_GOOGLE_NONCE_LENGTH || !GOOGLE_NONCE_PATTERN.test(nonce)) {
		return { ok: false, error: "La credencial de Google no es válida." };
	}
	return { ok: true, idToken, nonce };
}
