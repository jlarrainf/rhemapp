export const DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const DEFAULT_LECTIO_MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";
export const DEFAULT_LECTIO_TIMEOUT_MS = 20_000;
export const DEFAULT_LECTIO_MAX_TOKENS = 640;
export const DEFAULT_LECTIO_RETRY_BACKOFF_MS = 250;

function readPositiveInteger(value, fallback, maximum) {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
	return Math.min(parsed, maximum);
}

export function getLectioAIConfig(env = process.env) {
	return {
		enabled: env.LECTIO_AI_ENABLED === "true",
		apiKey: typeof env.OPENROUTER_API_KEY === "string" ? env.OPENROUTER_API_KEY.trim() : "",
		apiUrl: env.OPENROUTER_API_URL || DEFAULT_OPENROUTER_URL,
		model: env.LECTIO_AI_MODEL || DEFAULT_LECTIO_MODEL,
		timeoutMs: readPositiveInteger(env.LECTIO_AI_TIMEOUT_MS, DEFAULT_LECTIO_TIMEOUT_MS, 60_000),
		maxTokens: readPositiveInteger(env.LECTIO_AI_MAX_TOKENS, DEFAULT_LECTIO_MAX_TOKENS, 1_200),
		retryBackoffMs: readPositiveInteger(env.LECTIO_AI_RETRY_BACKOFF_MS, DEFAULT_LECTIO_RETRY_BACKOFF_MS, 5_000),
	};
}
