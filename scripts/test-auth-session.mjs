import assert from "node:assert/strict";
import test from "node:test";
import {
	AuthSessionUnavailableError,
	resolveAuthSession,
} from "../src/lib/auth/session.js";

function createFakeClient({ user = null, userError = null, session = null, sessionError = null, profile = null, profileError = null, role = null, roleError = null } = {}) {
	const createQuery = (data, error) => ({
		select() { return this; },
		eq() { return this; },
		maybeSingle: async () => ({ data, error }),
	});

	return {
		auth: {
			getUser: async () => ({ data: { user }, error: userError }),
			getSession: async () => ({ data: { session }, error: sessionError }),
		},
		from(table) {
			return table === "profiles" ? createQuery(profile, profileError) : createQuery(role, roleError);
		},
	};
}

test("returns the visitor contract for an unauthenticated or expired session", async () => {
	const visitor = await resolveAuthSession(createFakeClient());
	const expired = await resolveAuthSession(createFakeClient({
		user: { id: "user-id", email: "persona@example.com" },
		session: null,
	}));

	assert.equal(visitor.authenticated, false);
	assert.equal(expired.authenticated, false);
});

test("resolves an authenticated session from verified user, profile and role data", async () => {
	const session = await resolveAuthSession(createFakeClient({
		user: { id: "user-id", email: "persona@example.com" },
		session: { expires_at: 1799000000 },
		profile: {
			user_id: "user-id",
			display_name: "Persona",
			avatar_url: null,
			locale: "es-CL",
			timezone: "America/Santiago",
		},
		role: { role: "user" },
	}));

	assert.equal(session.authenticated, true);
	assert.equal(session.user.displayName, "Persona");
	assert.equal(session.user.email, "persona@example.com");
	assert.equal(session.role, "user");
});

test("fails closed when application data cannot resolve the role", async () => {
	await assert.rejects(
		() => resolveAuthSession(createFakeClient({
			user: { id: "user-id", email: "persona@example.com" },
			session: { expires_at: 1799000000 },
			roleError: new Error("database unavailable"),
		})),
		(error) => error instanceof AuthSessionUnavailableError && error.status === 503,
	);
});
