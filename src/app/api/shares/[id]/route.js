import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SharePersistenceError, revokePrivateShare } from "@/lib/sharing/service";
import { ShareNotFoundError, ShareValidationError } from "@/lib/sharing/validation";

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

function hasAllowedOrigin(request) {
	const origin = request.headers.get("origin");
	return !origin || origin === new URL(request.url).origin;
}

function failure(error) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	if (error instanceof ShareNotFoundError) return json({ error: "No se encontró el enlace compartido" }, { status: 404 });
	if (error instanceof ShareValidationError) return json({ error: error.message }, { status: 422 });
	if (!(error instanceof SharePersistenceError)) {
		console.error("Share revocation route failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
	}
	return json({ error: "No se pudo revocar el enlace compartido" }, { status: 503 });
}

export async function DELETE(request, { params }) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const { id } = await params;
		const result = await revokePrivateShare({ supabase, ownerUserId: session.user.id, shareId: id });
		return json({ version: 1, ...result });
	} catch (error) {
		return failure(error);
	}
}
