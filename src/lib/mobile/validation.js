import {
	DEFAULT_NOTIFICATION_LOCAL_TIME,
	DEFAULT_NOTIFICATION_TIMEZONE,
	NOTIFICATION_PLATFORM,
	PUSH_TOKEN_MAX_LENGTH,
} from "./constants.js";

const PREFERENCE_FIELDS = ["enabled", "localTime", "timezone"];
const REGISTER_FIELDS = ["platform", "token"];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidTimeZone(value) {
	if (typeof value !== "string" || value.length === 0 || value.length > 100) return false;
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
		return true;
	} catch {
		return false;
	}
}

export function normalizeLocalTime(value, fallback = DEFAULT_NOTIFICATION_LOCAL_TIME) {
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim();
	return LOCAL_TIME_PATTERN.test(trimmed) ? trimmed : fallback;
}

export function normalizeTimezone(value, fallback = DEFAULT_NOTIFICATION_TIMEZONE) {
	const timezone = typeof value === "string" ? value.trim() : "";
	return isValidTimeZone(timezone) ? timezone : fallback;
}

function hasOnlyFields(payload, allowedFields) {
	return Object.keys(payload).every((field) => allowedFields.includes(field));
}

export function validateNotificationPreferencesPatch(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "Las preferencias deben enviarse como un objeto JSON" };
	}
	if (!hasOnlyFields(payload, PREFERENCE_FIELDS) || Object.keys(payload).length === 0) {
		return { ok: false, error: "Solo puedes actualizar la activación, la hora y la zona horaria" };
	}

	const updates = {};
	if (Object.prototype.hasOwnProperty.call(payload, "enabled")) {
		if (typeof payload.enabled !== "boolean") return { ok: false, error: "La activación de avisos no es válida" };
		updates.enabled = payload.enabled;
	}
	if (Object.prototype.hasOwnProperty.call(payload, "localTime")) {
		if (typeof payload.localTime !== "string" || !LOCAL_TIME_PATTERN.test(payload.localTime.trim())) {
			return { ok: false, error: "La hora debe tener el formato HH:MM" };
		}
		updates.local_time = payload.localTime.trim();
	}
	if (Object.prototype.hasOwnProperty.call(payload, "timezone")) {
		if (!isValidTimeZone(payload.timezone?.trim())) return { ok: false, error: "La zona horaria IANA no es válida" };
		updates.timezone = payload.timezone.trim();
	}

	return { ok: true, updates };
}

export function createNotificationPreferenceView(record, fallbackTimezone = DEFAULT_NOTIFICATION_TIMEZONE) {
	return {
		enabled: record?.enabled === true,
		localTime: normalizeLocalTime(typeof record?.local_time === "string" ? record.local_time.slice(0, 5) : undefined),
		timezone: normalizeTimezone(record?.timezone, fallbackTimezone),
	};
}

export function validatePushRegistration(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "El registro del dispositivo debe enviarse como JSON" };
	}
	if (!hasOnlyFields(payload, REGISTER_FIELDS) || Object.keys(payload).length !== REGISTER_FIELDS.length) {
		return { ok: false, error: "El registro del dispositivo no tiene el formato esperado" };
	}
	if (payload.platform !== NOTIFICATION_PLATFORM) {
		return { ok: false, error: "Solo se admiten dispositivos Android en esta fase" };
	}
	if (typeof payload.token !== "string" || payload.token.trim().length < 10 || payload.token.trim().length > PUSH_TOKEN_MAX_LENGTH) {
		return { ok: false, error: "El token del dispositivo no es válido" };
	}
	return { ok: true, token: payload.token.trim() };
}

export function validatePushUnregister(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "La revocación debe enviarse como JSON" };
	}
	if (Object.keys(payload).length !== 1 || typeof payload.deviceId !== "string" || !UUID_PATTERN.test(payload.deviceId)) {
		return { ok: false, error: "El identificador del dispositivo no es válido" };
	}
	return { ok: true, deviceId: payload.deviceId };
}

export function validateMobileRefresh(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "La renovación debe enviarse como JSON" };
	}
	if (Object.keys(payload).length !== 1 || typeof payload.refreshToken !== "string" || payload.refreshToken.trim().length < 20 || payload.refreshToken.trim().length > 4096) {
		return { ok: false, error: "El token de renovación no es válido" };
	}
	return { ok: true, refreshToken: payload.refreshToken.trim() };
}

export function isValidUuid(value) {
	return typeof value === "string" && UUID_PATTERN.test(value);
}
