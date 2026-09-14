import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleSuggestionError, hasAllowedOrigin, json } from "@/lib/suggestions/http";
import { deleteSuggestion } from "@/lib/suggestions/service";

export const dynamic = "force-dynamic";

export async function DELETE(request, { params }) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });
		const supabase = await createSupabaseServerClient();
		const session = await requireRole("admin", supabase);
		const { id } = await params;
		return json({ version: 1, ...(await deleteSuggestion({
			supabaseAdmin: createSupabaseAdminClient(),
			suggestionId: id,
			actorUserId: session.user.id,
		})) });
	} catch (error) {
		return handleSuggestionError(error, "No se pudo eliminar la sugerencia");
	}
}
