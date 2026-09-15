import { createClient } from "@supabase/supabase-js";
import { mobileJson, parseJsonBody } from "@/lib/mobile/http";
import { validateMobileRefresh } from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

function getPublicClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) throw new Error("Supabase no está configurado");
	return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export async function POST(request) {
	try {
		const validation = validateMobileRefresh(await parseJsonBody(request, { maxBytes: 12_000 }));
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });
		const { data, error } = await getPublicClient().auth.refreshSession({ refresh_token: validation.refreshToken });
		if (error || !data.session) return mobileJson({ error: "La sesión expiró. Inicia sesión nuevamente." }, { status: 401 });
		return mobileJson({ session: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token, expiresAt: data.session.expires_at || null }, user: { id: data.user?.id || null, email: data.user?.email || null } });
	} catch (error) {
		if (error?.status >= 400 && error?.status < 500) return mobileJson({ error: error.message }, { status: error.status });
		console.error("Mobile session refresh failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return mobileJson({ error: "No se pudo renovar la sesión móvil." }, { status: 503 });
	}
}
