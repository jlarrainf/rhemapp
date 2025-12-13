import { getSiteUrl } from "@/lib/siteUrl";
import DailyVerseClient from "./DailyVerseClient";

export const dynamic = "force-dynamic";

const DAILY_TIME_ZONE = "America/Santiago";

function formatDateInTimeZone(date, timeZone) {
	const options = { day: "2-digit", month: "long", year: "numeric", timeZone };
	return date.toLocaleDateString("es-ES", options);
}

function getDateKeyInTimeZone(date, timeZone) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const month = parts.find((p) => p.type === "month")?.value || "01";
	const day = parts.find((p) => p.type === "day")?.value || "01";
	return `${month}-${day}`;
}

function stableIndex(seed, modulo) {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
	}
	return modulo > 0 ? hash % modulo : 0;
}

async function loadVersesJson() {
	const siteUrl = getSiteUrl();
	const url = new URL("/data/verses.json", siteUrl).toString();

	// SEO/SSR: cargamos el JSON en servidor para que el versículo esté en el HTML inicial.
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok) {
		throw new Error("No se pudo cargar el archivo de versículos");
	}

	const data = await response.json();
	if (
		!data ||
		!Array.isArray(data.verses) ||
		!Array.isArray(data.dailyVerses)
	) {
		throw new Error("El formato del archivo de versículos es incorrecto");
	}

	return data;
}

export default async function DailyVersePage() {
	let verse = null;
	let error = null;
	const now = new Date();
	// SSR: usamos Chile como base estable. El cliente se sincroniza con el dispositivo tras hidratar.
	const currentDate = formatDateInTimeZone(now, DAILY_TIME_ZONE);
	const todayKey = getDateKeyInTimeZone(now, DAILY_TIME_ZONE);
	const siteUrl = getSiteUrl();
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${siteUrl}/daily/#webpage`,
		url: `${siteUrl}/daily`,
		name: "Lectura del día | Rhemapp",
		description:
			"Lee el versículo bíblico del día y medita la Palabra de Dios con una lectura breve y accesible.",
		isPartOf: { "@id": `${siteUrl}/#website` },
		inLanguage: "es",
	};

	try {
		const data = await loadVersesJson();

		let todayVerse = data.dailyVerses.find((item) => item?.date === todayKey);

		// Si no hay un versículo específico para hoy, elegimos un fallback estable por día
		// (evita contenido totalmente volátil por request y mejora consistencia SEO).
		if (!todayVerse && data.verses.length > 0) {
			const idx = stableIndex(todayKey, data.verses.length);
			todayVerse = {
				...(data.verses[idx] || {}),
				isRandom: true,
			};
		}

		if (!todayVerse || !todayVerse.verse || !todayVerse.reference) {
			throw new Error("No se pudo obtener un versículo válido para hoy");
		}

		verse = todayVerse;
	} catch (e) {
		console.error("Error al cargar el versículo diario:", e);
		error = e?.message || "Error desconocido al cargar el versículo";
	}

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<DailyVerseClient
				initialVerse={verse}
				initialError={error}
				initialDateKey={todayKey}
				initialDateLabel={currentDate}
			/>
		</>
	);
}
