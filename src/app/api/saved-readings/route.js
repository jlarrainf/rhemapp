import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SavedReadingKeyError } from "@/lib/savedReadings/canonicalKeys";
import { SavedReadingValidationError } from "@/lib/savedReadings/validation";
import {
	SavedReadingPersistenceError,
	listSavedReadings,
	saveReading,
} from "@/lib/savedReadings/service";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
};

function json(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...PRIVATE_HEADERS, ...(init.headers || {}) },
	});
}

function handleFailure(error, fallbackMessage) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	if (error instanceof SavedReadingKeyError || error instanceof SavedReadingValidationError) {
		return json({ error: error.message }, { status: 422 });
	}
	if (!(error instanceof SavedReadingPersistenceError)) {
		console.error("Saved readings route failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
	}
	return json({ error: fallbackMessage }, { status: 503 });
}

async function readJson(request) {
	const contentType = request.headers.get("content-type") || "";
	if (!contentType.toLowerCase().includes("application/json")) {
		throw new SavedReadingValidationError("La solicitud debe enviarse como JSON");
	}

	const contentLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(contentLength) && contentLength > 32768) {
		throw new SavedReadingValidationError("La solicitud es demasiado grande");
	}

	let rawBody;
	try {
		rawBody = await request.text();
		if (rawBody.length > 32768) throw new Error("body-too-large");
		return JSON.parse(rawBody);
	} catch {
		throw new SavedReadingValidationError("El cuerpo de la solicitud no es un JSON válido");
	}
}

export async function GET() {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const items = await listSavedReadings(supabase, session.user.id);
		return json({ version: 1, items });
	} catch (error) {
		return handleFailure(error, "No se pudieron cargar tus lecturas guardadas");
	}
}

export async function POST(request) {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const payload = await readJson(request);
		const result = await saveReading({ supabase, userId: session.user.id, payload });
		return json(
			{ version: 1, created: result.created, item: result.item },
			{ status: result.created ? 201 : 200 },
		);
	} catch (error) {
		return handleFailure(error, "No se pudo guardar la lectura");
	}
}
