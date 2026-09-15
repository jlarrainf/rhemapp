import { createClient } from "@supabase/supabase-js";
import { AUTH_UI_MESSAGES } from "@/lib/auth/messages";
import { AuthRateLimitExceededError, consumeAuthRateLimit, createRateLimitKeyHash, getClientIp, isProviderRateLimit } from "@/lib/auth/rateLimit";
import { mobileJson, parseJsonBody, isSameOrigin } from "@/lib/mobile/http";
import { validateMobileGoogleLogin } from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

function getPublicClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !key) throw new Error("Supabase no está configurado");
	return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

function createGoogleRateLimitContext(request, idToken) {
	const tokenHash = createRateLimitKeyHash("google-id-token", idToken);
	return { action: "login", email: `google:${tokenHash}`, ip: getClientIp(request) };
}

function sessionPayload(data) {
	return {
		session: {
			accessToken: data.session?.access_token,
			refreshToken: data.session?.refresh_token,
			expiresAt: data.session?.expires_at || null,
		},
		user: { id: data.user?.id, email: data.user?.email || null },
	};
}

export async function POST(request) {
	try {
		if (!isSameOrigin(request)) return mobileJson({ error: "Solicitud no autorizada" }, { status: 403 });
		const validation = validateMobileGoogleLogin(await parseJsonBody(request, { maxBytes: 20_000 }));
		if (!validation.ok) return mobileJson({ error: validation.error }, { status: 400 });

		const admin = (await import("@/lib/supabase/admin")).createSupabaseAdminClient();
		const rateLimitContext = createGoogleRateLimitContext(request, validation.idToken);
		await consumeAuthRateLimit(admin, rateLimitContext);
		const { data, error } = await getPublicClient().auth.signInWithIdToken({ provider: "google", token: validation.idToken, nonce: validation.nonce });
		if (error || !data.session) {
			try { await consumeAuthRateLimit(admin, { ...rateLimitContext, recordFailure: true }); } catch (rateError) {
				if (rateError instanceof AuthRateLimitExceededError || rateError?.status === 429) return mobileJson({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
				throw rateError;
			}
			if (isProviderRateLimit(error)) return mobileJson({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
			console.error("Mobile Google login failed", { name: error?.name || "AuthError", status: error?.status || 401 });
			return mobileJson({ error: "No se pudo validar la cuenta de Google. Inténtalo nuevamente." }, { status: 401 });
		}
		return mobileJson(sessionPayload(data));
	} catch (error) {
		if (error instanceof AuthRateLimitExceededError || error?.status === 429) return mobileJson({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
		if (error?.status >= 400 && error?.status < 500) return mobileJson({ error: error.message }, { status: error.status });
		console.error("Mobile Google login route failed", { name: error?.name || "AuthError", status: error?.status || 503 });
		return mobileJson({ error: "La autenticación con Google no está disponible en este momento." }, { status: 503 });
	}
}
