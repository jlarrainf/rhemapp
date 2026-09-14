import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { validateMobileRefresh } from "@/lib/mobile/validation";

export const dynamic = "force-dynamic";

const HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
	"X-Content-Type-Options": "nosniff",
};

function json(data, init = {}) {
	return NextResponse.json(data, { ...init, headers: { ...HEADERS, ...(init.headers || {}) } });
}

export async function POST(request) {
	try {
		if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) return json({ error: "La solicitud debe enviarse como JSON" }, { status: 415 });
		const rawBody = await request.text();
		if (rawBody.length > 8192) return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
		let payload;
		try {
			payload = JSON.parse(rawBody);
		} catch {
			return json({ error: "El cuerpo de la solicitud no es un JSON válido" }, { status: 400 });
		}
		const validation = validateMobileRefresh(payload);
		if (!validation.ok) return json({ error: validation.error }, { status: 400 });
		const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
		const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
		if (!url || !publishableKey) return json({ error: "La autenticación móvil no está configurada" }, { status: 503 });
		const supabase = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
		const { data, error } = await supabase.auth.refreshSession({ refresh_token: validation.refreshToken });
		if (error || !data?.session?.access_token || !data.session.refresh_token) return json({ error: "La sesión móvil ya no es válida" }, { status: 401 });
		return json({
			version: 1,
			session: {
				accessToken: data.session.access_token,
				refreshToken: data.session.refresh_token,
				expiresAt: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
			},
		});
	} catch (error) {
		console.error("Mobile session refresh failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return json({ error: "No se pudo renovar la sesión móvil" }, { status: 503 });
	}
}
