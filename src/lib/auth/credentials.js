import { validateRecoveryRequest } from "./recovery.js";

export function validateLoginRequest(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "Ingresa un correo y una contraseña válidos." };
	}

	const fields = Object.keys(payload);
	if (fields.length !== 2 || !fields.includes("email") || !fields.includes("password")) {
		return { ok: false, error: "Ingresa un correo y una contraseña válidos." };
	}

	const emailValidation = validateRecoveryRequest({ email: payload.email });
	if (!emailValidation.ok || typeof payload.password !== "string" || payload.password.length === 0 || payload.password.length > 1024) {
		return { ok: false, error: "Ingresa un correo y una contraseña válidos." };
	}

	return { ok: true, email: emailValidation.email, password: payload.password };
}
