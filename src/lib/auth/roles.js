import { AUTH_ROLES } from "./contracts.js";
import {
	AuthenticationRequiredError,
	AuthorizationDeniedError,
	requireAuthenticatedSession,
} from "./guards.js";

function normalizeRequiredRoles(requiredRoles) {
	const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
	if (roles.length === 0 || roles.some((role) => !AUTH_ROLES.includes(role))) {
		throw new Error("Unsupported required auth role");
	}
	return roles;
}

export function assertRole(session, requiredRoles) {
	const roles = normalizeRequiredRoles(requiredRoles);
	if (!session?.authenticated) throw new AuthenticationRequiredError();
	if (!roles.includes(session.role)) {
		throw new AuthorizationDeniedError();
	}
	return true;
}

export async function requireRole(requiredRoles, supabaseClient) {
	const session = await requireAuthenticatedSession(supabaseClient);
	assertRole(session, requiredRoles);
	return session;
}
