import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MOBILE_CONTRACT_VERSION, NOTIFICATION_PLATFORM } from "@/lib/mobile/constants";
import { requireRequestAuthenticatedSession } from "@/lib/mobile/auth";
import { mobileJson, parseJsonBody } from "@/lib/mobile/http";
import { encryptPushToken, hashPushToken } from "@/lib/mobile/pushTokens";
import { validatePushRegistration } from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

export async function POST(request) {
	try {
		const { user } = await requireRequestAuthenticatedSession(request);
		const validation = validatePushRegistration(await parseJsonBody(request, { maxBytes: 8192 }));
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });
		const admin = createSupabaseAdminClient();
		const tokenHash = hashPushToken(validation.token);
		const { data, error } = await admin.from("push_devices").upsert({ user_id: user.id, platform: NOTIFICATION_PLATFORM, token_hash: tokenHash, token_ciphertext: encryptPushToken(validation.token), last_seen_at: new Date().toISOString(), revoked_at: null }, { onConflict: "user_id,token_hash" }).select("id, platform, last_seen_at, revoked_at").single();
		if (error) throw error;
		return mobileJson({ version: MOBILE_CONTRACT_VERSION, device: { id: data.id, platform: data.platform, lastSeenAt: data.last_seen_at, revoked: Boolean(data.revoked_at) } });
	} catch (error) {
		if (error?.status === 401 || error?.status === 400 || error?.status === 413 || error?.status === 415) return mobileJson({ error: error.message }, { status: error.status });
		console.error("Push device registration failed", { name: error?.name || "UnknownError", code: error?.code || "registration_failed", status: error?.status || 503 });
		return mobileJson({ error: "No se pudo registrar este dispositivo." }, { status: 503 });
	}
}
