import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProfileView, validateProfileUpdate } from "@/lib/profile/validation";

export const dynamic = "force-dynamic";

const PROFILE_SELECT = "user_id, display_name, avatar_url, locale, timezone";
const PROFILE_HEADERS = {
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
};

function json(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...PROFILE_HEADERS, ...(init.headers || {}) },
	});
}

function profileFailure(error, message) {
	if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
	console.error("Profile route failed", {
		name: error?.name || "UnknownError",
		status: error?.status || 503,
	});
	return json({ error: message }, { status: 503 });
}

async function getProfileRecord(supabase, userId) {
	const { data, error } = await supabase
		.from("profiles")
		.select(PROFILE_SELECT)
		.eq("user_id", userId)
		.maybeSingle();

	if (error || !data) {
		const profileError = new Error("Profile record unavailable");
		profileError.name = error?.name || "ProfileRecordUnavailableError";
		profileError.status = 503;
		throw profileError;
	}

	return data;
}

export async function GET() {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const profile = await getProfileRecord(supabase, session.user.id);

		return json({ version: 1, profile: createProfileView({ sessionUser: session.user, profile }) });
	} catch (error) {
		return profileFailure(error, "No se pudo cargar el perfil");
	}
}

export async function PATCH(request) {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const contentType = request.headers.get("content-type") || "";
		if (!contentType.toLowerCase().includes("application/json")) {
			return json({ error: "El perfil debe enviarse como JSON" }, { status: 415 });
		}

		const contentLength = Number(request.headers.get("content-length"));
		if (Number.isFinite(contentLength) && contentLength > 8192) {
			return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
		}

		let payload;
		try {
			const rawBody = await request.text();
			if (rawBody.length > 8192) return json({ error: "La solicitud es demasiado grande" }, { status: 413 });
			payload = JSON.parse(rawBody);
		} catch {
			return json({ error: "El cuerpo de la solicitud no es un JSON válido" }, { status: 400 });
		}

		const validation = validateProfileUpdate(payload);
		if (!validation.ok) return json({ error: validation.error }, { status: 400 });

		const { data, error } = await supabase
			.from("profiles")
			.update(validation.updates)
			.eq("user_id", session.user.id)
			.select(PROFILE_SELECT)
			.maybeSingle();

		if (error || !data) {
			const profileError = new Error("Profile update unavailable");
			profileError.name = error?.name || "ProfileUpdateUnavailableError";
			profileError.status = 503;
			throw profileError;
		}

		return json({ version: 1, profile: createProfileView({ sessionUser: session.user, profile: data }) });
	} catch (error) {
		return profileFailure(error, "No se pudo actualizar el perfil");
	}
}
