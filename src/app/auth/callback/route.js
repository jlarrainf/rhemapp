import { NextResponse } from "next/server";
import { getSafeNextPath } from "@/lib/auth/oauth";
import { provisionInitialAdmin } from "@/lib/auth/initialAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function redirectToLogin(request, errorCode) {
	const url = new URL("/login", request.url);
	url.searchParams.set("error", errorCode);
	return NextResponse.redirect(url);
}

export async function GET(request) {
	const { searchParams } = new URL(request.url);
	const providerError = searchParams.get("error");
	const code = searchParams.get("code");
	const nextPath = getSafeNextPath(searchParams.get("next"));

	if (providerError === "access_denied") return redirectToLogin(request, "oauth_cancelled");
	if (providerError || !code) return redirectToLogin(request, "oauth_missing_code");

	try {
		const supabase = await createSupabaseServerClient();
		const { data, error } = await supabase.auth.exchangeCodeForSession(code);
		if (error || !data?.session?.user) {
			if (error) console.error("Error al intercambiar el código de autenticación:", error.message);
			return redirectToLogin(request, "oauth_callback");
		}
		try {
			await provisionInitialAdmin({
				userId: data.session.user.id,
				email: data.session.user.email,
			});
		} catch (provisionError) {
			console.error("Initial admin provisioning failed", {
				name: provisionError?.name || "UnknownError",
				status: provisionError?.status || 503,
			});
		}

		return NextResponse.redirect(new URL(nextPath, request.url));
	} catch (error) {
		console.error("Error al completar el callback de autenticación:", error);
		return redirectToLogin(request, "auth_configuration");
	}
}
