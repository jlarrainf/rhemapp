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

export function getSaintInformationSource(dateKey, saintName) {
	const source = VATICAN_NEWS_SOURCES[dateKey]?.[saintName];
	return source ? { ...source } : null;
}
