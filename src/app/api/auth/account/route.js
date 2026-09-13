import { NextResponse } from "next/server";
import { createAuditAnonymizationUpdate, validateAccountDeletionRequest } from "@/lib/auth/accountDeletion";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
};

function json(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...RESPONSE_HEADERS, ...(init.headers || {}) },
	});
}

function deletionFailure(error) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	console.error("Account deletion failed", {
		name: error?.name || "UnknownError",
		status: error?.status || 503,
	});
	return json({ error: "No se pudo eliminar la cuenta" }, { status: 503 });
}

function hasAllowedOrigin(request) {
	const origin = request.headers.get("origin");
	return !origin || origin === new URL(request.url).origin;
}

async function anonymizeUserAuditLogs(supabaseAdmin, userId, anonymizedAt) {
	const update = createAuditAnonymizationUpdate(anonymizedAt);
	const { error: actorError } = await supabaseAdmin
		.from("audit_logs")
		.update(update)
		.eq("actor_user_id", userId);
	if (actorError) throw actorError;

	const { error: targetError } = await supabaseAdmin
		.from("audit_logs")
		.update(update)
		.eq("target_id", userId);
	if (targetError) throw targetError;
}

export async function DELETE(request) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });

		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const contentType = request.headers.get("content-type") || "";
		if (!contentType.toLowerCase().includes("application/json")) {
			return json({ error: "La confirmación debe enviarse como JSON" }, { status: 415 });
		}

		const contentLength = Number(request.headers.get("content-length"));
		if (Number.isFinite(contentLength) && contentLength > 4096) {
			return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
		}

		let payload;
		try {
			const rawBody = await request.text();
			if (rawBody.length > 4096) return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
			payload = JSON.parse(rawBody);
		} catch {
			return json({ error: "El cuerpo de la solicitud no es un JSON válido" }, { status: 400 });
		}

		const validation = validateAccountDeletionRequest(payload);
		if (!validation.ok) return json({ error: validation.error }, { status: 400 });

		const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
		if (signOutError) throw signOutError;

		const supabaseAdmin = createSupabaseAdminClient();
		const anonymizedAt = new Date().toISOString();
		await anonymizeUserAuditLogs(supabaseAdmin, session.user.id, anonymizedAt);

		const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(session.user.id, false);
		if (deleteError) throw deleteError;

		return json({ ok: true });
	} catch (error) {
		return deletionFailure(error);
	}
}
