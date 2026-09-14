import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { handleSuggestionError, hasAllowedOrigin, json } from "@/lib/suggestions/http";
import { rollbackPublishedVersion } from "@/lib/suggestions/service";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 });
		const supabase = await createSupabaseServerClient();
		const session = await requireRole(["editor", "admin"], supabase);
		const { id } = await params;
		const result = await rollbackPublishedVersion({
			supabaseAdmin: createSupabaseAdminClient(),
			versionId: id,
			actorUserId: session.user.id,
		});
		return json({ version: 1, publishedVersion: result.version, restoredFrom: result.restoredFrom });
	} catch (error) {
		return handleSuggestionError(error, "No se pudo revertir la versión publicada");
	}
}
