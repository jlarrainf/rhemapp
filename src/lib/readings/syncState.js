function mapReadingSources(entry, sourceMapper) {
	const result = {};
	if (Array.isArray(entry?.readings)) {
		result.readings = entry.readings.map((reading) => ({
			...reading,
			source: sourceMapper(reading.source),
		}));
	}
	if (Array.isArray(entry?.celebrations)) {
		result.celebrations = entry.celebrations.map((celebration) => ({
			...celebration,
			source: sourceMapper(celebration.source),
			saints: Array.isArray(celebration.saints)
				? celebration.saints.map((saint) => ({
					...saint,
					source: sourceMapper(saint.source),
				}))
				: celebration.saints,
		}));
	}
	return result;
}

export function markReadingFresh(entry, fetchedAt = new Date().toISOString()) {
	if (!entry) return entry;

	const source = { ...entry.source, fetchedAt, syncStatus: "fresh" };
	delete source.lastSyncError;
	delete source.lastSyncAttemptAt;

	return {
		...entry,
		source,
		...mapReadingSources(entry, (readingSource) => ({
			...readingSource,
			fetchedAt,
			syncStatus: "fresh",
		})),
	};
}

export function markReadingStale(entry, error, attemptedAt = new Date().toISOString()) {
	if (!entry) return entry;

	const lastSyncError = String(error?.message || "La fuente no devolvió una lectura válida").slice(0, 240);
	const source = {
		...entry.source,
		syncStatus: "stale",
		lastSyncAttemptAt: attemptedAt,
		lastSyncError,
	};

	return {
		...entry,
		source,
		...mapReadingSources(entry, (readingSource) => ({
			...readingSource,
			syncStatus: "stale",
			lastSyncAttemptAt: attemptedAt,
			lastSyncError,
		})),
	};
}

export function recordSyncAttempt(attempts, dateKey, { status, source, attemptedAt, error } = {}) {
	const attempt = {
		status,
		attemptedAt,
		source: {
			provider: source?.provider || "Fuente litúrgica no disponible",
			url: source?.url || "",
		},
	};
	if (error) attempt.error = String(error).slice(0, 240);
	return { ...attempts, [dateKey]: attempt };
}
