import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeSuggestionRateLimit, getSuggestionRequestIp } from "@/lib/suggestions/rateLimit";
import { createSuggestion, listOwnSuggestions } from "@/lib/suggestions/service";
import { handleSuggestionError, hasAllowedOrigin, json, readJson } from "@/lib/suggestions/http";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		return json({ version: 1, suggestions: await listOwnSuggestions(supabase, session.user.id) });
	} catch (error) {
		return handleSuggestionError(error, "No se pudieron cargar tus sugerencias");
	}
}

export async function POST(request) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		consumeSuggestionRateLimit({ userId: session.user.id, ip: getSuggestionRequestIp(request.headers) });
		const payload = await readJson(request);
		const result = await createSuggestion({ supabase, userId: session.user.id, payload });
		return json({ version: 1, suggestion: result.suggestion }, { status: 201 });
	} catch (error) {
		return handleSuggestionError(error, "No se pudo guardar la sugerencia");
	}
}
