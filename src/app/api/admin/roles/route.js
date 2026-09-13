import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { createRoleChangeAuditEntry } from "@/lib/audit/events";
import { requireRole } from "@/lib/auth/roles";
import { shouldPreventLastAdminDemotion, validateRoleChange } from "@/lib/auth/roleChanges";
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

function failureResponse(error, fallbackMessage) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	console.error("Admin role route failed", {
		name: error?.name || "UnknownError",
		status: error?.status || 503,
	});
	return json({ error: fallbackMessage }, { status: 503 });
}

export async function PATCH(request) {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireRole("admin", supabase);
		const contentType = request.headers.get("content-type") || "";
		if (!contentType.toLowerCase().includes("application/json")) {
			return json({ error: "El cambio de rol debe enviarse como JSON" }, { status: 415 });
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

		const validation = validateRoleChange(payload);
		if (!validation.ok) return json({ error: validation.error }, { status: 400 });

		const supabaseAdmin = createSupabaseAdminClient();
		const { data: currentRole, error: roleReadError } = await supabaseAdmin
			.from("roles")
			.select("role, granted_by, granted_at")
			.eq("user_id", validation.userId)
			.maybeSingle();
		if (roleReadError) throw roleReadError;
		if (!currentRole?.role) return json({ error: "No se encontró la cuenta indicada" }, { status: 404 });
		if (currentRole.role === validation.role) return json({ ok: true, changed: false });

		if (currentRole.role === "admin" && validation.role !== "admin") {
			const { count: adminCount, error: adminCountError } = await supabaseAdmin
				.from("roles")
				.select("user_id", { count: "exact", head: true })
				.eq("role", "admin");
			if (adminCountError) throw adminCountError;
			if (shouldPreventLastAdminDemotion({ currentRole: currentRole.role, nextRole: validation.role, adminCount: adminCount || 0 })) {
				return json({ error: "No puedes quitar el último acceso administrativo" }, { status: 409 });
			}
		}

		const { error: roleUpdateError } = await supabaseAdmin
			.from("roles")
			.update({ role: validation.role, granted_by: session.user.id, granted_at: new Date().toISOString() })
			.eq("user_id", validation.userId);
		if (roleUpdateError) throw roleUpdateError;

		const auditEntry = createRoleChangeAuditEntry({
			actorUserId: session.user.id,
			targetUserId: validation.userId,
			previousRole: currentRole.role,
			nextRole: validation.role,
		});
		const { error: auditError } = await supabaseAdmin.from("audit_logs").insert(auditEntry);
		if (auditError) {
			await supabaseAdmin
				.from("roles")
				.update({ role: currentRole.role, granted_by: currentRole.granted_by, granted_at: currentRole.granted_at })
				.eq("user_id", validation.userId);
			throw auditError;
		}

		return json({ ok: true, changed: true });
	} catch (error) {
		return failureResponse(error, "No se pudo actualizar el rol");
	}
}
