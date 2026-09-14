import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleSuggestionError, hasAllowedOrigin, json, readJson } from "@/lib/suggestions/http";
import { publishSuggestion } from "@/lib/suggestions/service";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });
		const supabase = await createSupabaseServerClient();
		const session = await requireRole(["editor", "admin"], supabase);
		const { id } = await params;
		const payload = await readJson(request, 65536);
		const result = await publishSuggestion({
			supabaseAdmin: createSupabaseAdminClient(),
			suggestionId: id,
			actorUserId: session.user.id,
			payload: payload?.payload,
		});
		return json({ version: 1, suggestion: result.suggestion, publishedVersion: result.version, event: result.event });
	} catch (error) {
		return handleSuggestionError(error, "No se pudo publicar la sugerencia");
	}
}
