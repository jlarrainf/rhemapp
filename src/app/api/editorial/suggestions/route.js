import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleSuggestionError, json } from "@/lib/suggestions/http";
import { listEditorialSuggestions } from "@/lib/suggestions/service";

export const dynamic = "force-dynamic";

export async function GET(request) {
	try {
		const supabase = await createSupabaseServerClient();
		await requireRole(["editor", "admin"], supabase);
		const status = new URL(request.url).searchParams.get("status") || null;
		const suggestions = await listEditorialSuggestions({
			supabaseAdmin: createSupabaseAdminClient(),
			status,
		});
		return json({ version: 1, suggestions });
	} catch (error) {
		return handleSuggestionError(error, "No se pudo cargar la cola editorial");
	}
}
