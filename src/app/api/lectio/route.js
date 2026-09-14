import { NextResponse } from "next/server";
import { getCurrentPublishedEntry } from "@/lib/editorial/publishedReadings";
import { extractReadingAnchors } from "@/lib/lectio/anchors";
import { buildFallbackForReading, getPersistedLectioAdaptation } from "@/lib/lectio/service";
import { parseReadingKey } from "@/lib/lectio/validation";
import { validateFallbackQuestions, validateLectioQuestions } from "@/lib/lectio/validators";
import { LectioValidationError } from "@/lib/lectio/validation";

export const dynamic = "force-dynamic";

const PUBLIC_HEADERS = {
	"Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
	"X-Content-Type-Options": "nosniff",
};

function publicJson(data, init = {}) {
	return NextResponse.json(data, { ...init, headers: { ...PUBLIC_HEADERS, ...(init.headers || {}) } });
}

function rejectUnexpectedParameters(searchParams) {
	const keys = [...new Set([...searchParams.keys()])];
	if (keys.some((key) => key !== "readingKey")) {
		throw new LectioValidationError("Lectio divina no acepta prompts, notas ni parámetros adicionales");
	}
	const values = searchParams.getAll("readingKey");
	if (values.length !== 1) throw new LectioValidationError("Indica una única clave de lectura");
	return values[0];
}

export async function GET(request) {
	try {
		const { readingKey, dateKey } = parseReadingKey(rejectUnexpectedParameters(request.nextUrl.searchParams));
		const reading = await getCurrentPublishedEntry(dateKey);
		const anchors = extractReadingAnchors(reading);
		let adaptation = null;
		try {
			adaptation = await getPersistedLectioAdaptation({
				supabaseAdmin: (await import("@/lib/supabase/admin")).createSupabaseAdminClient(),
				readingKey,
			});
		} catch (error) {
			if (error?.message !== "Falta configurar el cliente administrativo de Supabase") {
				console.error("No se pudo leer la adaptación persistida de Lectio", { name: error?.name || "UnknownError" });
			}
		}

		if (adaptation) {
			const validation = adaptation.generated
				? validateLectioQuestions(adaptation.questions, { anchors })
				: validateFallbackQuestions(adaptation.questions, { anchors });
			if (validation.valid) {
				return publicJson({
					version: 1,
					readingKey,
					generated: adaptation.generated,
					status: adaptation.status,
					promptVersion: adaptation.promptVersion,
					schemaVersion: adaptation.schemaVersion,
					anchors: adaptation.anchors,
					questions: adaptation.questions,
					validation: { valid: adaptation.generated, status: adaptation.status },
				});
			}
		}

		return publicJson(buildFallbackForReading({ readingKey, reading }));
	} catch (error) {
		if (error?.status === 404) return publicJson({ error: error.message }, { status: 404 });
		if (error instanceof LectioValidationError || error?.status === 422) return publicJson({ error: error.message, errors: error.errors }, { status: 422 });
		console.error("Lectio public route failed", { name: error?.name || "UnknownError", status: error?.status || 503 });
		return publicJson({ error: "No se pudo cargar la reflexión asistida" }, { status: 503 });
	}
}
