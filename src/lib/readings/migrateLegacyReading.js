function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function cloneRanges(ranges) {
	return Array.isArray(ranges) ? ranges.map((range) => ({ ...range })) : [];
}

function cloneSource(source) {
	return isPlainObject(source) ? { ...source } : source;
}

export function migrateLegacyEntry(entry) {
	if (!isPlainObject(entry) || !isPlainObject(entry.gospel)) {
		throw new Error("La entrada legacy debe contener un objeto gospel");
	}

	if (Array.isArray(entry.readings)) return { ...entry, readings: entry.readings.map((reading) => ({ ...reading })) };

	const legacyGospel = entry.gospel;
	const reading = {
		type: "gospel",
		order: 4,
		reference: legacyGospel.reference,
		passageId: legacyGospel.passageId,
		ranges: cloneRanges(legacyGospel.ranges),
		title: legacyGospel.title || legacyGospel.excerpt || "",
		excerpt: legacyGospel.excerpt || "",
		excerptReference: legacyGospel.excerptReference || legacyGospel.reference,
		source: cloneSource(entry.source),
	};

	return {
		...entry,
		gospel: {
			...legacyGospel,
			ranges: cloneRanges(legacyGospel.ranges),
		},
		readings: [reading],
		source: cloneSource(entry.source),
	};
}

export function migrateLegacyDataset(dataset) {
	if (!isPlainObject(dataset) || !Array.isArray(dataset.entries)) {
		throw new Error("El calendario legacy debe contener un arreglo entries");
	}

	return {
		...dataset,
		entries: dataset.entries.map(migrateLegacyEntry),
	};
}
