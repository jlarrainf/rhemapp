import { MOBILE_CONTRACT_VERSION } from "@/lib/mobile/constants";
import { mobileJson, parseJsonBody } from "@/lib/mobile/http";
import { requireRequestAuthenticatedSession } from "@/lib/mobile/auth";
import { createNotificationPreferenceView, validateNotificationPreferencesPatch } from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

const FIELDS = "user_id, enabled, local_time, timezone";

export async function GET(request) {
	try {
		const { supabase, user } = await requireRequestAuthenticatedSession(request);
		const { data, error } = await supabase.from("notification_preferences").select(FIELDS).eq("user_id", user.id).maybeSingle();
		if (error) throw error;
		return mobileJson({ version: MOBILE_CONTRACT_VERSION, preferences: createNotificationPreferenceView(data) });
	} catch (error) {
		if (error?.status === 401) return mobileJson({ error: error.message }, { status: 401 });
		console.error("Notification preferences read failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return mobileJson({ error: "No se pudieron cargar las preferencias de avisos." }, { status: 503 });
	}
}

export async function PATCH(request) {
	try {
		const { supabase, user } = await requireRequestAuthenticatedSession(request);
		const validation = validateNotificationPreferencesPatch(await parseJsonBody(request));
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });
		const { data, error } = await supabase.from("notification_preferences").upsert({ user_id: user.id, ...validation.updates }, { onConflict: "user_id" }).select(FIELDS).single();
		if (error) throw error;
		return mobileJson({ version: MOBILE_CONTRACT_VERSION, preferences: createNotificationPreferenceView(data) });
	} catch (error) {
		if (error?.status === 401 || error?.status === 400 || error?.status === 413 || error?.status === 415) return mobileJson({ error: error.message }, { status: error.status });
		console.error("Notification preferences update failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return mobileJson({ error: "No se pudieron guardar las preferencias de avisos." }, { status: 503 });
	}
}
