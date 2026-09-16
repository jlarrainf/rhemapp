const VATICAN_NEWS_SOURCES = Object.freeze({
	"2026-09-15": Object.freeze({
		"Nuestra Señora de los Dolores": Object.freeze({
			provider: "Vatican News",
			url: "https://www.vaticannews.va/es/fiestas-liturgicas/santisima-virgen-de-los-dolores.html",
			verified: true,
			attribution: "Vatican News",
		}),
	}),
	"2026-09-26": Object.freeze({
		"Santos Cosme y Damián": Object.freeze({
			provider: "Vatican News",
			url: "https://www.vaticannews.va/es/santos/09/26/ss--cosme-y-damian--martires.html",
			verified: true,
			attribution: "Vatican News",
		}),
	}),
	"2026-10-04": Object.freeze({
		"San Francisco de Asís": Object.freeze({
			provider: "Vatican News",
			url: "https://www.vaticannews.va/es/santos/10/04.html",
			verified: true,
			attribution: "Vatican News",
		}),
	}),
	"2026-10-15": Object.freeze({
		"Santa Teresa de Jesús": Object.freeze({
			provider: "Vatican News",
			url: "https://www.vaticannews.va/es/santos/10/15/s--teresa-de-jesus--virgen--doctora-de-la-iglesia--carmelita-des.html",
			verified: true,
			attribution: "Vatican News",
		}),
	}),
});

const VATICAN_NEWS_DAILY_SAINTS = Object.freeze({
	"2026-09-15": Object.freeze([
		Object.freeze({
			name: "Santísima Virgen de los Dolores",
			source: Object.freeze({
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-15",
			}),
		}),
		Object.freeze({
			name: "Nicomedes",
			source: Object.freeze({
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-15",
			}),
		}),
		Object.freeze({
			name: "Catalina de Génova",
			source: Object.freeze({
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-15",
			}),
		}),
	]),
});

export function getSaintInformationSource(dateKey, saintName) {
	const source = VATICAN_NEWS_SOURCES[dateKey]?.[saintName];
	return source ? { ...source } : null;
}

export function getSupplementalSaints(dateKey) {
	return (VATICAN_NEWS_DAILY_SAINTS[dateKey] || []).map((saint) => ({
		name: saint.name,
		source: { ...saint.source },
	}));
}

export function applySupplementalSaintsOverride(entry, dateKey) {
	const supplementalSaints = getSupplementalSaints(dateKey);
	return supplementalSaints.length > 0
		? { ...entry, supplementalSaints }
		: entry;
}

export function preserveSupplementalSaints(previousEntry, nextEntry) {
	if (nextEntry?.supplementalSaints !== undefined || !Array.isArray(previousEntry?.supplementalSaints)) {
		return nextEntry;
	}

	return {
		...nextEntry,
		supplementalSaints: previousEntry.supplementalSaints.map((saint) => ({
			name: saint.name,
			source: { ...saint.source },
		})),
	};
}

export function preserveLiturgicalMetadata(previousEntry, nextEntry) {
	if (!nextEntry) return nextEntry;

	const preserved = { ...nextEntry };
	if (preserved.celebrations === undefined && Array.isArray(previousEntry?.celebrations)) {
		preserved.celebrations = previousEntry.celebrations.map((celebration) => ({
			...celebration,
			saints: Array.isArray(celebration.saints)
				? celebration.saints.map((saint) => ({
					...saint,
					source: saint.source ? { ...saint.source } : saint.source,
					...(saint.informationSource ? { informationSource: { ...saint.informationSource } } : {}),
				}))
				: [],
			source: celebration.source ? { ...celebration.source } : celebration.source,
		}));
	}
	if (preserved.liturgicalSeason === undefined && previousEntry?.liturgicalSeason) {
		preserved.liturgicalSeason = previousEntry.liturgicalSeason;
	}
	if (preserved.liturgicalColor === undefined && previousEntry?.liturgicalColor) {
		preserved.liturgicalColor = previousEntry.liturgicalColor;
	}

	return preserved;
}
