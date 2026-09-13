import { resolveAuthSession } from "./session.js";

export class AuthenticationRequiredError extends Error {
	constructor() {
		super("Se requiere una sesión válida");
		this.name = "AuthenticationRequiredError";
		this.status = 401;
	}
}

export class AuthorizationDeniedError extends Error {
	constructor() {
		super("No tienes permiso para acceder a este recurso");
		this.name = "AuthorizationDeniedError";
		this.status = 403;
	}
}

export async function requireAuthenticatedSession(supabaseClient) {
	const session = await resolveAuthSession(supabaseClient);
	if (!session.authenticated) throw new AuthenticationRequiredError();
	return session;
}

export function assertResourceOwner(session, ownerId) {
	if (!session?.authenticated) throw new AuthenticationRequiredError();
	if (typeof ownerId !== "string" || ownerId !== session.user.id) {
		throw new AuthorizationDeniedError();
	}
	return true;
}
