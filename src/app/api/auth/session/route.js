import { NextResponse } from "next/server";
import { resolveAuthSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const session = await resolveAuthSession();
		const response = NextResponse.json(session);
		response.headers.set("Cache-Control", "no-store, max-age=0");
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
		return response;
	} catch (error) {
		if (error?.status !== 503) console.error("Error al resolver la sesión:", error);
		return NextResponse.json(
			{ error: "No se pudo comprobar la sesión" },
			{ status: 503, headers: { "Cache-Control": "no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow" } },
		);
	}
}
