import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireRequestAuthenticatedSession } from "@/lib/mobile/auth";
import { mobileJson, readJsonBody } from "@/lib/mobile/http";
import { MOBILE_CONTRACT_VERSION } from "@/lib/mobile/constants";
import { validatePushUnregister } from "@/lib/mobile/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request) {
	try {
		const { session } = await requireRequestAuthenticatedSession(request);
		const body = await readJsonBody(request);
		if (!body.ok) return body.response;
		const validation = validatePushUnregister(body.value);
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });

		const admin = createSupabaseAdminClient();
		const { error } = await admin
			.from("push_devices")
			.update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
			.eq("id", validation.deviceId)
			.eq("user_id", session.user.id)
			.is("revoked_at", null);
		if (error) throw error;
		return mobileJson({ version: MOBILE_CONTRACT_VERSION, revoked: true });
	} catch (error) {
		if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
		console.error("Push unregistration route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return mobileJson({ error: "No se pudo desactivar el dispositivo para avisos" }, { status: 503 });
	}
}
