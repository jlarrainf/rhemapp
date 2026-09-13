const GENERIC_LOGIN_ERROR = "No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.";

export const AUTH_UI_MESSAGES = Object.freeze({
	configuration: "La autenticación no está disponible en este momento.",
	accountDeleted: "Tu cuenta y tus datos privados fueron eliminados.",
	cancelled: "Cancelaste el inicio de sesión con Google.",
	callback: "No pudimos completar el inicio de sesión con Google. Inténtalo nuevamente.",
	missingCode: "No recibimos una respuesta válida de Google. Inténtalo nuevamente.",
	invalidCredentials: "Correo o contraseña incorrectos.",
	emailNotConfirmed: "Confirma tu correo electrónico antes de iniciar sesión.",
	rateLimited: "Has alcanzado el límite temporal. Espera unos minutos e inténtalo nuevamente.",
	logout: "No se pudo cerrar sesión. Inténtalo nuevamente.",
	passwordUpdate: "No se pudo actualizar la contraseña. Inténtalo nuevamente.",
	genericLogin: GENERIC_LOGIN_ERROR,
	genericSignup: "No pudimos crear la cuenta. Revisa los datos e inténtalo nuevamente.",
});

const ERROR_CODE_MESSAGES = Object.freeze({
	oauth_cancelled: AUTH_UI_MESSAGES.cancelled,
	oauth_callback: AUTH_UI_MESSAGES.callback,
	oauth_missing_code: AUTH_UI_MESSAGES.missingCode,
	auth_configuration: AUTH_UI_MESSAGES.configuration,
	account_deleted: AUTH_UI_MESSAGES.accountDeleted,
});

export function getAuthErrorMessage(errorCode) {
	return ERROR_CODE_MESSAGES[errorCode] || AUTH_UI_MESSAGES.genericLogin;
}

export function getSupabaseAuthErrorMessage(error, context = "login") {
	const code = typeof error?.code === "string" ? error.code : "";
	const message = typeof error?.message === "string" ? error.message.toLowerCase() : "";

	if (code === "over_request_rate_limit" || code === "too_many_requests") {
		return AUTH_UI_MESSAGES.rateLimited;
	}

	if (code === "email_not_confirmed") {
		return AUTH_UI_MESSAGES.emailNotConfirmed;
	}

	if (
		code === "invalid_credentials" ||
		message.includes("invalid login credentials")
	) {
		return AUTH_UI_MESSAGES.invalidCredentials;
	}

	if (context === "signup") return AUTH_UI_MESSAGES.genericSignup;
	if (context === "logout") return AUTH_UI_MESSAGES.logout;
	if (context === "password") return AUTH_UI_MESSAGES.passwordUpdate;
	return GENERIC_LOGIN_ERROR;
}
