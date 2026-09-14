import { NextResponse } from "next/server";
import { AuthenticationRequiredError, AuthorizationDeniedError } from "../auth/guards.js";
import { LectioGenerationInputError, LectioPersistenceError } from "./service.js";
import { LectioValidationError } from "./validation.js";

export const LECTIO_PUBLIC_HEADERS = Object.freeze({
	"Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
	"X-Content-Type-Options": "nosniff",
});

export const LECTIO_PRIVATE_HEADERS = Object.freeze({
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
	"X-Content-Type-Options": "nosniff",
});

export function json(data, init = {}, headers = LECTIO_PUBLIC_HEADERS) {
	return NextResponse.json(data, { ...init, headers: { ...headers, ...(init.headers || {}) } });
}

export function handleLectioError(error, fallbackMessage = "No se pudo procesar Lectio divina") {
	if (error instanceof AuthenticationRequiredError || error?.status === 401) return json({ error: "Necesitas iniciar sesión para acceder a esta función" }, { status: 401 }, LECTIO_PRIVATE_HEADERS);
	if (error instanceof AuthorizationDeniedError || error?.status === 403) return json({ error: error.message || "No tienes permiso para acceder a este recurso" }, { status: 403 }, LECTIO_PRIVATE_HEADERS);
	if (error instanceof LectioValidationError || error instanceof LectioGenerationInputError) return json({ error: error.message, errors: error.errors }, { status: 422 }, LECTIO_PRIVATE_HEADERS);
	if (error instanceof LectioPersistenceError) return json({ error: fallbackMessage }, { status: 503 }, LECTIO_PRIVATE_HEADERS);
	console.error("Lectio route failed", { name: error?.name || "UnknownError", code: error?.code || null, status: error?.status || 503 });
	return json({ error: fallbackMessage }, { status: 503 }, LECTIO_PRIVATE_HEADERS);
}
