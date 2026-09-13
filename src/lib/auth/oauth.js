export const AUTH_CALLBACK_PATH = "/auth/callback";
export const PASSWORD_RESET_PATH = "/restablecer";

export const AUTH_ERROR_CODES = Object.freeze({
	cancelled: "oauth_cancelled",
	callback: "oauth_callback",
	missingCode: "oauth_missing_code",
	configuration: "auth_configuration",
	accountDeleted: "account_deleted",
});

export function getSafeNextPath(value) {
	if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
	return value;
}

export function createGoogleOAuthRedirectTo(origin, nextPath = "/") {
	return createAuthCallbackRedirectTo(origin, nextPath);
}

export function createPasswordRecoveryRedirectTo(origin) {
	return createAuthCallbackRedirectTo(origin, PASSWORD_RESET_PATH);
}

export function createAuthCallbackRedirectTo(origin, nextPath = "/") {
	const callbackUrl = new URL(AUTH_CALLBACK_PATH, origin);
	callbackUrl.searchParams.set("next", getSafeNextPath(nextPath));
	return callbackUrl.toString();
}

export function createAuthErrorPath(errorCode) {
	const url = new URL("/login", "http://rhemapp.invalid");
	url.searchParams.set("error", errorCode);
	return `${url.pathname}${url.search}`;
}
