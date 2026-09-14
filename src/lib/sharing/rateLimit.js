const POLICIES = Object.freeze({
	create: Object.freeze({ limit: 20, windowMs: 60_000 }),
	resolve: Object.freeze({ limit: 60, windowMs: 60_000 }),
});

const buckets = new Map();
const MAX_BUCKETS = 5000;

export class ShareRateLimitError extends Error {
	constructor(retryAfterSeconds) {
		super("Se alcanzó el límite temporal de enlaces compartidos");
		this.name = "ShareRateLimitError";
		this.status = 429;
		this.retryAfterSeconds = retryAfterSeconds;
	}
}

function getPolicy(action) {
	const policy = POLICIES[action];
	if (!policy) throw new Error("Unsupported sharing rate-limit action");
	return policy;
}

export function getRequestIp(headers) {
	const forwarded = headers?.get?.("x-forwarded-for") || "";
	const real = headers?.get?.("x-real-ip") || "";
	return (forwarded.split(",")[0]?.trim() || real.trim() || "unknown").slice(0, 128);
}

export function consumeShareRateLimit({ action, ip = "unknown", now = Date.now() }) {
	const policy = getPolicy(action);
	const key = `${action}:${String(ip).slice(0, 128)}`;
	const current = buckets.get(key);
	if (!current || now - current.windowStartedAt >= policy.windowMs) {
		for (const [bucketKey, bucket] of buckets) {
			if (now - bucket.windowStartedAt >= policy.windowMs) buckets.delete(bucketKey);
		}
		if (buckets.size >= MAX_BUCKETS) buckets.delete(buckets.keys().next().value);
		buckets.set(key, { windowStartedAt: now, count: 1 });
		return { allowed: true, remaining: policy.limit - 1 };
	}
	if (current.count >= policy.limit) {
		const retryAfterSeconds = Math.max(1, Math.ceil((policy.windowMs - (now - current.windowStartedAt)) / 1000));
		throw new ShareRateLimitError(retryAfterSeconds);
	}
	current.count += 1;
	return { allowed: true, remaining: policy.limit - current.count };
}

export function clearShareRateLimitBuckets() {
	buckets.clear();
}

export { POLICIES as SHARE_RATE_LIMIT_POLICIES };
