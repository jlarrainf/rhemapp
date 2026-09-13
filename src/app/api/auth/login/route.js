import { NextResponse } from "next/server";
import { validateLoginRequest } from "@/lib/auth/credentials";
import { AUTH_UI_MESSAGES, getSupabaseAuthErrorMessage } from "@/lib/auth/messages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
};

function json(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...RESPONSE_HEADERS, ...(init.headers || {}) },
	});
}

function hasAllowedOrigin(request) {
	const origin = request.headers.get("origin");
	return !origin || origin === new URL(request.url).origin;
}

function isTooLarge(request) {
	const contentLength = Number(request.headers.get("content-length"));
	return Number.isFinite(contentLength) && contentLength > 8192;
}

function rateLimitResponse() {
	return json({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
}

export async function POST(request) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });
		if (isTooLarge(request)) return json({ error: "La solicitud es demasiado grande" }, { status: 413 });

		const contentType = request.headers.get("content-type") || "";
		if (!contentType.toLowerCase().includes("application/json")) {
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

		const supabaseAdmin = createSupabaseAdminClient();
		const rateLimitContext = { action: "login", email: validation.email, ip: getClientIp(request) };
		await consumeAuthRateLimit(supabaseAdmin, rateLimitContext);

		const supabase = await createSupabaseServerClient();
		const { error } = await supabase.auth.signInWithPassword({
			email: validation.email,
			password: validation.password,
		});

		if (error) {
			if (isProviderRateLimit(error)) return rateLimitResponse();
			if (isCredentialFailure(error)) {
				try {
					await consumeAuthRateLimit(supabaseAdmin, { ...rateLimitContext, recordFailure: true });
				} catch (rateError) {
					if (rateError instanceof AuthRateLimitExceededError || rateError?.status === 429) return rateLimitResponse();
					throw rateError;
				}
				return json({ error: getSupabaseAuthErrorMessage(error) }, { status: 401 });
			}

			console.error("Password login failed", {
				name: error?.name || "UnknownError",
				status: error?.status || 503,
			});
			return json({ error: "No se pudo iniciar sesión. Inténtalo nuevamente." }, { status: 503 });
		}

		return json({ ok: true });
	} catch (error) {
		if (error instanceof AuthRateLimitExceededError || error?.status === 429) return rateLimitResponse();
		console.error("Password login route failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
		return json({ error: "La autenticación no está disponible en este momento." }, { status: 503 });
	}
}
