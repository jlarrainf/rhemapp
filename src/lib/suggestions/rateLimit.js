import { SUGGESTION_LIMITS } from "./constants.js";
import { SuggestionRateLimitError } from "./validation.js";

const attempts = new Map();

function normalizeKey(value) {
	return typeof value === "string" && value.trim() ? value.trim().slice(0, 180) : "unknown";
}

export function consumeSuggestionRateLimit({ userId, ip = "unknown", now = Date.now() }) {
	const key = `${normalizeKey(userId)}:${normalizeKey(ip)}`;
	const previous = attempts.get(key);
	if (!previous || now - previous.startedAt >= SUGGESTION_LIMITS.windowMs) {
		attempts.set(key, { startedAt: now, count: 1 });
		return { allowed: true, remaining: SUGGESTION_LIMITS.maxPerWindow - 1 };
	}

	if (previous.count >= SUGGESTION_LIMITS.maxPerWindow) {
		const retryAfterSeconds = Math.max(1, Math.ceil((previous.startedAt + SUGGESTION_LIMITS.windowMs - now) / 1000));
		throw new SuggestionRateLimitError(retryAfterSeconds);
	}

	previous.count += 1;
	return { allowed: true, remaining: SUGGESTION_LIMITS.maxPerWindow - previous.count };
}

export function getSuggestionRequestIp(headers) {
	const forwarded = headers?.get?.("x-forwarded-for") || headers?.get?.("x-real-ip") || "unknown";
	return forwarded.split(",")[0].trim().slice(0, 180) || "unknown";
}

export function clearSuggestionRateLimitForTests() {
	attempts.clear();
}
