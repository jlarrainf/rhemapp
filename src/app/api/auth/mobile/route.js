import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { validateLoginRequest } from "@/lib/auth/credentials";
import { getSupabaseAuthErrorMessage } from "@/lib/auth/messages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
	AuthRateLimitExceededError,
	consumeAuthRateLimit,
	getClientIp,
	isCredentialFailure,
	isProviderRateLimit,
} from "@/lib/auth/rateLimit";

export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
	"X-Content-Type-Options": "nosniff",
};

function json(data, init = {}) {
	return NextResponse.json(data, { ...init, headers: { ...RESPONSE_HEADERS, ...(init.headers || {}) } });
}

function createMobileSupabaseClient() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
	if (!url || !publishableKey) throw new Error("Falta configurar Supabase para el cliente móvil");
	return createClient(url, publishableKey, {
		auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
	});
}

export async function POST(request) {
	try {
		if (request.headers.get("origin") && request.headers.get("origin") !== new URL(request.url).origin) {
			return json({ error: "Solicitud no autorizada" }, { status: 403 });
		}
		const contentLength = Number(request.headers.get("content-length"));
		if (Number.isFinite(contentLength) && contentLength > 8192) return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
		if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
			return json({ error: "La solicitud debe enviarse como JSON" }, { status: 415 });
		}
		let payload;
		try {
			const rawBody = await request.text();
			if (rawBody.length > 8192) return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
			payload = JSON.parse(rawBody);
		} catch {
			return json({ error: "El cuerpo de la solicitud no es un JSON válido" }, { status: 400 });
		}
		const validation = validateLoginRequest(payload);
		if (!validation.ok) return json({ error: validation.error }, { status: 400 });

		const admin = createSupabaseAdminClient();
		const rateLimitContext = { action: "login", email: validation.email, ip: getClientIp(request) };
		await consumeAuthRateLimit(admin, rateLimitContext);
		const supabase = createMobileSupabaseClient();
		const { data, error } = await supabase.auth.signInWithPassword({ email: validation.email, password: validation.password });
		if (error) {
			if (isProviderRateLimit(error)) return json({ error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." }, { status: 429 });
			if (isCredentialFailure(error)) {
				try {
					await consumeAuthRateLimit(admin, { ...rateLimitContext, recordFailure: true });
				} catch (rateError) {
					if (rateError instanceof AuthRateLimitExceededError || rateError?.status === 429) return json({ error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." }, { status: 429 });
					throw rateError;
				}
				return json({ error: getSupabaseAuthErrorMessage(error) }, { status: 401 });
			}
			return json({ error: "La autenticación no está disponible en este momento." }, { status: 503 });
		}

		const session = data?.session;
		if (!session?.access_token || !session.refresh_token || !data.user?.id) return json({ error: "La autenticación móvil no devolvió una sesión válida" }, { status: 503 });
		return json({
			version: 1,
			session: {
				accessToken: session.access_token,
				refreshToken: session.refresh_token,
				expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
				user: { id: data.user.id, email: data.user.email || null },
			},
		});
	} catch (error) {
		if (error instanceof AuthRateLimitExceededError || error?.status === 429) return json({ error: "Demasiados intentos. Espera unos minutos antes de volver a intentar." }, { status: 429 });
		console.error("Mobile authentication route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return json({ error: "La autenticación móvil no está disponible en este momento." }, { status: 503 });
	}
}
