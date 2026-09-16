import fs from "node:fs";
import path from "node:path";
import { mergeValidatedReading } from "../src/lib/readings/mergeSyncedReading.js";
import { markReadingFresh, markReadingStale, recordSyncAttempt } from "../src/lib/readings/syncState.js";
import { validateDailyDataset } from "../src/lib/readings/validateDailyDataset.js";
import { normalizeLiturgicalMetadata } from "../src/lib/readings/liturgicalMetadata.js";
import { applySupplementalSaintsOverride, getSaintInformationSource, preserveLiturgicalMetadata, preserveSupplementalSaints } from "../src/lib/readings/secondarySources.js";

const ROOT = process.cwd();
const DAILY_DIR = path.join(ROOT, "public", "data", "daily-readings");
const PRIMARY_URL = "https://www.eucaristiadiaria.cl/dia_cal.php?fecha=";
const FALLBACK_URL = "https://www.ewtn.com/es/lecturas/";
const SPANISH_FALLBACK_URL = "https://es.audiobiblia.net/misal/";
const BIBLE_ID = "b32b9d1b64b4ef29-01";
const BIBLE_API_BASE_URL = process.env.BIBLE_API_BASE_URL || "https://rest.api.bible";
const BIBLE_API_URL = `${BIBLE_API_BASE_URL}/v1/bibles/${BIBLE_ID}/passages/`;
const ORDO_URL = "https://www.iglesia.cl/docs/2026-Ordinario-II.pdf";

const BOOK_CODES = {
	Génesis: "GEN",
	Éxodo: "EXO",
	Levítico: "LEV",
	Números: "NUM",
	Deuteronomio: "DEU",
	Josué: "JOS",
	Jueces: "JDG",
	Rut: "RUT",
	"1 Samuel": "1SA",
	"2 Samuel": "2SA",
	"1 Reyes": "1KI",
	"2 Reyes": "2KI",
	"1 Crónicas": "1CH",
	"2 Crónicas": "2CH",
	Esdras: "EZR",
	Nehemías: "NEH",
	Ester: "EST",
	Job: "JOB",
	Salmos: "PSA",
	Proverbios: "PRO",
	Eclesiastés: "ECC",
	"Cantar de los Cantares": "SNG",
	Isaías: "ISA",
	Jeremías: "JER",
	Lamentaciones: "LAM",
	Ezequiel: "EZK",
	Daniel: "DAN",
	Oseas: "HOS",
	Joel: "JOL",
	Amós: "AMO",
	Abdías: "OBA",
	Jonás: "JON",
	Miqueas: "MIC",
	Nahúm: "NAH",
	Habacuc: "HAB",
	Sofonías: "ZEP",
	Ageo: "HAG",
	Zacarías: "ZEC",
	Malaquías: "MAL",
	Tobías: "TOB",
	Judit: "JDT",
	"1 Macabeos": "1MA",
	"2 Macabeos": "2MA",
	Baruc: "BAR",
	Sabiduría: "WIS",
	Eclesiástico: "SIR",
	Mateo: "MAT",
	Marcos: "MRK",
	Lucas: "LUK",
	Juan: "JHN",
	Romanos: "ROM",
	"1 Corintios": "1CO",
	"2 Corintios": "2CO",
	Gálatas: "GAL",
	Efesios: "EPH",
	Filipenses: "PHP",
	Colosenses: "COL",
	"1 Tesalonicenses": "1TH",
	"2 Tesalonicenses": "2TH",
	"1 Timoteo": "1TI",
	"2 Timoteo": "2TI",
	Tito: "TIT",
	Filemón: "PHM",
	Hebreos: "HEB",
	Santiago: "JAS",
	"1 Pedro": "1PE",
	"2 Pedro": "2PE",
	"1 Juan": "1JN",
	"2 Juan": "2JN",
	"3 Juan": "3JN",
	Judas: "JUD",
	Apocalipsis: "REV",
};

const READING_BOOK_ALIASES = [
	["1 Corintios", /corint(?:io|ios|o)/i],
	["1 Tesalonicenses", /tesal(?:ó|o)nica|tesalonicenses/i],
	["1 Timoteo", /timoteo/i],
	["1 Pedro", /pedro/i],
	["1 Juan", /juan/i],
	["Romanos", /romanos|roma/i],
	["Gálatas", /g(?:á|a)latas|galacia/i],
	["Efesios", /efesios|(?:f|ph)eso/i],
	["Filipenses", /filipenses|filipos/i],
	["Colosenses", /colosenses|colosas/i],
	["Filemón", /filem(?:ó|o)n/i],
	["Hebreos", /hebreos/i],
	["Santiago", /santiago/i],
	["Tito", /tito/i],
	["Eclesiástico", /eclesi(?:á|a)stico|sir(?:á|a)cide/i],
	["Sabiduría", /sabidur(?:í|i)a/i],
	["Isaías", /isa(?:í|i)as/i],
	["Jeremías", /jerem(?:í|i)as/i],
	["Ezequiel", /ezequiel/i],
	["Daniel", /daniel/i],
	["Baruc", /baruc/i],
	["Génesis", /g(?:é|e)nesis/i],
	["Éxodo", /(e|é)xodo/i],
	["Levítico", /lev(?:í|i)tico/i],
	["Números", /n(?:ú|u)meros/i],
	["Deuteronomio", /deuteronomio/i],
	["Josué", /jos(?:é|e)/i],
	["Jueces", /jueces/i],
	["Rut", /\brut\b/i],
	["Job", /\bjob\b/i],
	["Proverbios", /proverbios/i],
	["Eclesiastés", /eclesiast(?:é|e)s/i],
	["Cantar de los Cantares", /cantar de los cantares/i],
	["Lamentaciones", /lamentaciones/i],
	["Oseas", /oseas/i],
	["Joel", /\bjoel\b/i],
	["Amós", /am(?:ó|o)s/i],
	["Abdías", /abd(?:í|i)as/i],
	["Jonás", /jon(?:á|a)s/i],
	["Miqueas", /miqueas/i],
	["Nahúm", /nah(?:ú|u)m/i],
	["Habacuc", /habacuc/i],
	["Sofonías", /sofon(?:í|i)as/i],
	["Ageo", /ageo/i],
	["Zacarías", /zacar(?:í|i)as/i],
	["Malaquías", /malaqu(?:í|i)as/i],
	["Tobías", /tob(?:í|i)as/i],
	["Judit", /judit/i],
	["1 Macabeos", /macabeos/i],
	["Judas", /\bjudas\b/i],
	["Apocalipsis", /apocalipsis/i],
];

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
		saints: ["Nuestra Señora de los Dolores"],
		excerpt: "Y cuando el Señor la vio, se compadeció de ella, y le dijo: No llores.",
		excerptReference: "Lucas 7:13",
	},
	"2026-09-26": {
		book: "Lucas",
		citation: "9:43-45",
		celebration: "Santos Cosme y Damián, mártires (memoria)",
		saints: ["Santos Cosme y Damián"],
		excerpt: "Haced que os penetren bien en los oídos estas palabras; porque acontecerá que el Hijo del Hombre será entregado en manos de hombres.",
		excerptReference: "Lucas 9:44",
	},
	"2026-10-04": {
		book: "Mateo",
		citation: "21:33-46",
		celebration: "XXVII Domingo del Tiempo Ordinario",
		saints: ["San Francisco de Asís"],
		excerpt: "Por tanto os digo, que el reino de Dios será quitado de vosotros, y será dado a gente que produzca los frutos de él.",
		excerptReference: "Mateo 21:43",
	},
	"2026-10-12": {
		book: "Lucas",
		citation: "11:29-32",
		celebration: "Nuestra Señora del Pilar (memoria)",
		saints: ["Nuestra Señora del Pilar"],
		excerpt: "Y apiñándose las multitudes, comenzó a decir: Esta generación es mala; demanda señal, pero señal no le será dada, sino la señal de Jonás.",
		excerptReference: "Lucas 11:29",
	},
	"2026-10-15": {
		book: "Lucas",
		citation: "11:47-54",
		celebration: "Santa Teresa de Jesús, virgen y doctora de la Iglesia (memoria)",
		saints: ["Santa Teresa de Jesús"],
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

function extractNamedAnchorSection(html, startName, endName) {
	const startPattern = new RegExp(`<a\\s+name=["']${startName}["'][^>]*>`, "i");
	const startMatch = html.match(startPattern);
	if (!startMatch || startMatch.index === undefined) return null;

	const startIndex = startMatch.index;
	const endPattern = new RegExp(`<a\\s+name=["']${endName}["'][^>]*>`, "i");
	const endMatch = html.slice(startIndex + startMatch[0].length).match(endPattern);
	const endIndex = endMatch?.index === undefined
		? html.length
		: startIndex + startMatch[0].length + endMatch.index;

	return html.slice(startIndex, endIndex);
}

function getTextLines(html) {
	return stripHtml(html)
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
}

function resolveNumberedBook(prefix, basePattern, firstBook, secondBook, thirdBook = null) {
	if (!basePattern.test(prefix)) return null;
	if (/segunda|2(?:a|ª)?/i.test(prefix)) return secondBook;
	if (thirdBook && /tercera|3(?:a|ª)?/i.test(prefix)) return thirdBook;
	return firstBook;
}

function resolveReadingBook(prefix) {
	const numberedBooks = [
		resolveNumberedBook(prefix, /corint(?:io|ios|o)/i, "1 Corintios", "2 Corintios"),
		resolveNumberedBook(prefix, /tesal(?:ó|o)nica|tesalonicenses/i, "1 Tesalonicenses", "2 Tesalonicenses"),
		resolveNumberedBook(prefix, /timoteo/i, "1 Timoteo", "2 Timoteo"),
		resolveNumberedBook(prefix, /pedro/i, "1 Pedro", "2 Pedro"),
		resolveNumberedBook(prefix, /juan/i, "1 Juan", "2 Juan", "3 Juan"),
	].find(Boolean);
	if (numberedBooks) return numberedBooks;

	return READING_BOOK_ALIASES.find(([, pattern]) => pattern.test(prefix))?.[0] || null;
}

function parseReadingReferenceLine(line) {
	if (!/^Lectura\b/i.test(line)) return null;

	const citationMatch = line.match(/\s([0-9][0-9a-z ,.;:—–-]*)$/i);
	if (!citationMatch || citationMatch.index === undefined) return null;

	const prefix = line.slice(0, citationMatch.index).trim();
	const book = resolveReadingBook(prefix);
	if (!book) return null;

	const citation = citationMatch[1].trim();
	return { book, citation, ...normalizeCitation(book, citation) };
}

function parsePsalmReferenceLine(line) {
	const match = line.match(/^SALMO(?:\s+RESPONSORIAL)?\s+(.+)$/i);
	if (!match) return null;

	const rawReference = match[1].trim();
	const canticleMatch = rawReference.match(/^(LC|LUCAS)\s+(.+)$/i);
	const book = canticleMatch ? "Lucas" : "Salmos";
	const citation = canticleMatch?.[2] || rawReference;
	return { book, citation, ...normalizeCitation(book, citation) };
}

function titleBeforeLine(lines, index) {
	for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
		const candidate = lines[cursor].trim();
		if (!candidate || /^O bien:$/i.test(candidate)) continue;
		if (/^(?:LITURGIA|SALMO|EVANGELIO|\(Ver Ordinario)/i.test(candidate)) continue;
		return candidate;
	}
	return "";
}

function createReading({ type, order, referenceData, title, source }) {
	if (!referenceData || !title) return null;

	return {
		type,
		order,
		reference: referenceData.reference,
		passageId: referenceData.passageId,
		ranges: referenceData.ranges,
		title,
		excerpt: title,
		excerptReference: referenceData.reference,
		source: { ...source },
	};
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
			if (crossChapter && Number(crossChapter[2]) !== chapter) {
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
	const seasonMatch = plain.match(/(?:TIEMPO|TIEMPO LITÚRGICO)\s*[:\-]?\s*(Adviento|Navidad|Cuaresma|Pascua|Tiempo Ordinario)/i)?.[1]?.toLocaleLowerCase("es-CL");
	const season = seasonMatch === "tiempo ordinario" ? "ordinary" : seasonMatch;
	const color = plain.match(/COLOR LITÚRGICO\s*[:\-]?\s*(verde|blanco|rojo|violeta|rosa|negro|dorado)/i)?.[1]?.toLocaleLowerCase("es-CL");
	const colorMap = { verde: "green", blanco: "white", rojo: "red", violeta: "violet", rosa: "rose", negro: "black", dorado: "gold" };
	return { title, celebration, liturgicalSeason: season, liturgicalColor: colorMap[color] };
}

function parseEucaristiaGospel(html) {
	const section = extractNamedAnchorSection(html, "evangelio", "eucaristia");
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
	return createReading({
		type: "gospel",
		order: 4,
		referenceData: normalizeCitation(referenceMatch[1], referenceMatch[2]),
		title,
		source: {},
	});
}

function parseEucaristia(html, date) {
	const liturgySection = extractNamedAnchorSection(html, "liturgia", "evangelio");
	const gospelSection = extractNamedAnchorSection(html, "evangelio", "eucaristia");
	if (!liturgySection || !gospelSection) return null;

	const lines = getTextLines(liturgySection);
	const sourceInfo = extractSourceDate(html, date);
	const source = {
		provider: "Eucaristía Diaria / Conferencia Episcopal de Chile",
		url: `${PRIMARY_URL}${date}`,
		ordoUrl: ORDO_URL,
		pageTitle: sourceInfo.title,
		verified: true,
	};
	const celebrations = normalizeLiturgicalMetadata({ celebration: sourceInfo.celebration, source });
	const readingReferenceLines = lines
		.map((line, index) => ({ index, parsed: parseReadingReferenceLine(line) }))
		.filter((item) => item.parsed);
	const psalmItem = lines
		.map((line, index) => ({ index, parsed: parsePsalmReferenceLine(line) }))
		.find((item) => item.parsed);
	const firstItem = readingReferenceLines.find((item) => !psalmItem || item.index < psalmItem.index);
	const secondItem = readingReferenceLines.find((item) => psalmItem && item.index > psalmItem.index);
	const gospel = parseEucaristiaGospel(html);
	const gospelReading = gospel ? { ...gospel, source: { ...source } } : null;
	const readings = [
		createReading({
			type: "first-reading",
			order: 1,
			referenceData: firstItem?.parsed,
			title: firstItem ? titleBeforeLine(lines, firstItem.index) : "",
			source,
		}),
		createReading({
			type: "psalm",
			order: 2,
			referenceData: psalmItem?.parsed,
			title: psalmItem ? lines.slice(psalmItem.index + 1).find((line) => /^R\.\s*/i.test(line))?.replace(/^R\.\s*/i, "").trim() || "" : "",
			source,
		}),
		secondItem
			? createReading({
				type: "second-reading",
				order: 3,
				referenceData: secondItem.parsed,
				title: titleBeforeLine(lines, secondItem.index),
				source,
			})
			: null,
		gospelReading,
	].filter(Boolean);

	if (!readings.some((reading) => reading.type === "first-reading")
		|| !readings.some((reading) => reading.type === "psalm")
		|| !readings.some((reading) => reading.type === "gospel")) return null;

	return {
		date,
		calendar: "chile",
		liturgicalYear: date.slice(0, 4),
		celebration: sourceInfo.celebration,
		...(sourceInfo.liturgicalSeason ? { liturgicalSeason: sourceInfo.liturgicalSeason } : {}),
		...(sourceInfo.liturgicalColor ? { liturgicalColor: sourceInfo.liturgicalColor } : {}),
		...(celebrations.length > 0 ? { celebrations } : {}),
		readings,
		source,
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

function createLegacyGospelAlias(reading) {
	if (!reading) return null;

	return {
		reference: reading.reference,
		passageId: reading.passageId,
		ranges: Array.isArray(reading.ranges) ? reading.ranges.map((range) => ({ ...range })) : [],
		title: reading.title,
		excerpt: reading.excerpt,
		excerptReference: reading.excerptReference,
	};
}

function withLegacyGospelAlias(entry) {
	const gospelReading = entry?.readings?.find((reading) => reading?.type === "gospel");
	if (!gospelReading) return entry;

	return {
		...entry,
		gospel: createLegacyGospelAlias(gospelReading),
	};
}

function toGenericEntry(entry) {
	if (!entry) return null;
	if (Array.isArray(entry.readings)) return withLegacyGospelAlias(entry);
	if (!entry.gospel) return null;

	return withLegacyGospelAlias({
		...entry,
		readings: [{
			type: "gospel",
			order: 4,
			reference: entry.gospel.reference,
			passageId: entry.gospel.passageId,
			ranges: Array.isArray(entry.gospel.ranges)
				? entry.gospel.ranges.map((range) => ({ ...range }))
				: [],
			title: entry.gospel.title || entry.gospel.excerpt || "",
			excerpt: entry.gospel.excerpt || "",
			excerptReference: entry.gospel.excerptReference || entry.gospel.reference,
			source: entry.source ? { ...entry.source } : entry.source,
		}],
	});
}

async function request(url) {
	const response = await fetch(url, {
		headers: { "user-agent": "Rhemapp daily-reading-sync/1.0" },
	});
	if (!response.ok) return null;
	return response.text();
}

async function enrichReadingExcerptFromBibleApi(reading, apiKey) {
	if (!apiKey || !reading?.passageId) return reading;

	try {
		const response = await fetch(
			`${BIBLE_API_URL}${encodeURIComponent(reading.passageId)}?content-type=text&include-verse-numbers=false`,
			{ headers: { "api-key": apiKey } }
		);
		if (!response.ok) return reading;
		const payload = await response.json();
		const text = payload?.data?.content?.trim();
		if (!text) return reading;

		const sourceTitle = reading.title?.trim();
		const normalizedText = text.toLocaleLowerCase("es");
		const normalizedTitle = sourceTitle?.toLocaleLowerCase("es");
		const excerpt = normalizedTitle && normalizedText.includes(normalizedTitle)
			? sourceTitle
			: chooseExcerpt(text);

		return {
			...reading,
			excerpt,
			excerptReference: reading.reference,
			source: {
				...reading.source,
				bibleApiVerified: true,
				bibleApiVersion: BIBLE_ID,
			},
		};
	} catch {
		return reading;
	}
}

async function enrichExcerptFromBibleApi(entry) {
	const apiKey = process.env.BIBLE_API_KEY;
	if (!apiKey || !Array.isArray(entry?.readings)) return entry;

	const readings = await Promise.all(
		entry.readings.map((reading) => enrichReadingExcerptFromBibleApi(reading, apiKey)),
	);
	return withLegacyGospelAlias({ ...entry, readings });
}

function getOrdoCelebrationName(value) {
	return typeof value === "string"
		? value.replace(/\s*\((?:memoria opcional|memoria|fiesta|solemnidad|conmemoración)\)\s*$/iu, "").trim()
		: "";
}

function getOrdoCelebrationRank(value) {
	const normalized = typeof value === "string" ? value.toLocaleLowerCase("es-CL") : "";
	if (normalized.includes("solemnidad")) return "solemnity";
	if (normalized.includes("fiesta")) return "feast";
	if (normalized.includes("memoria opcional")) return "optional-memorial";
	if (normalized.includes("memoria")) return "memorial";
	if (normalized.includes("conmemoración")) return "commemoration";
	return "other";
}

function buildOrdoCelebration(override, source) {
	return {
		name: getOrdoCelebrationName(override.celebration),
		rank: getOrdoCelebrationRank(override.celebration),
		isPrimary: true,
		saints: [],
		source: { ...source },
	};
}

function applyOrdoOverride(entry, date) {
	const override = ORDO_GOSPEL_OVERRIDES[date];
	if (!entry) return entry;
	let enrichedEntry = entry;

	if (override && Array.isArray(entry.readings)) {
		const { reference, passageId, ranges } = normalizeCitation(override.book, override.citation);
		const source = {
			...entry.source,
			ordoUrl: ORDO_URL,
			ordoValidated: true,
		};
		const currentCelebration = typeof entry.celebration === "string" ? entry.celebration.trim() : "";
		const hasDateOnlyCelebration = /^\d{1,2}\s+de\s+[\p{L}]+(?:\s+de\s+\d{4})?$/iu.test(currentCelebration);
		enrichedEntry = withLegacyGospelAlias({
			...entry,
			celebration: !currentCelebration || hasDateOnlyCelebration ? override.celebration : entry.celebration,
			source,
			readings: entry.readings.map((reading) => reading.type !== "gospel"
				? reading
				: {
					...reading,
					reference,
					passageId,
					ranges,
					title: override.excerpt || reading.title,
					excerpt: override.excerpt || reading.excerpt,
					excerptReference: override.excerptReference || reference,
					source,
			}),
		});
		let celebrations = normalizeLiturgicalMetadata(enrichedEntry);
		if (celebrations.length === 0 && override.celebration) {
			celebrations = [buildOrdoCelebration(override, source)];
		}
		const celebrationsWithSaints = override.saints?.length > 0
			? celebrations.map((celebration, index) => index === 0
				? {
					...celebration,
					saints: override.saints.map((name) => {
						const informationSource = getSaintInformationSource(date, name);
						return {
							name,
							source: {
								provider: "Ordo de la Conferencia Episcopal de Chile",
								url: ORDO_URL,
								verified: true,
							},
							...(informationSource ? { informationSource } : {}),
						};
					}),
				}
				: celebration)
			: celebrations;
		enrichedEntry = celebrationsWithSaints.length > 0
			? { ...enrichedEntry, celebrations: celebrationsWithSaints }
			: enrichedEntry;
	}

	return applySupplementalSaintsOverride(enrichedEntry, date);
}

async function fetchEntry(date) {
	const primaryHtml = await request(`${PRIMARY_URL}${date}`);
	const primaryEntry = primaryHtml ? parseEucaristia(primaryHtml, date) : null;
	if (primaryEntry?.readings?.length) {
		return enrichExcerptFromBibleApi(applyOrdoOverride(toGenericEntry(primaryEntry), date));
	}

	const spanishFallbackHtml = await request(`${SPANISH_FALLBACK_URL}${date}`);
	const spanishFallbackEntry = spanishFallbackHtml ? parseAudioBiblia(spanishFallbackHtml, date) : null;
	if (spanishFallbackEntry?.gospel?.excerpt) {
		return enrichExcerptFromBibleApi(applyOrdoOverride(toGenericEntry(spanishFallbackEntry), date));
	}

	const fallbackHtml = await request(`${FALLBACK_URL}${date}`);
	const fallbackEntry = fallbackHtml ? parseEwtn(fallbackHtml, date) : null;
	return fallbackEntry
		? enrichExcerptFromBibleApi(applyOrdoOverride(toGenericEntry(fallbackEntry), date))
		: null;
}

function dateRange(start, end) {
	const dates = [];
	for (let cursor = new Date(`${start}T12:00:00Z`); cursor <= new Date(`${end}T12:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
		dates.push(cursor.toISOString().slice(0, 10));
	}
	return dates;
}

function replaceJsonAtomically(filePath, content) {
	const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
	fs.writeFileSync(temporaryPath, content, "utf8");

	try {
		if (process.platform !== "win32" || !fs.existsSync(filePath)) {
			fs.renameSync(temporaryPath, filePath);
			return;
		}

		const backupPath = `${filePath}.bak-${process.pid}-${Date.now()}`;
		fs.renameSync(filePath, backupPath);
		try {
			fs.renameSync(temporaryPath, filePath);
			fs.rmSync(backupPath, { force: true });
		} catch (error) {
			if (!fs.existsSync(filePath) && fs.existsSync(backupPath)) fs.renameSync(backupPath, filePath);
			throw error;
		}
	} catch (error) {
		if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
		throw error;
	}
}

const args = parseArgs();
const start = args.start || process.env.DAILY_SYNC_START || "2026-09-10";
const end = args.end || process.env.DAILY_SYNC_END || "2026-12-31";
const dryRun = Boolean(args["dry-run"]);
const runStartedAt = new Date().toISOString();
const year = start.slice(0, 4);
const outputPath = path.join(DAILY_DIR, `${year}.json`);
const existing = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath, "utf8")) : { calendar: "chile", year: Number(year), liturgicalYear: year, entries: [] };
let syncAttempts = { ...(existing.syncState?.attempts || {}) };
let runHadFailure = false;
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
	const previousEntry = entriesByDate.get(date);
	const attemptedAt = new Date().toISOString();
	try {
		const entry = await fetchEntry(date);
		if (entry) {
			const merged = mergeValidatedReading(previousEntry, entry);
			if (!merged.updated) {
				throw new Error(`${date}: la publicación se descartó porque está incompleta o es inválida: ${merged.errors.join(" | ")}`);
			}
			const nextEntry = markReadingFresh(
				preserveLiturgicalMetadata(previousEntry, preserveSupplementalSaints(previousEntry, merged.entry)),
				attemptedAt,
			);
			entriesByDate.set(date, nextEntry);
			syncAttempts = recordSyncAttempt(syncAttempts, date, {
			status: "published",
			attemptedAt,
			source: nextEntry.source,
		});
			const readingTypes = nextEntry.readings.map((reading) => reading.type).join(" → ");
			console.log(`${date}: ${nextEntry.gospel.reference} (${readingTypes}, ${nextEntry.source.provider})`);
		} else {
			throw new Error(`${date}: sin publicación disponible`);
		}
	} catch (error) {
		runHadFailure = true;
		if (previousEntry) {
			const staleEntry = markReadingStale(previousEntry, error, attemptedAt);
			entriesByDate.set(date, staleEntry);
			syncAttempts = recordSyncAttempt(syncAttempts, date, {
				status: "stale",
				attemptedAt,
				source: staleEntry.source,
				error: error?.message || "La fuente no devolvió una lectura válida",
			});
		} else {
			syncAttempts = recordSyncAttempt(syncAttempts, date, {
				status: "unavailable",
				attemptedAt,
				source: { provider: "Eucaristía Diaria / Conferencia Episcopal de Chile", url: `${PRIMARY_URL}${date}` },
				error: error?.message || "La fuente no devolvió una lectura válida",
			});
		}
		console.warn(`${date}: ${error.message}`);
	}
}

const entries = [...entriesByDate.values()].sort((left, right) => left.date.localeCompare(right.date));
const previousEntries = JSON.stringify(existing.entries || []);
const nextEntries = JSON.stringify(entries);
const syncedAt = previousEntries === nextEntries && existing.syncedAt
	? existing.syncedAt
	: new Date().toISOString();
const candidateDocument = {
	...existing,
	calendar: "chile",
	year: Number(year),
	liturgicalYear: year,
	syncedAt,
	syncState: {
		lastAttemptAt: runStartedAt,
		status: runHadFailure ? "partial" : "success",
		attempts: syncAttempts,
	},
	entries,
};
const datasetValidation = validateDailyDataset(candidateDocument, { year });
if (!datasetValidation.valid) {
	console.error("La sincronización se detuvo porque el documento candidato no es válido:");
	console.error(datasetValidation.errors.join("\n"));
	process.exit(1);
}

fs.mkdirSync(DAILY_DIR, { recursive: true });
const nextDocument = `${JSON.stringify(candidateDocument, null, 2)}\n`;

if (dryRun) {
	console.log(`Simulación completada: ${entries.length} entradas calculadas para ${outputPath}`);
} else if (previousEntries === nextEntries && JSON.stringify(existing.syncState || {}) === JSON.stringify(candidateDocument.syncState)) {
	console.log(`Sin cambios: ${entries.length} entradas válidas en ${outputPath}`);
} else {
	replaceJsonAtomically(outputPath, nextDocument);
	console.log(`Guardadas atómicamente ${entries.length} entradas en ${outputPath}`);
}
