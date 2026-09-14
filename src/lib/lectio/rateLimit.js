const WINDOW_MS = 60 * 60 * 1000;
const MAX_MANUAL_REGENERATIONS = 3;
const buckets = new Map();

function bucketKey(actorUserId, readingKey) {
	return `${actorUserId}:${readingKey}`;
}

export function consumeLectioRegenerationRateLimit({ actorUserId, readingKey, now = Date.now() } = {}) {
	const key = bucketKey(actorUserId, readingKey);
	const current = buckets.get(key);
	if (!current || now - current.startedAt >= WINDOW_MS) {
		buckets.set(key, { startedAt: now, count: 1 });
		return { allowed: true, remaining: MAX_MANUAL_REGENERATIONS - 1, retryAfterSeconds: 0 };
	}
	if (current.count >= MAX_MANUAL_REGENERATIONS) {
		return {
			allowed: false,
			remaining: 0,
			retryAfterSeconds: Math.ceil((current.startedAt + WINDOW_MS - now) / 1000),
		};
	}
	current.count += 1;
	return { allowed: true, remaining: MAX_MANUAL_REGENERATIONS - current.count, retryAfterSeconds: 0 };
}

export function clearLectioRegenerationRateLimitForTests() {
	buckets.clear();
}

export { MAX_MANUAL_REGENERATIONS, WINDOW_MS };
