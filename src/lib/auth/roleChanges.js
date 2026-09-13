import { AUTH_ROLES } from "./contracts.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateRoleChange(payload) {
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
		return { ok: false, error: "El cambio de rol debe enviarse como un objeto JSON" };
	}

	const fields = Object.keys(payload);
	if (fields.some((field) => !["userId", "role"].includes(field)) || fields.length !== 2) {
		return { ok: false, error: "Solo puedes indicar la cuenta y el rol nuevo" };
	}
	if (typeof payload.userId !== "string" || !UUID_PATTERN.test(payload.userId)) {
		return { ok: false, error: "La cuenta indicada no es válida" };
	}
	if (!AUTH_ROLES.includes(payload.role)) {
		return { ok: false, error: "El rol indicado no es válido" };
	}

	return { ok: true, userId: payload.userId.toLowerCase(), role: payload.role };
}

export function shouldPreventLastAdminDemotion({ currentRole, nextRole, adminCount }) {
	return currentRole === "admin" && nextRole !== "admin" && adminCount <= 1;
}
