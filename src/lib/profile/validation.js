export const PROFILE_UPDATE_FIELDS = Object.freeze([
	"displayName",
	"avatarUrl",
	"locale",
	"timezone",
]);

const LOCALE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const MAX_DISPLAY_NAME_LENGTH = 120;
const MAX_AVATAR_URL_LENGTH = 2048;

function isValidTimeZone(value) {
	try {
		new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
		return true;
	} catch {
		return false;
	}
}

function normalizeOptionalText(value) {
	if (value === null) return null;
	if (typeof value !== "string") return undefined;
	const normalized = value.trim();
	return normalized || null;
}

export function validateProfileUpdate(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "El perfil debe enviarse como un objeto JSON" };
	}

	const fields = Object.keys(payload);
	const unsupportedFields = fields.filter((field) => !PROFILE_UPDATE_FIELDS.includes(field));
	if (unsupportedFields.length > 0) {
		return { ok: false, error: "Solo puedes actualizar los campos permitidos del perfil" };
	}
	if (fields.length === 0) {
		return { ok: false, error: "Debes indicar al menos un campo para actualizar" };
	}

	const updates = {};

	if (Object.prototype.hasOwnProperty.call(payload, "displayName")) {
		const displayName = normalizeOptionalText(payload.displayName);
		if (displayName === undefined) {
			return { ok: false, error: "El nombre visible no es válido" };
		}
		if (displayName && displayName.length > MAX_DISPLAY_NAME_LENGTH) {
			return { ok: false, error: "El nombre visible es demasiado largo" };
		}
		updates.display_name = displayName;
	}

	if (Object.prototype.hasOwnProperty.call(payload, "avatarUrl")) {
		const avatarUrl = normalizeOptionalText(payload.avatarUrl);
		if (avatarUrl === undefined) {
			return { ok: false, error: "La dirección del avatar no es válida" };
		}
		if (avatarUrl) {
			if (avatarUrl.length > MAX_AVATAR_URL_LENGTH) {
				return { ok: false, error: "La dirección del avatar es demasiado larga" };
			}
			try {
				const parsedUrl = new URL(avatarUrl);
				if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error("unsupported_protocol");
			} catch {
				return { ok: false, error: "La dirección del avatar debe ser una URL web válida" };
			}
		}
		updates.avatar_url = avatarUrl;
	}

	if (Object.prototype.hasOwnProperty.call(payload, "locale")) {
		if (typeof payload.locale !== "string" || !LOCALE_PATTERN.test(payload.locale.trim())) {
			return { ok: false, error: "El idioma y la región no son válidos" };
		}
		updates.locale = payload.locale.trim();
	}

	if (Object.prototype.hasOwnProperty.call(payload, "timezone")) {
		if (typeof payload.timezone !== "string") {
			return { ok: false, error: "La zona horaria no es válida" };
		}
		const timezone = payload.timezone.trim();
		if (!timezone || !isValidTimeZone(timezone)) {
			return { ok: false, error: "La zona horaria no es válida" };
		}
		updates.timezone = timezone;
	}

	return { ok: true, updates };
}

export function createProfileView({ sessionUser, profile }) {
	return {
		id: sessionUser.id,
		displayName: profile?.display_name ?? sessionUser.displayName ?? null,
		email: sessionUser.email ?? null,
		avatarUrl: profile?.avatar_url ?? sessionUser.avatarUrl ?? null,
		locale: profile?.locale ?? sessionUser.locale ?? "es-CL",
		timezone: profile?.timezone ?? sessionUser.timezone ?? "America/Santiago",
	};
}
