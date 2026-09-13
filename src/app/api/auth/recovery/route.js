import { NextResponse } from "next/server";
import {
	RECOVERY_GENERIC_MESSAGE,
	createPasswordRecoveryRedirectTo,
	validateRecoveryRequest,
} from "@/lib/auth/recovery";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTH_UI_MESSAGES } from "@/lib/auth/messages";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AuthRateLimitExceededError, consumeAuthRateLimit, getClientIp } from "@/lib/auth/rateLimit";

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

export async function POST(request) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });

		const contentType = request.headers.get("content-type") || "";
		if (!contentType.toLowerCase().includes("application/json")) {
			return json({ error: "La solicitud debe enviarse como JSON" }, { status: 415 });
		}

		const contentLength = Number(request.headers.get("content-length"));
		if (Number.isFinite(contentLength) && contentLength > 4096) {
			return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
		}

		let payload;
		try {
			const rawBody = await request.text();
			if (rawBody.length > 4096) return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
			payload = JSON.parse(rawBody);
		} catch {
			return json({ error: "El cuerpo de la solicitud no es un JSON válido" }, { status: 400 });
		}

		const validation = validateRecoveryRequest(payload);
		if (!validation.ok) return json({ error: validation.error }, { status: 400 });

		const supabaseAdmin = createSupabaseAdminClient();
		try {
			await consumeAuthRateLimit(supabaseAdmin, {
				action: "recovery",
				email: validation.email,
				ip: getClientIp(request),
				recordFailure: true,
			});
		} catch (rateError) {
			if (rateError instanceof AuthRateLimitExceededError || rateError?.status === 429) {
				return json({ error: AUTH_UI_MESSAGES.rateLimited }, { status: 429 });
			}
			throw rateError;
		}

		const supabase = await createSupabaseServerClient();
		const { error } = await supabase.auth.resetPasswordForEmail(validation.email, {
			redirectTo: createPasswordRecoveryRedirectTo(new URL(request.url).origin),
		});
		if (error) throw error;

		return json({ ok: true, message: RECOVERY_GENERIC_MESSAGE });
	} catch (error) {
		console.error("Password recovery failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
		return json(
			{ error: "No se pudo procesar la solicitud. Inténtalo nuevamente." },
			{ status: 503 },
		);
	}
}
