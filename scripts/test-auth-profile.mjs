import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	createProfileView,
	validateProfileUpdate,
} from "../src/lib/profile/validation.js";

const profileRoute = await readFile(new URL("../src/app/api/profile/route.js", import.meta.url), "utf8");
const profileForm = await readFile(new URL("../src/app/perfil/ProfileForm.jsx", import.meta.url), "utf8");
const migration = await readFile(
	new URL("../supabase/migrations/20260913204558_authentication_profiles_roles_audit.sql", import.meta.url),
	"utf8",
);
const themeMigration = await readFile(
	new URL("../supabase/migrations/20260914164207_add_theme_preferences.sql", import.meta.url),
	"utf8",
);

test("validates and maps only the approved profile fields", () => {
	const result = validateProfileUpdate({
		displayName: "  Persona  ",
		avatarUrl: "https://example.com/avatar.png",
		locale: "es-CL",
		timezone: "America/Santiago",
		themePreference: "system",
	});

	assert.deepEqual(result, {
		ok: true,
		updates: {
			display_name: "Persona",
			avatar_url: "https://example.com/avatar.png",
			locale: "es-CL",
			timezone: "America/Santiago",
			theme_preference: "system",
		},
	});
});

test("rejects identity, email, role and malformed values", () => {
	for (const payload of [
		{ email: "other@example.com" },
		{ role: "admin" },
		{ userId: "another-user" },
		{ avatarUrl: "javascript:alert(1)" },
		{ locale: "not-a-locale" },
		{ timezone: "Not/A-Timezone" },
		{ themePreference: "auto" },
	]) {
		assert.equal(validateProfileUpdate(payload).ok, false);
	}
});

test("creates a public profile view without role or provider metadata", () => {
	const view = createProfileView({
		sessionUser: {
			id: "user-id",
			email: "persona@example.com",
			displayName: null,
			avatarUrl: null,
			locale: "es-CL",
			timezone: "America/Santiago",
			role: "admin",
			accessToken: "secret",
		},
		profile: { display_name: "Persona", avatar_url: null, locale: "es-CL", timezone: "America/Santiago" },
	});

	assert.deepEqual(Object.keys(view).sort(), ["avatarUrl", "displayName", "email", "id", "locale", "themePreference", "timezone"]);
	assert.equal(view.themePreference, "system");
	assert.equal("role" in view, false);
	assert.equal("accessToken" in view, false);
});

test("profile API authenticates first and scopes reads and writes to the session user", () => {
	assert.match(profileRoute, /export async function GET/);
	assert.match(profileRoute, /export async function PATCH/);
	assert.match(profileRoute, /requireAuthenticatedSession/);
	assert.match(profileRoute, /theme_preference/);
	assert.match(profileRoute, /\.eq\("user_id", session\.user\.id\)/g);
	assert.doesNotMatch(profileRoute, /\.update\([^)]*email/);
});

test("profile UI submits only approved fields and keeps unexpected errors generic", () => {
	for (const field of ["displayName", "avatarUrl", "locale", "timezone"]) {
		assert.match(profileForm, new RegExp(field));
	}
	assert.match(profileForm, /method: "PATCH"/);
	assert.doesNotMatch(profileForm, /requestError\.message/);
	assert.match(profileForm, /PROFILE_UPDATE_ERROR/);
});

test("database grants restrict profile updates to approved columns", () => {
	assert.match(migration, /grant update \(display_name, avatar_url, locale, timezone\) on public\.profiles to authenticated/i);
	assert.doesNotMatch(migration, /grant select, insert, update on public\.profiles to authenticated/i);
	assert.match(themeMigration, /add column theme_preference text not null default 'system'/i);
	assert.match(themeMigration, /check \(theme_preference in \('system', 'light', 'dark'\)\)/i);
	assert.match(themeMigration, /grant update \(theme_preference\) on public\.profiles to authenticated/i);
});
