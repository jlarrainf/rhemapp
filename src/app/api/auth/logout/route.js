import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
	try {
		const supabase = await createSupabaseServerClient();
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error("Auth logout failed", error.message);
			return NextResponse.json(
				{ error: "No se pudo cerrar sesión" },
				{ status: 503, headers: { "Cache-Control": "no-store" } }
			);
		}

		return NextResponse.json(
			{ ok: true },
			{ headers: { "Cache-Control": "no-store" } }
		);
	} catch (error) {
		console.error("Auth logout configuration failed", error.message);
		return NextResponse.json(
			{ error: "La autenticación no está disponible en este momento" },
			{ status: 503, headers: { "Cache-Control": "no-store" } }
		);
	}
}
