import { createPasswordRecoveryRedirectTo } from "./oauth.js";

export const AUTH_RECOVERY_PATH = "/recuperar";
export const PASSWORD_RESET_PATH = "/restablecer";
export const RECOVERY_GENERIC_MESSAGE =
	"Si el correo corresponde a una cuenta, recibirás instrucciones para recuperar el acceso.";
export const PASSWORD_UPDATE_MIN_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export { createPasswordRecoveryRedirectTo };

export function validateRecoveryRequest(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "Ingresa un correo electrónico válido." };
	}

	const fields = Object.keys(payload);
	if (fields.length !== 1 || fields[0] !== "email" || typeof payload.email !== "string") {
		return { ok: false, error: "Ingresa un correo electrónico válido." };
	}

	const email = payload.email.trim().toLowerCase();
	if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
		return { ok: false, error: "Ingresa un correo electrónico válido." };
	}

	return { ok: true, email };
}

export function validatePasswordUpdate({ password, confirmation }) {
	if (typeof password !== "string" || typeof confirmation !== "string") {
		return { ok: false, error: "Completa ambos campos de contraseña." };
	}
	if (password.length < PASSWORD_UPDATE_MIN_LENGTH) {
		return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." };
	}
	if (password !== confirmation) {
		return { ok: false, error: "Las contraseñas no coinciden." };
	}
	return { ok: true };
}
