import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	SavedReadingMembershipNotFoundError,
	SavedReadingMembershipPersistenceError,
	SavedReadingMembershipValidationError,
	addSavedReadingToGroup,
	removeSavedReadingFromGroup,
} from "@/lib/savedReadings/memberships";

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
	if (error instanceof SavedReadingMembershipNotFoundError) return json({ error: error.message }, { status: 404 });
	if (error instanceof SavedReadingMembershipValidationError) return json({ error: error.message }, { status: 422 });
	if (!(error instanceof SavedReadingMembershipPersistenceError)) {
		console.error("Saved reading membership route failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
	}
	return json({ error: fallbackMessage }, { status: 503 });
}

async function resolveRequest(request, params) {
	const supabase = await createSupabaseServerClient();
	const session = await requireAuthenticatedSession(supabase);
	const { id, groupId } = await params;
	return { supabase, userId: session.user.id, savedItemId: id, groupId };
}

export async function POST(request, { params }) {
	try {
		const context = await resolveRequest(request, params);
		const result = await addSavedReadingToGroup(context);
		return json(
			{ version: 1, created: result.created, membership: result },
			{ status: result.created ? 201 : 200 },
		);
	} catch (error) {
		return handleFailure(error, "No se pudo agregar la lectura al grupo");
	}
}

export async function DELETE(request, { params }) {
	try {
		const context = await resolveRequest(request, params);
		const result = await removeSavedReadingFromGroup(context);
		return json({ version: 1, ...result });
	} catch (error) {
		return handleFailure(error, "No se pudo quitar la lectura del grupo");
	}
}
