import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getBearerToken } from "./http.js";

function getConfig() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) throw new Error("Falta configurar Supabase en el servidor");
	return { url, key };
}

export async function createRequestSupabaseClient(request) {
	const { url, key } = getConfig();
	const bearer = getBearerToken(request);
	if (bearer) {
		return createClient(url, key, {
			global: { headers: { Authorization: `Bearer ${bearer}` } },
			auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
		});
	}
	const cookieStore = await cookies();
	return createServerClient(url, key, {
		cookies: {
			getAll: () => cookieStore.getAll(),
			setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
		},
	});
}

export async function requireRequestAuthenticatedSession(request) {
	const supabase = await createRequestSupabaseClient(request);
	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) {
		const authError = new Error("Necesitas iniciar sesión para continuar");
		authError.status = 401;
		throw authError;
	}
	return { supabase, user: data.user };
}
