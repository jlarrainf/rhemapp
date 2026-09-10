import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DAILY_DIR = path.join(ROOT, "public", "data", "daily-readings");
const PRIMARY_URL = "https://www.eucaristiadiaria.cl/dia_cal.php?fecha=";
const FALLBACK_URL = "https://www.ewtn.com/es/lecturas/";
const SPANISH_FALLBACK_URL = "https://es.audiobiblia.net/misal/";
const BIBLE_API_URL = "https://api.scripture.api.bible/v1/bibles/b32b9d1b64b4ef29-01/passages/";
const ORDO_URL = "https://www.iglesia.cl/docs/2026-Ordinario-II.pdf";

const BOOK_CODES = {
	Mateo: "MAT",
	Marcos: "MRK",
	Lucas: "LUK",
	Juan: "JHN",
};

const ABBREVIATED_BOOKS = {
	Mt: "Mateo",
	Mc: "Marcos",
	Lc: "Lucas",
	Jn: "Juan",
};

const FALLBACK_EXCERPT_OVERRIDES = {
	"2026-12-05": {
		excerpt: "Y al ver las multitudes, tuvo compasión de ellas; porque estaban desamparadas y dispersas como ovejas que no tienen pastor.",
		excerptReference: "Mateo 9:36",
	},
};

// El Ordo chileno tiene prioridad cuando una fuente universal publica una
// memoria opcional o una selección distinta para la misma fecha.
const ORDO_GOSPEL_OVERRIDES = {
	"2026-09-12": {
		book: "Lucas",
		citation: "6:43-49",
		celebration: "Santísimo Nombre de María (memoria)",
		excerpt: "No es buen árbol el que da malos frutos, ni árbol malo el que da buen fruto.",
		excerptReference: "Lucas 6:43",
	},
	"2026-09-15": {
		book: "Lucas",
		citation: "7:11-17",
		celebration: "Nuestra Señora de los Dolores (memoria)",
		excerpt: "Y cuando el Señor la vio, se compadeció de ella, y le dijo: No llores.",
		excerptReference: "Lucas 7:13",
	},
	"2026-09-26": {
		book: "Lucas",
		citation: "9:43-45",
		celebration: "Santos Cosme y Damián, mártires (memoria)",
		excerpt: "Haced que os penetren bien en los oídos estas palabras; porque acontecerá que el Hijo del Hombre será entregado en manos de hombres.",
		excerptReference: "Lucas 9:44",
	},
	"2026-10-04": {
		book: "Mateo",
		citation: "21:33-46",
		celebration: "XXVII Domingo del Tiempo Ordinario",
		excerpt: "Por tanto os digo, que el reino de Dios será quitado de vosotros, y será dado a gente que produzca los frutos de él.",
		excerptReference: "Mateo 21:43",
	},
	"2026-10-12": {
		book: "Lucas",
		citation: "11:29-32",
		celebration: "Nuestra Señora del Pilar (memoria)",
		excerpt: "Y apiñándose las multitudes, comenzó a decir: Esta generación es mala; demanda señal, pero señal no le será dada, sino la señal de Jonás.",
		excerptReference: "Lucas 11:29",
	},
	"2026-10-15": {
		book: "Lucas",
		citation: "11:47-54",
		celebration: "Santa Teresa de Jesús, virgen y doctora de la Iglesia (memoria)",
		excerpt: "¡Ay de vosotros, que edificáis los sepulcros de los profetas a quienes mataron vuestros padres!",
		excerptReference: "Lucas 11:47",
	},
	"2026-10-27": {
		book: "Lucas",
		citation: "13:18-21",
		celebration: "Martes de la XXX semana del tiempo ordinario",
		excerpt: "¿A qué es semejante el reino de Dios, y con qué lo compararé?",
		excerptReference: "Lucas 13:18",
	},
	"2026-11-01": {
		book: "Mateo",
		citation: "4:25-5:12",
		celebration: "Todos los Santos (solemnidad)",
		excerpt: "Bienaventurados los misericordiosos, porque ellos alcanzarán misericordia.",
		excerptReference: "Mateo 5:7",
	},
	"2026-11-02": {
		book: "Juan",
		citation: "11:17-27",
		celebration: "Conmemoración de todos los fieles difuntos",
		excerpt: "Jesús le dijo: Yo soy la resurrección y la vida; el que cree en mí, aunque esté muerto, vivirá.",
		excerptReference: "Juan 11:25",
	},
	"2026-11-24": {
		book: "Lucas",
		citation: "21:5-9",
		celebration: "Santos Andrés Dung-Lac y compañeros, mártires (memoria)",
		excerpt: "Mirad que no seáis engañados; porque vendrán muchos en mi nombre, diciendo: Yo soy el Cristo, y: El tiempo está cerca. Mas no vayáis en pos de ellos.",
		excerptReference: "Lucas 21:8",
	},
};

const MEANINGFUL_WORDS = [
	"amor",
	"misericordia",
	"perdón",
	"perdon",
	"fe",
	"vida",
	"reino",
	"padre",
	"señor",
	"senor",
	"dios",
	"verdad",
	"luz",
	"paz",
	"servir",
	"seguir",
	"oración",
	"oracion",
	"salvación",
	"salvacion",
	"alegría",
	"alegria",
	"esperanza",
];

function parseArgs() {
	const values = {};
	for (let index = 2; index < process.argv.length; index += 1) {
		const argument = process.argv[index];
		if (argument.startsWith("--")) {
			values[argument.slice(2)] = process.argv[index + 1] || true;
			index += 1;
		}
	}
	return values;
}

function decodeEntities(value) {
	const named = {
		amp: "&",
		apos: "'",
		quot: '"',
		nbsp: " ",
		ldquo: "“",
		rdquo: "”",
		laquo: "«",
		raquo: "»",
		mdash: "—",
		ndash: "–",
		iexcl: "¡",
		iquest: "¿",
		Aacute: "Á",
		Eacute: "É",
		Iacute: "Í",
		Oacute: "Ó",
		Uacute: "Ú",
		Ntilde: "Ñ",
		ntilde: "ñ",
		aacute: "á",
		eacute: "é",
		iacute: "í",
		oacute: "ó",
		uacute: "ú",
		uuml: "ü",
		ccedil: "ç",
		ordf: "ª",
	};

	return value
		.replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
		.replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
		.replace(/&([a-z]+);/gi, (full, key) => named[key] ?? full)
		.trim();
}

function stripHtml(value) {
	return decodeEntities(value
		.replace(/<script[\s\S]*?<\/script>/gi, " ")
		.replace(/<style[\s\S]*?<\/style>/gi, " ")
		.replace(/<br\s*\/?\s*>/gi, "\n")
		.replace(/<\/(?:p|div|li|h[1-6]|tr)>/gi, "\n")
		.replace(/<[^>]+>/g, " "))
		.split(/\r?\n/)
		.map((line) => line.replace(/\s+/g, " ").trim())
		.filter(Boolean)
		.join("\n");
}

function normalizeCitation(book, citation) {
	const code = BOOK_CODES[book];
	if (!code) throw new Error(`Libro evangélico no soportado: ${book}`);

	const cleaned = citation
		.replace(/[—–]/g, "-")
		.replace(/\s+/g, "")
		.replace(/;/g, ",");
	const ranges = [];
	let reference;
	let crossReference = null;
	const formatRange = (range) => {
		const start = `${range.start}${range.startSuffix || ""}`;
		const end = `${range.end}${range.endSuffix || ""}`;
		if (range.endChapter && range.endChapter !== range.chapter) {
			return `${start}-${range.endChapter}:${end}`;
		}
		return range.start === range.end && range.startSuffix === range.endSuffix ? start : `${start}-${end}`;
	};
	const formatPassageRange = (range) => {
		const start = `${range.start}${range.startSuffix || ""}`;
		const end = `${range.end}${range.endSuffix || ""}`;
		return range.endChapter && range.endChapter !== range.chapter
			? `${start}-${range.endChapter}.${end}`
			: formatRange(range);
	};
	const formatReference = () => {
		const [first, ...rest] = ranges;
		return `${book} ${first.chapter}:${formatRange(first)}${rest
			.map((range) => (range.chapter === first.chapter ? `,${formatRange(range)}` : `-${range.chapter}:${formatRange(range)}`))
			.join("")}`;
	};

	if (cleaned.includes(":")) {
		const crossChapter = cleaned.match(/^(\d+):(\d+)-(\d+):(\d+)$/);
		if (crossChapter) {
			ranges.push({
			chapter: Number(crossChapter[1]),
			start: Number(crossChapter[2]),
			end: Number(crossChapter[4]),
			endChapter: Number(crossChapter[3]),
		});
			reference = `${book} ${crossChapter[1]}:${crossChapter[2]}-${crossChapter[3]}:${crossChapter[4]}`;
		} else {
			const match = cleaned.match(/^(\d+):(.+)$/);
			if (!match) throw new Error(`Referencia no reconocida: ${book} ${citation}`);
			const chapter = Number(match[1]);
			for (const segment of match[2].split(",")) {
				const range = segment.match(/^(\d+)([a-z])?(?:-(\d+)([a-z])?)?$/i);
				if (!range) throw new Error(`Rango no reconocido: ${book} ${citation}`);
				ranges.push({
					chapter,
					start: Number(range[1]),
					startSuffix: range[2]?.toLowerCase(),
					end: Number(range[3] || range[1]),
					endSuffix: range[4]?.toLowerCase() || range[2]?.toLowerCase(),
				});
			}
			reference = formatReference();
		}
	} else {
		const segments = cleaned.split(".");
		const first = segments.shift()?.match(/^(\d+),(.+)$/);
		if (!first) throw new Error(`Referencia no reconocida: ${book} ${citation}`);
		let chapter = Number(first[1]);
		const segmentTexts = [first[2], ...segments];
		for (const segmentText of segmentTexts) {
			const crossChapter = segmentText.match(/^(\d+)-(\d+),(\d+)$/);
			if (crossChapter && Number(crossChapter[2]) < Number(crossChapter[1])) {
				crossReference = `${book} ${chapter}:${crossChapter[1]}-${crossChapter[2]}:${crossChapter[3]}`;
				ranges.push({
					chapter,
					start: Number(crossChapter[1]),
					end: Number(crossChapter[3]),
					endChapter: Number(crossChapter[2]),
				});
				chapter = Number(crossChapter[2]);
				continue;
			}
			const range = segmentText.match(/^(\d+)([a-z])?(?:-(\d+)([a-z])?)?$/i);
			if (!range) throw new Error(`Rango no reconocido: ${book} ${citation}`);
			ranges.push({
				chapter,
				start: Number(range[1]),
				startSuffix: range[2]?.toLowerCase(),
				end: Number(range[3] || range[1]),
				endSuffix: range[4]?.toLowerCase() || range[2]?.toLowerCase(),
			});
		}
		if (crossReference) {
			const suffixRanges = ranges.slice(1);
			reference = `${crossReference}${suffixRanges
				.map((range) => (range.chapter === chapter ? `,${formatRange(range)}` : `-${range.chapter}:${formatRange(range)}`))
				.join("")}`;
		} else {
			reference = formatReference();
		}
	}

	const [firstRange, ...remainingRanges] = ranges;
	const passageId = `${code}.${firstRange.chapter}.${formatPassageRange(firstRange)}${remainingRanges
		.map((range) => `,${formatPassageRange(range)}`)
		.join("")}`;

	return {
		reference,
		passageId,
		ranges,
	};
}

function extractSourceDate(html, date) {
	const plain = stripHtml(html);
	const title = plain.match(/Eucaristía del [^\n]+/i)?.[0]?.trim() || `Eucaristía del ${date}`;
	const celebration = plain
		.match(/RITOS INICIALES\s+\(Ver Ordinario de la Misa\)\s+([^\n]+)/i)?.[1]
		?.trim() || "";
	return { title, celebration };
}

function parseEucaristia(html, date) {
	const section = html.match(/<a\s+name=["']evangelio["'][\s\S]*?(?=<a\s+name=["']eucaristia["']|$)/i)?.[0];
	if (!section) return null;

	const plain = stripHtml(section);
	const referenceMatch = plain.match(
		/\+\s+Evangelio de nuestro Señor Jesucristo según san\s+(Mateo|Marcos|Lucas|Juan)\s+([\d ,.!—–-]+)/i
	);
	if (!referenceMatch) return null;

	const beforeReference = plain.slice(0, referenceMatch.index);
	const titleCandidates = beforeReference
		.split(/EVANGELIO/i)
		.at(-1)
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line && !/^ACLAMACIÓN/i.test(line) && !/^Aleluya/i.test(line));
	const title = titleCandidates.at(-1) || "";
	const { reference, passageId, ranges } = normalizeCitation(referenceMatch[1], referenceMatch[2]);
	const { title: pageTitle, celebration } = extractSourceDate(html, date);

	return {
		date,
		calendar: "chile",
		liturgicalYear: "2026",
		celebration,
		gospel: {
			reference,
			passageId,
			ranges,
			title,
			excerpt: title,
			excerptReference: reference,
		},
		source: {
			provider: "Eucaristía Diaria / Conferencia Episcopal de Chile",
			url: `${PRIMARY_URL}${date}`,
			ordoUrl: ORDO_URL,
			pageTitle,
			verified: true,
		},
	};
}

function extractJsonLd(html) {
	const match = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
	if (!match) return null;
	try {
		return JSON.parse(match[1]);
	} catch {
		return null;
	}
}

function chooseExcerpt(text) {
	const sentences = text.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) || [];
	const candidates = sentences.filter((sentence) => {
		const words = sentence.split(/\s+/).filter(Boolean).length;
		return words >= 6 && words <= 28 && !/^Palabra del Señor/i.test(sentence);
	});

	const scored = candidates.map((sentence, index) => {
		const lower = sentence.toLocaleLowerCase("es");
		const keywordScore = MEANINGFUL_WORDS.reduce(
			(score, word) => score + (lower.includes(word) ? 2 : 0),
			0
		);
		const openingScore = /^(amen|amen a|el que|los que|sean|yo soy|vayan|hagan|no teman|bienaventurados|dichosos|ustedes)/i.test(sentence) ? 3 : 0;
		return { sentence, score: keywordScore + openingScore - index * 0.01 };
	});

	return scored.sort((left, right) => right.score - left.score)[0]?.sentence || sentences[0] || text.slice(0, 220).trim();
}

function parseEwtn(html, date) {
	const json = extractJsonLd(html);
	if (!json?.articleBody) return null;

	const lines = json.articleBody.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
	const gospelIndex = lines.findIndex((line) => line.toLocaleLowerCase("es") === "evangelio");
	const referenceIndex = lines.findIndex(
		(line, index) => index > gospelIndex && /^(Mateo|Marcos|Lucas|Juan)\s+\d+:/i.test(line)
	);
	if (gospelIndex < 0 || referenceIndex < 0) return null;

	const referenceLine = lines[referenceIndex];
	const referenceMatch = referenceLine.match(/^(Mateo|Marcos|Lucas|Juan)\s+(.+)$/i);
	if (!referenceMatch) return null;

	const book = referenceMatch[1][0].toUpperCase() + referenceMatch[1].slice(1).toLowerCase();
	const citation = referenceMatch[2];
	const { reference, passageId, ranges } = normalizeCitation(book, citation);
	const gospelText = lines
		.slice(referenceIndex + 1)
		.filter((line) => !/^\d+$/.test(line))
		.join(" ");
	const excerpt = chooseExcerpt(gospelText);

	return {
		date,
		calendar: "chile",
		liturgicalYear: "2026",
		celebration: "",
		gospel: {
			reference,
			passageId,
			ranges,
			title: excerpt,
			excerpt,
			excerptReference: reference,
		},
		source: {
			provider: "EWTN (respaldo provisional)",
			url: `${FALLBACK_URL}${date}`,
			ordoUrl: ORDO_URL,
			verified: true,
			provisional: true,
		},
	};
}

function parseAudioBiblia(html, date) {
	const section = html.match(/<section[^>]+class=["'][^"']*kind-gospel[^"']*["'][\s\S]*?<\/section>/i)?.[0];
	if (!section) return null;

	const referenceText = stripHtml(section.match(/class=["']ms-rref["'][^>]*>([\s\S]*?)<\//i)?.[1] || "");
	const gospelTitle = stripHtml(section.match(/class=["']ms-rtitle["'][^>]*>([\s\S]*?)<\//i)?.[1] || "");
	const gospelText = stripHtml(section.match(/class=["']ms-rtext[^"']*["'][^>]*>([\s\S]*?)<\/p>/i)?.[1] || "");
	const referenceMatch = referenceText.match(/^(?:(Mt|Mc|Lc|Jn)\s+)?(.+)$/i);
	const titleBook = gospelTitle.match(/según san\s+(Mateo|Marcos|Lucas|Juan)/i)?.[1];
	if (!referenceMatch || !gospelText) return null;

	const book = ABBREVIATED_BOOKS[referenceMatch[1]] || titleBook;
	if (!book) return null;
	const { reference, passageId, ranges } = normalizeCitation(book, referenceMatch[2]);
	const excerptOverride = FALLBACK_EXCERPT_OVERRIDES[date];
	const excerpt = excerptOverride?.excerpt || chooseExcerpt(gospelText);

	return {
		date,
		calendar: "chile",
		liturgicalYear: "2026",
		celebration: "",
		gospel: {
			reference,
			passageId,
			ranges,
			title: excerpt,
			excerpt,
			excerptReference: excerptOverride?.excerptReference || reference,
		},
		source: {
			provider: "Audiobiblia (respaldo provisional)",
			url: `${SPANISH_FALLBACK_URL}${date}`,
			ordoUrl: ORDO_URL,
			verified: true,
			provisional: true,
		},
	};
}

async function request(url) {
	const response = await fetch(url, {
		headers: { "user-agent": "Rhemapp daily-reading-sync/1.0" },
	});
	if (!response.ok) return null;
	return response.text();
}

async function enrichExcerptFromBibleApi(entry) {
	const apiKey = process.env.BIBLE_API_KEY || process.env.NEXT_PUBLIC_BIBLE_API_KEY;
	if (!apiKey || !entry?.gospel?.passageId) return entry;

	try {
		const response = await fetch(
			`${BIBLE_API_URL}${encodeURIComponent(entry.gospel.passageId)}?content-type=text&include-verse-numbers=false`,
			{ headers: { "api-key": apiKey } }
		);
		if (!response.ok) return entry;
		const payload = await response.json();
		const text = payload?.data?.content?.trim();
		if (!text) return entry;

		const sourceTitle = entry.gospel.title?.trim();
		const normalizedText = text.toLocaleLowerCase("es");
		const normalizedTitle = sourceTitle?.toLocaleLowerCase("es");
		const excerpt = normalizedTitle && normalizedText.includes(normalizedTitle)
			? sourceTitle
			: chooseExcerpt(text);

		return {
			...entry,
			gospel: {
				...entry.gospel,
				excerpt,
				excerptReference: entry.gospel.reference,
			},
			source: {
				...entry.source,
				bibleApiVerified: true,
				bibleApiVersion: "b32b9d1b64b4ef29-01",
			},
		};
	} catch {
		return entry;
	}
}

function applyOrdoOverride(entry, date) {
	const override = ORDO_GOSPEL_OVERRIDES[date];
	if (!entry || !override) return entry;

	const { reference, passageId, ranges } = normalizeCitation(override.book, override.citation);
	return {
		...entry,
		celebration: entry.celebration || override.celebration,
		gospel: {
			...entry.gospel,
			reference,
			passageId,
			ranges,
			title: override.excerpt || entry.gospel.title,
			excerpt: override.excerpt || entry.gospel.excerpt,
			excerptReference: override.excerptReference || reference,
		},
		source: {
			...entry.source,
			ordoUrl: ORDO_URL,
			ordoValidated: true,
		},
	};
}

async function fetchEntry(date) {
	const primaryHtml = await request(`${PRIMARY_URL}${date}`);
	const primaryEntry = primaryHtml ? parseEucaristia(primaryHtml, date) : null;
	if (primaryEntry?.gospel?.excerpt) return enrichExcerptFromBibleApi(applyOrdoOverride(primaryEntry, date));

	const spanishFallbackHtml = await request(`${SPANISH_FALLBACK_URL}${date}`);
	const spanishFallbackEntry = spanishFallbackHtml ? parseAudioBiblia(spanishFallbackHtml, date) : null;
	if (spanishFallbackEntry?.gospel?.excerpt) return enrichExcerptFromBibleApi(applyOrdoOverride(spanishFallbackEntry, date));

	const fallbackHtml = await request(`${FALLBACK_URL}${date}`);
	const fallbackEntry = fallbackHtml ? parseEwtn(fallbackHtml, date) : null;
	return fallbackEntry ? enrichExcerptFromBibleApi(applyOrdoOverride(fallbackEntry, date)) : null;
}

function dateRange(start, end) {
	const dates = [];
	for (let cursor = new Date(`${start}T12:00:00Z`); cursor <= new Date(`${end}T12:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
		dates.push(cursor.toISOString().slice(0, 10));
	}
	return dates;
}

const args = parseArgs();
const start = args.start || process.env.DAILY_SYNC_START || "2026-09-10";
const end = args.end || process.env.DAILY_SYNC_END || "2026-12-31";
const year = start.slice(0, 4);
const outputPath = path.join(DAILY_DIR, `${year}.json`);
const existing = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, "utf8")) : { calendar: "chile", year: Number(year), liturgicalYear: year, entries: [] };
const entriesByDate = new Map(
	(existing.entries || []).map((entry) => [
		entry.date,
		{
			...entry,
			source: {
				...entry.source,
				ordoUrl: entry.source?.ordoUrl || ORDO_URL,
			},
		},
	]),
);

for (const date of dateRange(start, end)) {
	try {
		const entry = await fetchEntry(date);
		if (entry) {
			const previousEntry = entriesByDate.get(date);
			entry.source.fetchedAt = previousEntry?.source?.fetchedAt || new Date().toISOString();
			entriesByDate.set(date, entry);
			console.log(`${date}: ${entry.gospel.reference} (${entry.source.provider})`);
		} else {
			console.warn(`${date}: sin publicación disponible; se conservará el dato anterior si existe`);
		}
	} catch (error) {
		console.warn(`${date}: ${error.message}`);
	}
}

const entries = [...entriesByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
const previousEntries = JSON.stringify(existing.entries || []);
const nextEntries = JSON.stringify(entries);
const syncedAt = previousEntries === nextEntries && existing.syncedAt
	? existing.syncedAt
	: new Date().toISOString();
fs.mkdirSync(DAILY_DIR, { recursive: true });
fs.writeFileSync(
	outputPath,
	`${JSON.stringify({ ...existing, calendar: "chile", year: Number(year), liturgicalYear: year, syncedAt, entries }, null, 2)}\n`,
	"utf8"
);

console.log(`Guardadas ${entries.length} lecturas en ${outputPath}`);
