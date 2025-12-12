import VerseCard from "@/components/VerseCard.jsx";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

function formatDate(date) {
	const options = { day: "2-digit", month: "long", year: "numeric" };
	return date.toLocaleDateString("es-ES", options);
}

function getCurrentDateKey(date) {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
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
	if (!data || !Array.isArray(data.verses) || !Array.isArray(data.dailyVerses)) {
		throw new Error("El formato del archivo de versículos es incorrecto");
	}

	return data;
}

export default async function DailyVersePage() {
	let verse = null;
	let error = null;
	const now = new Date();
	const currentDate = formatDate(now);
	const todayKey = getCurrentDateKey(now);
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

	if (error || !verse) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
				<h1 className="text-2xl font-semibold text-red-600 mb-4">
					Error al cargar el versículo
				</h1>
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
					{error || "No se pudo cargar el versículo del día"}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<div className="mb-8 text-center">
				<CalendarIcon className="w-14 h-14 mx-auto mb-4 text-[#314156] dark:text-gray-100 transition-colors duration-300" />
				<h1 className="text-3xl font-bold text-[#314156] dark:text-gray-100 mb-2 transition-colors duration-300">
					Lectura del Día
				</h1>
				<p className="text-xl text-[#b79b72] mb-2 font-semibold transition-colors duration-300">
					{currentDate}
				</p>
				{/* SEO: texto estable para que el HTML inicial describa la finalidad de la página. */}
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-left max-w-2xl mx-auto">
					Lee el versículo bíblico del día para meditar la Palabra de Dios. Cada fecha
					presenta una lectura breve y accesible, con opción de ver el pasaje completo.
				</p>
			</div>

			<VerseCard
				verse={verse.verse || ""}
				reference={verse.reference || ""}
				verseId={verse.verseId || ""}
				chapterId={verse.chapterId || ""}
				showNavigation={false}
			/>

			{verse.isRandom && (
				<div className="mt-4 text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300">
					<p>
						No hay un versículo específico para hoy, mostrando uno seleccionado por fecha.
					</p>
				</div>
			)}
		</div>
	);
}
