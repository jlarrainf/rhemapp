import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../supabase/server.js";
import { requireAuthenticatedSession } from "../auth/guards.js";
import { getBearerToken } from "./http.js";

function getPublicSupabaseConfig() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !publishableKey) throw new Error("Falta configurar Supabase en el servidor");
	return { url, publishableKey };
}

export async function createRequestSupabaseClient(request) {
	const bearerToken = getBearerToken(request);
	if (!bearerToken) return createSupabaseServerClient();
	const { url, publishableKey } = getPublicSupabaseConfig();
	return createClient(url, publishableKey, {
		auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
		global: { headers: { Authorization: `Bearer ${bearerToken}` } },
	});
}

export async function requireRequestAuthenticatedSession(request) {
	const supabase = await createRequestSupabaseClient(request);
	const session = await requireAuthenticatedSession(supabase);
	return { supabase, session };
}
