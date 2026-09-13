import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
	AUTH_CONTRACT_VERSION,
	AUTH_ROLES,
	createAuthenticatedSession,
	createVisitorSession,
} from "../src/lib/auth/contracts.js";

const fixturesDirectory = path.join(process.cwd(), "specs", "002-authentication", "fixtures");
const SESSION_FIELDS = ["version", "authenticated", "user", "role", "expiresAt"];

function loadFixture(fileName) {
	return JSON.parse(fs.readFileSync(path.join(fixturesDirectory, fileName), "utf8"));
}

test("creates the stable visitor session contract", () => {
	const session = createVisitorSession();

	assert.deepEqual(session, loadFixture("visitor-session.json"));
	assert.deepEqual(Object.keys(session), SESSION_FIELDS);
});

test("creates an authenticated session with only public profile fields", () => {
	const session = createAuthenticatedSession({
		user: {
			id: "user-id",
			displayName: "Nombre",
			email: "persona@example.com",
			avatarUrl: null,
			locale: "es-CL",
			timezone: "America/Santiago",
			accessToken: "must-not-leak",
			raw_user_meta_data: { role: "admin" },
		},
		role: "user",
		expiresAt: "2026-09-13T20:00:00.000Z",
	});

	assert.equal(session.version, AUTH_CONTRACT_VERSION);
	assert.equal(session.authenticated, true);
	assert.equal(session.role, "user");
	assert.equal(session.user.accessToken, undefined);
	assert.equal(session.user.raw_user_meta_data, undefined);
	assert.deepEqual(Object.keys(session.user), ["id", "displayName", "email", "avatarUrl", "locale", "timezone"]);
});

test("fixtures cover visitor, regular user and administrator roles", () => {
	const visitor = loadFixture("visitor-session.json");
	const user = loadFixture("user-session.json");
	const admin = loadFixture("admin-session.json");

	assert.equal(visitor.authenticated, false);
	assert.equal(user.role, "user");
	assert.equal(admin.role, "admin");
	assert.ok(AUTH_ROLES.includes(user.role));
	assert.ok(AUTH_ROLES.includes(admin.role));
	for (const fixture of [visitor, user, admin]) {
		assert.deepEqual(Object.keys(fixture), SESSION_FIELDS);
		assert.equal("accessToken" in fixture, false);
		assert.equal("refreshToken" in fixture, false);
	}
});

test("rejects unsupported roles and sessions without expiration", () => {
	assert.throws(
		() => createAuthenticatedSession({ user: { id: "user-id" }, role: "admin-from-client", expiresAt: "2026-09-13T20:00:00.000Z" }),
		/Unsupported auth role/,
	);
	assert.throws(
		() => createAuthenticatedSession({ user: { id: "user-id" }, role: "user" }),
		/expiration timestamp/,
	);
});
