import { NextResponse } from "next/server";
import { createAuthErrorResponse } from "@/lib/auth/http";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { provisionInitialAdmin } from "@/lib/auth/initialAdmin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		await provisionInitialAdmin({ userId: session.user.id, email: session.user.email });
		return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
	} catch (error) {
		if (error?.status === 401 || error?.status === 403) return createAuthErrorResponse(error);
		console.error("Initial admin provisioning failed", {
			name: error?.name || "UnknownError",
			status: error?.status || 503,
		});
		return NextResponse.json(
			{ error: "No se pudo comprobar la configuración administrativa" },
			{ status: 503, headers: { "Cache-Control": "no-store" } },
		);
	}
}
