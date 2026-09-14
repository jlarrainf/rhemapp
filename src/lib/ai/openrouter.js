import { getLectioAIConfig } from "./config.js";

export class OpenRouterProviderError extends Error {
	constructor(message, { code = "provider_error", status = 503, retryable = true, latencyMs = null, usage = null, requestId = null } = {}) {
		super(message);
		this.name = "OpenRouterProviderError";
		this.code = code;
		this.status = status;
		this.retryable = retryable;
		this.latencyMs = latencyMs;
		this.usage = usage;
		this.requestId = requestId;
	}
}

function getContent(data) {
	const content = data?.choices?.[0]?.message?.content;
	if (typeof content === "string") return content;
	if (Array.isArray(content)) return content.map((part) => part?.text || "").join("");
	return "";
}

export async function requestOpenRouterCompletion({ prompt, fetchImpl = fetch, env = process.env } = {}) {
	const config = getLectioAIConfig(env);
	if (!config.enabled) throw new OpenRouterProviderError("La generación automática está deshabilitada", { code: "generation_disabled", retryable: false, status: 503 });
	if (!config.apiKey) throw new OpenRouterProviderError("Falta configurar el proveedor de IA", { code: "provider_not_configured", retryable: false, status: 503 });

	const startedAt = Date.now();
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
	try {
		const response = await fetchImpl(config.apiUrl, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${config.apiKey}`,
				...(env.SITE_URL ? { "HTTP-Referer": env.SITE_URL } : {}),
				"X-Title": "Rhemapp Lectio divina",
			},
			body: JSON.stringify({
				model: config.model,
				messages: [
					{ role: "system", content: prompt.system },
					{ role: "user", content: prompt.user },
				],
				temperature: 0.2,
				top_p: 0.8,
				max_tokens: config.maxTokens,
				seed: 42,
				stream: false,
			}),
			signal: controller.signal,
		});
		const latencyMs = Date.now() - startedAt;
		if (!response.ok) {
			const retryable = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
			throw new OpenRouterProviderError("El proveedor de IA no respondió correctamente", {
				code: response.status === 429 ? "provider_rate_limited" : "provider_http_error",
				status: response.status,
				retryable,
				latencyMs,
				requestId: response.headers?.get?.("x-request-id") || null,
			});
		}
		let data;
		try {
			data = await response.json();
		} catch {
			throw new OpenRouterProviderError("El proveedor devolvió una respuesta ilegible", { code: "provider_invalid_json", latencyMs });
		}
		if (data?.error) {
			const providerStatus = Number(data.error.code);
			const status = Number.isInteger(providerStatus) && providerStatus >= 400 && providerStatus <= 599 ? providerStatus : 503;
			throw new OpenRouterProviderError("OpenRouter no pudo completar la solicitud", {
				code: status === 429 ? "provider_rate_limited" : "provider_error_response",
				status,
				retryable: status === 408 || status === 425 || status === 429 || status >= 500,
				latencyMs,
			});
		}
		const content = getContent(data);
		if (!content) throw new OpenRouterProviderError("El proveedor no devolvió contenido", { code: "provider_empty_response", latencyMs });
		return {
			rawText: content,
			provider: "openrouter",
			model: config.model,
			latencyMs,
			requestId: data?.id || response.headers?.get?.("x-request-id") || null,
			usage: {
				inputTokens: data?.usage?.prompt_tokens ?? data?.usage?.input_tokens ?? null,
				outputTokens: data?.usage?.completion_tokens ?? data?.usage?.output_tokens ?? null,
				totalTokens: data?.usage?.total_tokens ?? null,
			},
			estimatedCostUsd: 0,
		};
	} catch (error) {
		if (error instanceof OpenRouterProviderError) throw error;
		const latencyMs = Date.now() - startedAt;
		if (error?.name === "AbortError") {
			throw new OpenRouterProviderError("El proveedor de IA superó el tiempo de espera", { code: "provider_timeout", status: 504, latencyMs, retryable: true });
		}
		throw new OpenRouterProviderError("No se pudo contactar al proveedor de IA", { code: "provider_unavailable", latencyMs, retryable: true });
	} finally {
		clearTimeout(timeout);
	}
}
