function mapReadingSources(entry, sourceMapper) {
	if (!Array.isArray(entry?.readings)) return {};

	return {
		readings: entry.readings.map((reading) => ({
			...reading,
			source: sourceMapper(reading.source),
		})),
	};
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
