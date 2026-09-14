import { NextResponse } from "next/server";
import { AuthenticationRequiredError, AuthorizationDeniedError } from "../auth/guards.js";
import {
	SuggestionConflictError,
	SuggestionNotFoundError,
	SuggestionPersistenceError,
	SuggestionRateLimitError,
	SuggestionSelfReviewError,
	SuggestionValidationError,
} from "./validation.js";

export const PRIVATE_HEADERS = Object.freeze({
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
});

export function json(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...PRIVATE_HEADERS, ...(init.headers || {}) },
	});
}

export function hasAllowedOrigin(request) {
	const origin = request.headers.get("origin");
	return !origin || origin === new URL(request.url).origin;
}

export async function readJson(request, maximumBytes = 16384) {
	const contentType = request.headers.get("content-type") || "";
	if (!contentType.toLowerCase().includes("application/json")) {
		throw new SuggestionValidationError("La solicitud debe enviarse como JSON");
	}
	const contentLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
		throw new SuggestionValidationError("La solicitud es demasiado grande");
	}
	let rawBody;
	try {
		rawBody = await request.text();
		if (rawBody.length > maximumBytes) throw new Error("body-too-large");
		return JSON.parse(rawBody);
	} catch {
		throw new SuggestionValidationError("El cuerpo de la solicitud no es un JSON válido");
	}
}

export function handleSuggestionError(error, fallbackMessage) {
	if (error instanceof AuthenticationRequiredError || error?.status === 401) {
		return json({ error: "Necesitas iniciar sesión para acceder a esta función" }, { status: 401 });
	}
	if (error instanceof AuthorizationDeniedError || error instanceof SuggestionSelfReviewError || error?.status === 403) {
		return json({ error: error.message || "No tienes permiso para acceder a este recurso" }, { status: 403 });
	}
	if (error instanceof SuggestionValidationError) {
		return json({ error: error.message, errors: error.errors }, { status: 422 });
	}
	if (error instanceof SuggestionNotFoundError) return json({ error: error.message }, { status: 404 });
	if (error instanceof SuggestionConflictError) return json({ error: error.message }, { status: 409 });
	if (error instanceof SuggestionRateLimitError) {
		return json(
			{ error: error.message },
			{ status: 429, headers: { "Retry-After": String(error.retryAfterSeconds || 3600) } },
		);
	}
	if (!(error instanceof SuggestionPersistenceError)) {
		console.error("Suggestion route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
	}
	return json({ error: fallbackMessage }, { status: 503 });
}
