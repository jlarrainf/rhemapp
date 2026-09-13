import { NextResponse } from "next/server";
import { AuthenticationRequiredError, AuthorizationDeniedError } from "./guards.js";

const PRIVATE_RESPONSE_HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
};

export function createAuthErrorResponse(error) {
	if (error instanceof AuthenticationRequiredError || error?.status === 401) {
		return NextResponse.json(
			{ error: "Necesitas iniciar sesión para acceder a esta función" },
			{ status: 401, headers: PRIVATE_RESPONSE_HEADERS },
		);
	}

	if (error instanceof AuthorizationDeniedError || error?.status === 403) {
		return NextResponse.json(
			{ error: "No tienes permiso para acceder a este recurso" },
			{ status: 403, headers: PRIVATE_RESPONSE_HEADERS },
		);
	}

	if (error?.status !== 503) {
		console.error("Auth guard failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 500,
		});
	}

	return NextResponse.json(
		{ error: "No se pudo comprobar el acceso" },
		{ status: 503, headers: PRIVATE_RESPONSE_HEADERS },
	);
}
