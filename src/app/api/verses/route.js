import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";

// Endpoint interno para servir solo el subconjunto necesario del JSON.
// SEO/Performance: evita descargar `dailyVerses` en /random y habilita caché del navegador.
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const scope = (searchParams.get("scope") || "all").toLowerCase();

		const siteUrl = getSiteUrl();
		const url = new URL("/data/verses.json", siteUrl).toString();

		const upstream = await fetch(url, { cache: "no-store" });
		if (!upstream.ok) {
			return NextResponse.json(
				{ error: "No se pudo cargar el archivo de versículos" },
				{ status: 500 }
			);
		}

		const data = await upstream.json();
		if (!data || !Array.isArray(data.verses)) {
			return NextResponse.json(
				{ error: "El formato del archivo de versículos es incorrecto" },
				{ status: 500 }
			);
		}

		let payload;
		if (scope === "random") {
			payload = { verses: data.verses };
		} else if (scope === "daily") {
			payload = { verses: data.verses, dailyVerses: data.dailyVerses || [] };
		} else {
			payload = data;
		}

		const response = NextResponse.json(payload);
		response.headers.set(
			"Cache-Control",
			"public, max-age=3600, stale-while-revalidate=86400"
		);
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
		return response;
	} catch (e) {
		console.error("Error en /api/verses:", e);
		return NextResponse.json(
			{ error: "Error al procesar la petición" },
			{ status: 500 }
		);
	}
}
