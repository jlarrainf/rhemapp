import assert from "node:assert/strict";
import test from "node:test";
import {
	AuthenticationRequiredError,
	AuthorizationDeniedError,
	assertResourceOwner,
	requireAuthenticatedSession,
} from "../src/lib/auth/guards.js";
import { assertRole, requireRole } from "../src/lib/auth/roles.js";

function createFakeClient({ user = null, session = null, profile = null, role = null } = {}) {
	const createQuery = (data) => ({
		select() { return this; },
		eq() { return this; },
		maybeSingle: async () => ({ data, error: null }),
	});

	return {
		auth: {
			getUser: async () => ({ data: { user }, error: null }),
			getSession: async () => ({ data: { session }, error: null }),
		},
		from(table) {
			return table === "profiles" ? createQuery(profile) : createQuery(role);
		},
	};
}

const authenticatedClient = createFakeClient({
	user: { id: "user-id", email: "persona@example.com" },
	session: { expires_at: 1799000000 },
	profile: { user_id: "user-id", display_name: "Persona", locale: "es-CL", timezone: "America/Santiago" },
	role: { role: "user" },
});

test("rejects unauthenticated access with a typed 401 error", async () => {
	await assert.rejects(
		() => requireAuthenticatedSession(createFakeClient()),
		(error) => error instanceof AuthenticationRequiredError && error.status === 401,
	);
});

test("returns the verified session to protected server code", async () => {
	const session = await requireAuthenticatedSession(authenticatedClient);

	assert.equal(session.authenticated, true);
	assert.equal(session.user.id, "user-id");
	assert.doesNotThrow(() => assertResourceOwner(session, "user-id"));
});

test("rejects resources owned by another user", async () => {
	const session = await requireAuthenticatedSession(authenticatedClient);

	assert.throws(
		() => assertResourceOwner(session, "another-user-id"),
		(error) => error instanceof AuthorizationDeniedError && error.status === 403,
	);
});

test("allows the administrator role and rejects a regular user", async () => {
	const adminClient = createFakeClient({
		user: { id: "admin-id", email: "admin@example.com" },
		session: { expires_at: 1799000000 },
		profile: { user_id: "admin-id", display_name: "Admin", locale: "es-CL", timezone: "America/Santiago" },
		role: { role: "admin" },
	});
	const adminSession = await requireRole("admin", adminClient);
	assert.equal(adminSession.role, "admin");
	assert.doesNotThrow(() => assertRole(adminSession, ["editor", "admin"]));

	await assert.rejects(
		() => requireRole("admin", authenticatedClient),
		(error) => error instanceof AuthorizationDeniedError && error.status === 403,
	);
});
