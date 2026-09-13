import { createHmac } from "node:crypto";

export const AUTH_RATE_LIMIT_POLICIES = Object.freeze({
	login: Object.freeze({ limit: 5, windowSeconds: 15 * 60 }),
	recovery: Object.freeze({ limit: 3, windowSeconds: 60 * 60 }),
});

export class AuthRateLimitExceededError extends Error {
	constructor(retryAfterSeconds) {
		super("Se alcanzó el límite temporal de autenticación");
		this.name = "AuthRateLimitExceededError";
		this.status = 429;
		this.retryAfterSeconds = Number.isInteger(retryAfterSeconds) ? retryAfterSeconds : null;
	}
}

function getRateLimitPolicy(action) {
	const policy = AUTH_RATE_LIMIT_POLICIES[action];
	if (!policy) throw new Error("Unsupported authentication rate-limit action");
	return policy;
}

export function createRateLimitKeyHash(scope, value, secret = process.env.SUPABASE_SERVICE_ROLE_KEY) {
	if (typeof scope !== "string" || typeof value !== "string" || typeof secret !== "string" || !secret) {
		throw new Error("Authentication rate-limit hashing is not configured");
	}

	return createHmac("sha256", secret).update(`${scope}:${value}`).digest("hex");
}

export function getClientIp(request) {
	const forwardedFor = request?.headers?.get("x-forwarded-for") || "";
	const forwardedIp = forwardedFor.split(",")[0]?.trim();
	const directIp = request?.headers?.get("x-real-ip")?.trim();
	return (forwardedIp || directIp || "unknown").slice(0, 128);
}

export function createRateLimitKeys({ action, email, ip, secret }) {
	getRateLimitPolicy(action);
	if (typeof email !== "string" || typeof ip !== "string") {
		throw new Error("Authentication rate-limit identifiers are invalid");
	}

	const normalizedEmail = email.trim().toLowerCase();
	const normalizedIp = ip.trim() || "unknown";
	return [
		{ action, keyHash: createRateLimitKeyHash("email", normalizedEmail, secret) },
		{ action, keyHash: createRateLimitKeyHash("ip", normalizedIp, secret) },
	];
}

export function isCredentialFailure(error) {
	return ["invalid_credentials", "email_not_confirmed"].includes(error?.code);
}

export function isProviderRateLimit(error) {
	return ["over_request_rate_limit", "too_many_requests", "over_email_send_rate_limit"].includes(error?.code);
}

export async function consumeAuthRateLimit(
	supabaseAdmin,
	{ action, email, ip, recordFailure = false },
) {
	const policy = getRateLimitPolicy(action);
	const keys = createRateLimitKeys({
		action,
		email,
		ip,
		secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
	});
	const results = await Promise.all(
		keys.map(async ({ keyHash }) => {
			const { data, error } = await supabaseAdmin.rpc("consume_auth_rate_limit", {
				p_action: action,
				p_key_hash: keyHash,
				p_limit: policy.limit,
				p_window_seconds: policy.windowSeconds,
				p_record_failure: recordFailure,
			});
			if (error || !data || typeof data.allowed !== "boolean") {
				const rateLimitError = new Error("Authentication rate-limit storage unavailable");
				rateLimitError.name = error?.name || "AuthRateLimitStorageError";
				rateLimitError.status = 503;
				throw rateLimitError;
			}
			return data;
		}),
	);

	const blocked = results.find((result) => result.allowed === false);
	if (blocked) throw new AuthRateLimitExceededError(blocked.retry_after_seconds);

	return {
		allowed: true,
		remaining: Math.min(...results.map((result) => Number(result.remaining) || 0)),
	};
}
