export const AUTH_CONTRACT_VERSION = 1;

export const AUTH_ROLES = Object.freeze(["user", "editor", "admin"]);

export const PUBLIC_PROFILE_FIELDS = Object.freeze([
	"id",
	"displayName",
	"email",
	"avatarUrl",
	"locale",
	"timezone",
]);

export function createVisitorSession() {
	return {
		version: AUTH_CONTRACT_VERSION,
		authenticated: false,
		user: null,
		role: null,
		expiresAt: null,
	};
}

export function createAuthenticatedSession({ user, role = "user", expiresAt }) {
	if (!user || typeof user !== "object") throw new Error("A user is required for an authenticated session");
	if (!AUTH_ROLES.includes(role)) throw new Error(`Unsupported auth role: ${role}`);
	if (typeof expiresAt !== "string" || !expiresAt) throw new Error("An expiration timestamp is required");

	const sanitizedUser = Object.fromEntries(
		PUBLIC_PROFILE_FIELDS
			.filter((field) => Object.prototype.hasOwnProperty.call(user, field))
			.map((field) => [field, user[field] ?? null]),
	);

	return {
		version: AUTH_CONTRACT_VERSION,
		authenticated: true,
		user: sanitizedUser,
		role,
		expiresAt,
	};
}
