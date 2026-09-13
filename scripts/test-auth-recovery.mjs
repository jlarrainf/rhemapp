import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
	AUTH_RECOVERY_PATH,
	PASSWORD_RESET_PATH,
	RECOVERY_GENERIC_MESSAGE,
	createPasswordRecoveryRedirectTo,
	validateRecoveryRequest,
} from "../src/lib/auth/recovery.js";

const oauth = await readFile(new URL("../src/lib/auth/oauth.js", import.meta.url), "utf8");
const recoveryRoute = await readFile(new URL("../src/app/api/auth/recovery/route.js", import.meta.url), "utf8");
const recoveryForm = await readFile(new URL("../src/app/recuperar/RecoveryForm.jsx", import.meta.url), "utf8");
const resetPage = await readFile(new URL("../src/app/restablecer/page.js", import.meta.url), "utf8");
const resetForm = await readFile(new URL("../src/app/restablecer/PasswordResetForm.jsx", import.meta.url), "utf8");
const loginForm = await readFile(new URL("../src/app/login/LoginForm.jsx", import.meta.url), "utf8");

test("validates recovery requests without accepting account-enumeration fields", () => {
	assert.deepEqual(validateRecoveryRequest({ email: "person@example.com" }), {
		ok: true,
		email: "person@example.com",
	});
	assert.equal(validateRecoveryRequest({ email: " PERSON@EXAMPLE.COM " }).email, "person@example.com");
	assert.equal(validateRecoveryRequest({ email: "not-an-email" }).ok, false);
	assert.equal(validateRecoveryRequest({ email: "person@example.com", exists: true }).ok, false);
	assert.equal(validateRecoveryRequest({}).ok, false);
});

test("builds a password recovery callback on the same origin", () => {
	const redirect = new URL(createPasswordRecoveryRedirectTo("https://rhemapp.example"));

	assert.equal(redirect.origin, "https://rhemapp.example");
	assert.equal(redirect.pathname, "/auth/callback");
	assert.equal(redirect.searchParams.get("next"), PASSWORD_RESET_PATH);
	assert.equal(AUTH_RECOVERY_PATH, "/recuperar");
	assert.match(oauth, /createPasswordRecoveryRedirectTo/);
});

test("recovery route requests reset email with a generic response", () => {
	assert.match(recoveryRoute, /export async function POST/);
	assert.match(recoveryRoute, /resetPasswordForEmail/);
	assert.match(recoveryRoute, /createPasswordRecoveryRedirectTo/);
	assert.match(recoveryRoute, /RECOVERY_GENERIC_MESSAGE/);
	assert.match(RECOVERY_GENERIC_MESSAGE, /Si el correo corresponde/);
	assert.doesNotMatch(recoveryRoute, /data\.user/);
	assert.doesNotMatch(recoveryRoute, /error\.message/);
});

test("recovery and password reset UI expose safe Spanish states", () => {
	for (const value of ["Correo electrónico", "Solicitar recuperación", "role=\"status\"", "role=\"alert\""]) {
		assert.match(recoveryForm, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
	}
	assert.match(recoveryForm, /fetch\("\/api\/auth\/recovery"/);
	assert.match(resetPage, /requireAuthenticatedSession/);
	assert.match(resetForm, /updateUser/);
	assert.match(resetForm, /Contraseña nueva/);
	assert.match(resetForm, /role="status"/);
	assert.doesNotMatch(recoveryForm, /error\.message/);
	assert.doesNotMatch(resetForm, /error\.message/);
});

test("login links to password recovery without changing signup behavior", () => {
	assert.match(loginForm, /\/recuperar/);
	assert.match(loginForm, /¿Olvidaste tu contraseña\?/);
	assert.match(loginForm, /mode === "login"/);
});
