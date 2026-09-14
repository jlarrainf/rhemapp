import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	SavedReadingNotFoundError,
	SavedReadingPersistenceError,
	deleteSavedReading,
} from "@/lib/savedReadings/service";
import { SavedReadingValidationError } from "@/lib/savedReadings/validation";

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

function handleFailure(error) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	if (error instanceof SavedReadingNotFoundError) return json({ error: error.message }, { status: 404 });
	if (error instanceof SavedReadingValidationError) return json({ error: error.message }, { status: 422 });
	if (!(error instanceof SavedReadingPersistenceError)) {
		console.error("Saved reading resource route failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
	}
	return json({ error: "No se pudo eliminar la lectura guardada" }, { status: 503 });
}

export async function DELETE(request, { params }) {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const { id } = await params;
		return json({ version: 1, ...(await deleteSavedReading(supabase, session.user.id, id)) });
	} catch (error) {
		return handleFailure(error);
	}
}
