import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/siteUrl";
import { ShareRateLimitError, consumeShareRateLimit, getRequestIp } from "@/lib/sharing/rateLimit";
import { createPrivateShare, SharePersistenceError } from "@/lib/sharing/service";
import { ShareNotFoundError, ShareValidationError } from "@/lib/sharing/validation";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
};

function json(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...PRIVATE_HEADERS, ...(init.headers || {}) },
	});
}

function hasAllowedOrigin(request) {
	const origin = request.headers.get("origin");
	return !origin || origin === new URL(request.url).origin;
}

async function readJson(request) {
	const contentType = request.headers.get("content-type") || "";
	if (!contentType.toLowerCase().includes("application/json")) {
		throw new ShareValidationError("La solicitud debe enviarse como JSON");
	}
	const contentLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(contentLength) && contentLength > 4096) {
		throw new ShareValidationError("La solicitud es demasiado grande");
	}
	try {
		const body = await request.text();
		if (body.length > 4096) throw new Error("body-too-large");
		return JSON.parse(body);
	} catch {
		throw new ShareValidationError("El cuerpo de la solicitud no es un JSON válido");
	}
}

function failure(error) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	if (error instanceof ShareValidationError) return json({ error: error.message }, { status: 422 });
	if (error instanceof ShareNotFoundError) return json({ error: error.message }, { status: 404 });
	if (error instanceof ShareRateLimitError) {
		return json(
			{ error: "Se alcanzó el límite temporal. Inténtalo más tarde." },
			{ status: 429, headers: { "Retry-After": String(error.retryAfterSeconds || 60) } },
		);
	}
	if (!(error instanceof SharePersistenceError)) {
		console.error("Share creation route failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
	}
	return json({ error: "No se pudo crear el enlace compartido" }, { status: 503 });
}

export async function POST(request) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		consumeShareRateLimit({ action: "create", ip: getRequestIp(request.headers) });
		const payload = await readJson(request);
		const result = await createPrivateShare({
			supabase,
			ownerUserId: session.user.id,
			payload,
			siteUrl: getSiteUrl(),
		});
		return json({ version: 1, share: result.share }, { status: 201 });
	} catch (error) {
		return failure(error);
	}
}
