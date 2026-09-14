import { buildFallbackAdaptation, buildFallbackQuestions } from "./fallback.js";
import { extractReadingAnchors, buildVerifiedReadingContext } from "./anchors.js";
import {
	LECTIO_GENERATION_MAX_ATTEMPTS,
	LECTIO_GUIDE_VERSION,
	LECTIO_PENDING_STALE_MS,
	LECTIO_PROMPT_VERSION,
	LECTIO_SCHEMA_VERSION,
	LECTIO_STATES,
} from "./constants.js";
import { buildLectioPrompt } from "./prompt.js";
import { validateFallbackQuestions, validateGeneratedLectioOutput } from "./validators.js";
import { parseReadingKey } from "./validation.js";
import { getLectioAIConfig } from "../ai/config.js";
import { OpenRouterProviderError, requestOpenRouterCompletion } from "../ai/openrouter.js";
import { validatePublishedEntry } from "../readings/validatePublishedEntry.js";

const ADAPTATION_FIELDS = [
	"id",
	"reading_key",
	"prompt_version",
	"schema_version",
	"guide_version",
	"anchors_json",
	"questions_json",
	"state",
	"generated",
	"validation_json",
	"rejection_reasons",
	"metrics_json",
	"attempt_count",
	"last_error_code",
	"created_at",
	"updated_at",
	"published_at",
].join(", ");

const LOG_FIELDS = [
	"id",
	"adaptation_id",
	"reading_key",
	"prompt_version",
	"schema_version",
	"guide_version",
	"anchor_ids",
	"attempt",
	"provider",
	"model",
	"status",
	"error_code",
	"rejection_reasons",
	"metrics_json",
	"latency_ms",
	"input_tokens",
	"output_tokens",
	"total_tokens",
	"estimated_cost_usd",
	"created_at",
].join(", ");

export class LectioPersistenceError extends Error {
	constructor(message) {
		super(message);
		this.name = "LectioPersistenceError";
		this.status = 503;
	}
}

export class LectioGenerationInputError extends Error {
	constructor(message, errors = []) {
		super(message);
		this.name = "LectioGenerationInputError";
		this.errors = errors;
		this.status = 422;
	}
}

function assertResult(result, message) {
	if (result?.error) {
		const error = new LectioPersistenceError(message);
		error.cause = { code: result.error.code, message: result.error.message };
		throw error;
	}
	return result.data;
}

function mapAdaptation(row) {
	return {
		id: row?.id || null,
		readingKey: row?.reading_key,
		generated: row?.state === LECTIO_STATES.PUBLISHED && row?.generated === true,
		status: row?.state || LECTIO_STATES.FALLBACK,
		promptVersion: row?.prompt_version || LECTIO_PROMPT_VERSION,
		schemaVersion: row?.schema_version || LECTIO_SCHEMA_VERSION,
		guideVersion: row?.guide_version || LECTIO_GUIDE_VERSION,
		anchors: Array.isArray(row?.anchors_json) ? row.anchors_json : [],
		questions: Array.isArray(row?.questions_json) ? row.questions_json : [],
		validation: row?.validation_json && typeof row.validation_json === "object" ? row.validation_json : { valid: false, status: "fallback" },
		metrics: row?.metrics_json && typeof row.metrics_json === "object" ? row.metrics_json : {},
		attemptCount: Number.isInteger(row?.attempt_count) ? row.attempt_count : 0,
	};
}

function getPublicAdaptation(adaptation) {
	return {
		version: 1,
		readingKey: adaptation.readingKey,
		generated: adaptation.generated,
		status: adaptation.status,
		promptVersion: adaptation.promptVersion,
		schemaVersion: adaptation.schemaVersion,
		anchors: adaptation.anchors,
		questions: adaptation.questions,
		validation: {
			valid: adaptation.generated,
			status: adaptation.status,
		},
	};
}

function normalizeReasons(reasons) {
	return [...new Set((Array.isArray(reasons) ? reasons : [reasons]).filter((reason) => typeof reason === "string" && reason.trim()))]
		.map((reason) => reason.slice(0, 300))
		.slice(0, 20);
}

function getErrorCode(error) {
	return typeof error?.code === "string" ? error.code.slice(0, 80) : "generation_error";
}

function getProviderMetric(result) {
	return {
		provider: result?.provider || "openrouter",
		model: result?.model || null,
		latencyMs: Number.isFinite(result?.latencyMs) ? result.latencyMs : null,
		inputTokens: result?.usage?.inputTokens ?? null,
		outputTokens: result?.usage?.outputTokens ?? null,
		totalTokens: result?.usage?.totalTokens ?? null,
		estimatedCostUsd: Number.isFinite(result?.estimatedCostUsd) ? result.estimatedCostUsd : null,
	};
}

async function getAdaptation(supabaseAdmin, readingKey) {
	const result = await supabaseAdmin
		.from("lectio_adaptations")
		.select(ADAPTATION_FIELDS)
		.eq("reading_key", readingKey)
		.eq("prompt_version", LECTIO_PROMPT_VERSION)
		.maybeSingle();
	return assertResult(result, "No se pudo consultar la adaptación de Lectio");
}

async function insertOrGetAdaptation({ supabaseAdmin, readingKey, anchors, force }) {
	let existing = await getAdaptation(supabaseAdmin, readingKey);
	if (existing && !force) return { row: existing, reused: true };

	const fallbackQuestions = buildFallbackQuestions(anchors);
	const pendingValues = {
		reading_key: readingKey,
		prompt_version: LECTIO_PROMPT_VERSION,
		schema_version: LECTIO_SCHEMA_VERSION,
		guide_version: LECTIO_GUIDE_VERSION,
		anchors_json: anchors,
		questions_json: fallbackQuestions,
		state: LECTIO_STATES.PENDING,
		generated: false,
		validation_json: { valid: false, status: LECTIO_STATES.PENDING },
		rejection_reasons: [],
		metrics_json: {},
		attempt_count: 0,
		last_error_code: null,
		published_at: null,
	};

	if (existing) {
		const updated = await supabaseAdmin
			.from("lectio_adaptations")
			.update(pendingValues)
			.eq("id", existing.id)
			.select(ADAPTATION_FIELDS)
			.single();
		return { row: assertResult(updated, "No se pudo preparar la regeneración de Lectio"), reused: false };
	}

	const inserted = await supabaseAdmin
		.from("lectio_adaptations")
		.insert(pendingValues)
		.select(ADAPTATION_FIELDS)
		.single();
	if (!inserted?.error) return { row: inserted.data, reused: false };
	if (inserted.error.code !== "23505") throw new LectioPersistenceError("No se pudo reservar la adaptación de Lectio");
	existing = await getAdaptation(supabaseAdmin, readingKey);
	if (!existing) throw new LectioPersistenceError("No se pudo recuperar la adaptación reservada");
	return { row: existing, reused: true };
}

async function updateAdaptation(supabaseAdmin, id, patch) {
	const result = await supabaseAdmin
		.from("lectio_adaptations")
		.update(patch)
		.eq("id", id)
		.select(ADAPTATION_FIELDS)
		.single();
	return assertResult(result, "No se pudo guardar la adaptación de Lectio");
}

async function insertGenerationLog(supabaseAdmin, values) {
	try {
		const result = await supabaseAdmin.from("ai_generation_logs").insert(values).select(LOG_FIELDS).single();
		if (result?.error) {
			console.error("No se pudo guardar el registro técnico de Lectio", { code: result.error.code, message: result.error.message });
		}
	} catch (error) {
		console.error("No se pudo guardar el registro técnico de Lectio", { name: error?.name || "UnknownError" });
	}
}

async function persistFallback({ supabaseAdmin, adaptation, anchors, reasons, attemptCount, lastErrorCode }) {
	const questions = buildFallbackQuestions(anchors);
	const validation = validateFallbackQuestions(questions, { anchors });
	const row = await updateAdaptation(supabaseAdmin, adaptation.id, {
		anchors_json: anchors,
		questions_json: questions,
		state: LECTIO_STATES.FALLBACK,
		generated: false,
		validation_json: { valid: false, status: LECTIO_STATES.FALLBACK, reasons: normalizeReasons(reasons) },
		rejection_reasons: normalizeReasons(reasons),
		metrics_json: validation.metrics,
		attempt_count: attemptCount,
		last_error_code: lastErrorCode || null,
		published_at: null,
	});
	return { row, questions };
}

function defaultSleep(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isStalePending(row, now) {
	if (row?.state !== LECTIO_STATES.PENDING || !row.updated_at) return false;
	const updatedAt = Date.parse(row.updated_at);
	const nowValue = now instanceof Date ? now.getTime() : Date.parse(now);
	return Number.isFinite(updatedAt) && Number.isFinite(nowValue) && nowValue - updatedAt >= LECTIO_PENDING_STALE_MS;
}

export async function getPersistedLectioAdaptation({ supabaseAdmin, readingKey }) {
	const parsed = parseReadingKey(readingKey);
	const row = await getAdaptation(supabaseAdmin, parsed.readingKey);
	return row ? mapAdaptation(row) : null;
}

export function buildFallbackForReading({ readingKey, reading }) {
	const anchors = extractReadingAnchors(reading);
	return buildFallbackAdaptation({
		readingKey,
		anchors,
		promptVersion: LECTIO_PROMPT_VERSION,
		schemaVersion: LECTIO_SCHEMA_VERSION,
		reason: "adaptation_unavailable",
	});
}

export async function generateAndPersistLectioAdaptation({
	supabaseAdmin,
	readingKey,
	reading,
	force = false,
	provider = requestOpenRouterCompletion,
	env = process.env,
	sleep = defaultSleep,
	now = new Date(),
	trigger = "publication",
} = {}) {
	const parsed = parseReadingKey(readingKey);
	const validation = validatePublishedEntry(reading, { allowLegacy: false });
	if (!validation.valid || reading?.date !== parsed.dateKey) {
		throw new LectioGenerationInputError("La lectura debe estar publicada, verificada y usar la fecha solicitada", validation.errors);
	}

	const anchors = extractReadingAnchors(reading);
	const context = buildVerifiedReadingContext(reading);
	const prompt = buildLectioPrompt({ reading: context, anchors });
	const config = getLectioAIConfig(env);
	const current = await getAdaptation(supabaseAdmin, parsed.readingKey);
	const retryStalePending = !force && isStalePending(current, now);
	const shouldForce = force || retryStalePending;
	if (current && !shouldForce) return { adaptation: getPublicAdaptation(mapAdaptation(current)), reused: true, attempts: current.attempt_count || 0 };

	const reserved = await insertOrGetAdaptation({ supabaseAdmin, readingKey: parsed.readingKey, anchors, force: shouldForce });
	if (reserved.reused && !shouldForce) return { adaptation: getPublicAdaptation(mapAdaptation(reserved.row)), reused: true, attempts: reserved.row.attempt_count || 0 };

	if (!config.enabled || !config.apiKey) {
		await insertGenerationLog(supabaseAdmin, {
			adaptation_id: reserved.row.id,
			reading_key: parsed.readingKey,
			prompt_version: LECTIO_PROMPT_VERSION,
			schema_version: LECTIO_SCHEMA_VERSION,
			guide_version: LECTIO_GUIDE_VERSION,
			anchor_ids: anchors.map((anchor) => anchor.id),
			attempt: 0,
			provider: "openrouter",
			model: config.model,
			status: "disabled",
			error_code: config.enabled ? "provider_not_configured" : "generation_disabled",
			rejection_reasons: [],
			metrics_json: {},
			latency_ms: null,
			input_tokens: null,
			output_tokens: null,
			total_tokens: null,
			estimated_cost_usd: 0,
		});
		const fallback = await persistFallback({
			supabaseAdmin,
			adaptation: reserved.row,
			anchors,
			reasons: [config.enabled ? "provider_not_configured" : "generation_disabled"],
			attemptCount: 0,
			lastErrorCode: config.enabled ? "provider_not_configured" : "generation_disabled",
		});
		return { adaptation: getPublicAdaptation(mapAdaptation(fallback.row)), reused: false, attempts: 0 };
	}

	let lastReasons = [];
	let lastErrorCode = null;
	for (let attempt = 1; attempt <= LECTIO_GENERATION_MAX_ATTEMPTS; attempt += 1) {
		let providerResult = null;
		try {
			providerResult = await provider({ prompt, env });
			const outputValidation = validateGeneratedLectioOutput(providerResult?.rawText ?? providerResult, { anchors });
			const metric = { ...getProviderMetric(providerResult), ...outputValidation.metrics };
			if (outputValidation.valid) {
				const published = await updateAdaptation(supabaseAdmin, reserved.row.id, {
					anchors_json: anchors,
					questions_json: outputValidation.normalized,
					state: LECTIO_STATES.PUBLISHED,
					generated: true,
					validation_json: { valid: true, status: LECTIO_STATES.PUBLISHED, reasons: [] },
					rejection_reasons: [],
					metrics_json: metric,
					attempt_count: attempt,
					last_error_code: null,
					published_at: now.toISOString(),
				});
				await insertGenerationLog(supabaseAdmin, {
					adaptation_id: reserved.row.id,
					reading_key: parsed.readingKey,
					prompt_version: LECTIO_PROMPT_VERSION,
					schema_version: LECTIO_SCHEMA_VERSION,
					guide_version: LECTIO_GUIDE_VERSION,
					anchor_ids: anchors.map((anchor) => anchor.id),
					attempt,
					provider: providerResult?.provider || "openrouter",
					model: providerResult?.model || config.model,
					status: "published",
					error_code: null,
					rejection_reasons: [],
					metrics_json: metric,
					latency_ms: metric.latencyMs,
					input_tokens: metric.inputTokens,
					output_tokens: metric.outputTokens,
					total_tokens: metric.totalTokens,
					estimated_cost_usd: metric.estimatedCostUsd,
				});
				return { adaptation: getPublicAdaptation(mapAdaptation(published)), reused: false, attempts: attempt };
			}

			lastReasons = normalizeReasons(outputValidation.errors);
			lastErrorCode = "validation_rejected";
			await insertGenerationLog(supabaseAdmin, {
				adaptation_id: reserved.row.id,
				reading_key: parsed.readingKey,
				prompt_version: LECTIO_PROMPT_VERSION,
				schema_version: LECTIO_SCHEMA_VERSION,
				guide_version: LECTIO_GUIDE_VERSION,
				anchor_ids: anchors.map((anchor) => anchor.id),
				attempt,
				provider: providerResult?.provider || "openrouter",
				model: providerResult?.model || config.model,
				status: "validation_rejected",
				error_code: lastErrorCode,
				rejection_reasons: lastReasons,
				metrics_json: { ...getProviderMetric(providerResult), ...outputValidation.metrics },
				latency_ms: providerResult?.latencyMs ?? null,
				input_tokens: providerResult?.usage?.inputTokens ?? null,
				output_tokens: providerResult?.usage?.outputTokens ?? null,
				total_tokens: providerResult?.usage?.totalTokens ?? null,
				estimated_cost_usd: providerResult?.estimatedCostUsd ?? 0,
			});
		} catch (error) {
			lastReasons = normalizeReasons(error instanceof OpenRouterProviderError ? [error.code] : ["provider_error"]);
			lastErrorCode = getErrorCode(error);
			await insertGenerationLog(supabaseAdmin, {
				adaptation_id: reserved.row.id,
				reading_key: parsed.readingKey,
				prompt_version: LECTIO_PROMPT_VERSION,
				schema_version: LECTIO_SCHEMA_VERSION,
				guide_version: LECTIO_GUIDE_VERSION,
				anchor_ids: anchors.map((anchor) => anchor.id),
				attempt,
				provider: "openrouter",
				model: config.model,
				status: "provider_error",
				error_code: lastErrorCode,
				rejection_reasons: lastReasons,
				metrics_json: {},
				latency_ms: error?.latencyMs ?? null,
				input_tokens: error?.usage?.inputTokens ?? null,
				output_tokens: error?.usage?.outputTokens ?? null,
				total_tokens: error?.usage?.totalTokens ?? null,
				estimated_cost_usd: 0,
			});
			if (error?.retryable === false) break;
		}

		if (attempt < LECTIO_GENERATION_MAX_ATTEMPTS) await sleep(config.retryBackoffMs * attempt);
	}

	const fallback = await persistFallback({
		supabaseAdmin,
		adaptation: reserved.row,
		anchors,
		reasons: lastReasons,
		attemptCount: LECTIO_GENERATION_MAX_ATTEMPTS,
		lastErrorCode,
	});
	await insertGenerationLog(supabaseAdmin, {
		adaptation_id: reserved.row.id,
		reading_key: parsed.readingKey,
		prompt_version: LECTIO_PROMPT_VERSION,
		schema_version: LECTIO_SCHEMA_VERSION,
		guide_version: LECTIO_GUIDE_VERSION,
		anchor_ids: anchors.map((anchor) => anchor.id),
		attempt: LECTIO_GENERATION_MAX_ATTEMPTS,
		provider: "openrouter",
		model: config.model,
		status: "fallback",
		error_code: lastErrorCode,
		rejection_reasons: lastReasons,
		metrics_json: { trigger },
		latency_ms: null,
		input_tokens: null,
		output_tokens: null,
		total_tokens: null,
		estimated_cost_usd: 0,
	});
	return { adaptation: getPublicAdaptation(mapAdaptation(fallback.row)), reused: false, attempts: LECTIO_GENERATION_MAX_ATTEMPTS };
}

export { ADAPTATION_FIELDS, LOG_FIELDS, getPublicAdaptation, mapAdaptation };
