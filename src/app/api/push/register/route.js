import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireRequestAuthenticatedSession } from "@/lib/mobile/auth";
import { mobileJson, readJsonBody } from "@/lib/mobile/http";
import { MOBILE_CONTRACT_VERSION, NOTIFICATION_PLATFORM } from "@/lib/mobile/constants";
import { encryptPushToken, hashPushToken } from "@/lib/mobile/pushTokens";
import { validatePushRegistration } from "@/lib/mobile/validation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function routeFailure(error, message) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	if (error?.code === "PUSH_TOKEN_ENCRYPTION_NOT_CONFIGURED") return mobileJson({ error: "El registro seguro de avisos aún no está configurado" }, { status: 503 });
	console.error("Push registration route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
	return mobileJson({ error: message }, { status: 503 });
}

export async function POST(request) {
	try {
		const { session } = await requireRequestAuthenticatedSession(request);
		const body = await readJsonBody(request, 12_000);
		if (!body.ok) return body.response;
		const validation = validatePushRegistration(body.value);
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });

		const tokenHash = hashPushToken(validation.token);
		const tokenCiphertext = encryptPushToken(validation.token);
		const now = new Date().toISOString();
		const admin = createSupabaseAdminClient();
		const { data, error } = await admin
			.from("push_devices")
			.upsert({
				user_id: session.user.id,
				platform: NOTIFICATION_PLATFORM,
				token_hash: tokenHash,
				token_ciphertext: tokenCiphertext,
				last_seen_at: now,
				revoked_at: null,
				updated_at: now,
			}, { onConflict: "user_id,token_hash" })
			.select("id, platform, last_seen_at, revoked_at")
			.single();
		if (error || !data) throw error || new Error("Push device unavailable");

		return mobileJson({
			version: MOBILE_CONTRACT_VERSION,
			device: { id: data.id, platform: data.platform, lastSeenAt: data.last_seen_at, revoked: Boolean(data.revoked_at) },
		});
	} catch (error) {
		return routeFailure(error, "No se pudo registrar el dispositivo para avisos");
	}
}
