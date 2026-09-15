import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireRequestAuthenticatedSession } from "@/lib/mobile/auth";
import { mobileJson, parseJsonBody } from "@/lib/mobile/http";
import { validatePushUnregister } from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

export async function POST(request) {
	try {
		const { user } = await requireRequestAuthenticatedSession(request);
		const validation = validatePushUnregister(await parseJsonBody(request, { maxBytes: 8192 }));
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });
		const { error } = await createSupabaseAdminClient().from("push_devices").update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", validation.deviceId).eq("user_id", user.id).is("revoked_at", null);
		if (error) throw error;
		return mobileJson({ ok: true });
	} catch (error) {
		if (error?.status === 401 || error?.status === 400 || error?.status === 413 || error?.status === 415) return mobileJson({ error: error.message }, { status: error.status });
		console.error("Push device revocation failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return mobileJson({ error: "No se pudo desactivar este dispositivo." }, { status: 503 });
	}
}
