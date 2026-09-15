import { createClient } from "@supabase/supabase-js";
import { validateLoginRequest } from "@/lib/auth/credentials";
import { AUTH_UI_MESSAGES, getSupabaseAuthErrorMessage } from "@/lib/auth/messages";
import { AuthRateLimitExceededError, consumeAuthRateLimit, getClientIp, isCredentialFailure, isProviderRateLimit } from "@/lib/auth/rateLimit";
import { mobileJson, parseJsonBody, isSameOrigin } from "@/lib/mobile/http";

export const dynamic = "force-dynamic";

function getPublicClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) throw new Error("Supabase no está configurado");
	return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export async function POST(request) {
	try {
		if (!isSameOrigin(request)) return mobileJson({ error: "Solicitud no autorizada" }, { status: 403 });
		const payload = await parseJsonBody(request, { maxBytes: 8192 });
		const validation = validateLoginRequest(payload);
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });
		const admin = (await import("@/lib/supabase/admin")).createSupabaseAdminClient();
		const rateLimitContext = { action: "login", email: validation.email, ip: getClientIp(request) };
		await consumeAuthRateLimit(admin, rateLimitContext);
		const { data, error } = await getPublicClient().auth.signInWithPassword({ email: validation.email, password: validation.password });
		if (error) {
			if (isProviderRateLimit(error)) return mobileJson({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
			if (isCredentialFailure(error)) {
				try { await consumeAuthRateLimit(admin, { ...rateLimitContext, recordFailure: true }); } catch (rateError) {
					if (rateError instanceof AuthRateLimitExceededError || rateError?.status === 429) return mobileJson({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
					throw rateError;
				}
				return mobileJson({ error: getSupabaseAuthErrorMessage(error) }, { status: 401 });
			}
			console.error("Mobile password login failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
			return mobileJson({ error: "No se pudo iniciar sesión. Inténtalo nuevamente." }, { status: 503 });
		}
		return mobileJson({ session: { accessToken: data.session?.access_token, refreshToken: data.session?.refresh_token, expiresAt: data.session?.expires_at || null }, user: { id: data.user?.id, email: data.user?.email || null } });
	} catch (error) {
		if (error instanceof AuthRateLimitExceededError || error?.status === 429) return mobileJson({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
		if (error?.status >= 400 && error?.status < 500) return mobileJson({ error: error.message }, { status: error.status });
		console.error("Mobile password login route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return mobileJson({ error: "La autenticación no está disponible en este momento." }, { status: 503 });
	}
}
