import { requireRole } from "@/lib/auth/roles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPublishedEntry } from "@/lib/editorial/publishedReadings";
import { createLectioRegenerationAuditEntry } from "@/lib/audit/events";
import { generateAndPersistLectioAdaptation } from "@/lib/lectio/service";
import { consumeLectioRegenerationRateLimit } from "@/lib/lectio/rateLimit";
import { parseReadingKey } from "@/lib/lectio/validation";
import { handleLectioError, json, LECTIO_PRIVATE_HEADERS } from "@/lib/lectio/http";
import { hasAllowedOrigin } from "@/lib/suggestions/http";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
	try {
		if (!hasAllowedOrigin(request)) return json({ error: "Solicitud no autorizada" }, { status: 403 }, LECTIO_PRIVATE_HEADERS);
		if (Number(request.headers.get("content-length")) > 0) return json({ error: "La regeneración no acepta prompts ni notas privadas" }, { status: 422 }, LECTIO_PRIVATE_HEADERS);
		const supabase = await createSupabaseServerClient();
		const session = await requireRole(["editor", "admin"], supabase);
		const { readingKey, dateKey } = parseReadingKey((await params).readingKey);
		const limit = consumeLectioRegenerationRateLimit({ actorUserId: session.user.id, readingKey });
		if (!limit.allowed) {
			return json(
				{ error: "Alcanzaste el límite de regeneraciones manuales para esta lectura" },
				{ status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
				LECTIO_PRIVATE_HEADERS,
			);
		}
		const reading = await getCurrentPublishedEntry(dateKey);
		const result = await generateAndPersistLectioAdaptation({
			supabaseAdmin: createSupabaseAdminClient(),
			readingKey,
			reading,
			force: true,
			trigger: "manual",
		});
		const supabaseAdmin = createSupabaseAdminClient();
		await supabaseAdmin.from("audit_logs").insert(createLectioRegenerationAuditEntry({
			actorUserId: session.user.id,
			readingKey,
		}));
		return json({ version: 1, adaptation: result.adaptation, reused: result.reused, attempts: result.attempts }, {}, LECTIO_PRIVATE_HEADERS);
	} catch (error) {
		return handleLectioError(error, "No se pudo regenerar la reflexión de Lectio");
	}
}
