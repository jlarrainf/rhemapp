import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireRequestAuthenticatedSession } from "@/lib/mobile/auth";
import { mobileJson, readJsonBody } from "@/lib/mobile/http";
import { MOBILE_CONTRACT_VERSION, DEFAULT_NOTIFICATION_TIMEZONE } from "@/lib/mobile/constants";
import {
	createNotificationPreferenceView,
	validateNotificationPreferencesPatch,
} from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

const PREFERENCE_SELECT = "user_id, enabled, local_time, timezone";

async function getPreference(supabase, userId) {
	const { data, error } = await supabase.from("notification_preferences").select(PREFERENCE_SELECT).eq("user_id", userId).maybeSingle();
	if (error) throw error;
	return data;
}

function preferenceResponse(preference, session) {
	return mobileJson({
		version: MOBILE_CONTRACT_VERSION,
		preferences: createNotificationPreferenceView(preference, session.user.timezone || DEFAULT_NOTIFICATION_TIMEZONE),
	});
}

function routeFailure(error, message) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	console.error("Notification preferences route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
	return mobileJson({ error: message }, { status: 503 });
}

export async function GET(request) {
	try {
		const { supabase, session } = await requireRequestAuthenticatedSession(request);
		return preferenceResponse(await getPreference(supabase, session.user.id), session);
	} catch (error) {
		return routeFailure(error, "No se pudieron cargar las preferencias de avisos");
	}
}

export async function PATCH(request) {
	try {
		const { supabase, session } = await requireRequestAuthenticatedSession(request);
		const body = await readJsonBody(request);
		if (!body.ok) return body.response;
		const validation = validateNotificationPreferencesPatch(body.value);
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });

		const { data, error } = await supabase
			.from("notification_preferences")
			.upsert({ user_id: session.user.id, ...validation.updates }, { onConflict: "user_id" })
			.select(PREFERENCE_SELECT)
			.single();
		if (error || !data) throw error || new Error("Notification preference unavailable");
		return preferenceResponse(data, session);
	} catch (error) {
		return routeFailure(error, "No se pudieron guardar las preferencias de avisos");
	}
}
