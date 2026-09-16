function hasNamedItem(items) {
	return Array.isArray(items) && items.some((item) => typeof item?.name === "string" && item.name.trim());
}

export function hasPublishedLiturgicalContext(reading) {
	const celebrations = Array.isArray(reading?.celebrations) ? reading.celebrations : [];
	const hasCelebration = celebrations.some((celebration) => (
		typeof celebration?.name === "string" && celebration.name.trim()
	) || hasNamedItem(celebration?.saints));
	const hasSupplementalSaints = hasNamedItem(reading?.supplementalSaints);

	return Boolean(
		hasCelebration
		|| hasSupplementalSaints
		|| reading?.liturgicalSeason
		|| reading?.liturgicalColor,
	);
}
