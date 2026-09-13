import assert from "node:assert/strict";
import test from "node:test";
import {
	AUTH_CALLBACK_PATH,
	AUTH_ERROR_CODES,
	createAuthErrorPath,
	createGoogleOAuthRedirectTo,
	getSafeNextPath,
} from "../src/lib/auth/oauth.js";
import {
	AUTH_UI_MESSAGES,
	getAuthErrorMessage,
	getSupabaseAuthErrorMessage,
} from "../src/lib/auth/messages.js";

test("keeps OAuth callback redirects on the same origin", () => {
	const redirect = new URL(createGoogleOAuthRedirectTo("https://rhemapp.example", "/daily?mode=sunday"));

	assert.equal(redirect.origin, "https://rhemapp.example");
	assert.equal(redirect.pathname, AUTH_CALLBACK_PATH);
	assert.equal(redirect.searchParams.get("next"), "/daily?mode=sunday");
});

test("rejects open redirects in the post-login destination", () => {
	assert.equal(getSafeNextPath("https://evil.example"), "/");
	assert.equal(getSafeNextPath("//evil.example"), "/");
	assert.equal(getSafeNextPath("javascript:alert(1)"), "/");
	assert.equal(getSafeNextPath("/perfil"), "/perfil");
});

test("uses stable non-sensitive OAuth error codes", () => {
	assert.equal(createAuthErrorPath(AUTH_ERROR_CODES.cancelled), "/login?error=oauth_cancelled");
	assert.equal(createAuthErrorPath(AUTH_ERROR_CODES.callback), "/login?error=oauth_callback");
});

test("maps OAuth and provider failures to Spanish messages without exposing raw errors", () => {
	assert.equal(getAuthErrorMessage(AUTH_ERROR_CODES.cancelled), AUTH_UI_MESSAGES.cancelled);
	assert.equal(
		getSupabaseAuthErrorMessage({ code: "invalid_credentials", message: "secret backend detail" }),
		AUTH_UI_MESSAGES.invalidCredentials
	);
	assert.equal(
		getSupabaseAuthErrorMessage({ code: "over_request_rate_limit" }),
		AUTH_UI_MESSAGES.rateLimited
	);
	assert.equal(
		getSupabaseAuthErrorMessage({ code: "unknown", message: "private detail" }, "signup"),
		AUTH_UI_MESSAGES.genericSignup
	);
});
