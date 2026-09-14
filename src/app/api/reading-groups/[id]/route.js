import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
	ReadingGroupPersistenceError,
	deleteReadingGroup,
	updateReadingGroup,
} from "@/lib/readingGroups/service";
import {
	ReadingGroupNotFoundError,
	ReadingGroupValidationError,
} from "@/lib/readingGroups/validation";

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
	if (error instanceof ReadingGroupNotFoundError) return json({ error: error.message }, { status: 404 });
	if (error instanceof ReadingGroupValidationError) return json({ error: error.message }, { status: 422 });
	if (!(error instanceof ReadingGroupPersistenceError)) {
		console.error("Reading group resource route failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
	}
	return json({ error: fallbackMessage }, { status: 503 });
}

async function readJson(request) {
	const contentType = request.headers.get("content-type") || "";
	if (!contentType.toLowerCase().includes("application/json")) {
		throw new ReadingGroupValidationError("La solicitud debe enviarse como JSON");
	}
	try {
		const body = await request.text();
		if (body.length > 8192) throw new Error("body-too-large");
		return JSON.parse(body);
	} catch {
		throw new ReadingGroupValidationError("El cuerpo de la solicitud no es un JSON válido");
	}
}

export async function PATCH(request, { params }) {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const { id } = await params;
		const payload = await readJson(request);
		return json({ version: 1, group: await updateReadingGroup(supabase, session.user.id, id, payload?.name) });
	} catch (error) {
		return handleFailure(error, "No se pudo actualizar el grupo");
	}
}

export async function DELETE(request, { params }) {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const { id } = await params;
		return json({ version: 1, ...(await deleteReadingGroup(supabase, session.user.id, id)) });
	} catch (error) {
		return handleFailure(error, "No se pudo eliminar el grupo");
	}
}
