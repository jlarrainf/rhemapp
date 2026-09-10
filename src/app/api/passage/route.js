// API endpoint para obtener un pasaje completo de la Biblia
import { NextResponse } from "next/server";

export async function GET(request) {
	try {
		// Obtener los parámetros de la URL
		const { searchParams } = new URL(request.url);
		const bibleId = searchParams.get("bibleId") || "b32b9d1b64b4ef29-01"; // Versión en español por defecto (Reina-Valera 1960) b32b9d1b64b4ef29-01
		const passageId = searchParams.get("passageId");
		const verseRange = searchParams.get("verseRange"); // Nuevo parámetro para rango de versículos (Ej: "6-14")
		const requestedReference = searchParams.get("reference");
		let structuredRanges = null;
		const rangesParam = searchParams.get("ranges");
		if (rangesParam) {
			try {
				const parsedRanges = JSON.parse(rangesParam);
				if (Array.isArray(parsedRanges) && parsedRanges.length > 0) {
					structuredRanges = parsedRanges.filter(
						(range) => Number.isInteger(Number(range.chapter)) && Number.isInteger(Number(range.start))
					);
				}
			} catch {
				return NextResponse.json({ error: "Los rangos del pasaje no son válidos" }, { status: 400 });
			}
		}

		if (!passageId) {
			return NextResponse.json(
				{ error: "El ID del pasaje es requerido" },
				{ status: 400 }
			);
		}

		// Realizar la petición a la API de Bible
		// Intentamos obtener la API key de las variables de entorno, en dos posibles ubicaciones
		const apiKey =
			process.env.BIBLE_API_KEY || process.env.NEXT_PUBLIC_BIBLE_API_KEY;

		if (!apiKey) {
			console.error("No se encontró la API key para la Bible API");
			return NextResponse.json(
				{ error: "Configuración de API incompleta" },
				{ status: 500 }
			);
		}

		let apiUrl;
		let data;

		// Los rangos estructurados permiten resolver listas discontinuas y cambios de capítulo.
		if (structuredRanges) {
			const bookCode = passageId.split(".")[0];
			const chapters = [
				...new Set(
					structuredRanges.flatMap((range) => {
						const firstChapter = Number(range.chapter);
						const lastChapter = Number(range.endChapter || firstChapter);
						return Array.from({ length: lastChapter - firstChapter + 1 }, (_, index) => firstChapter + index);
					})
				),
			];
			const chapterResponses = await Promise.all(
				chapters.map(async (chapter) => {
					const response = await fetch(
						`https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${bookCode}.${chapter}/verses`,
						{ headers: { "api-key": apiKey } }
					);
					if (!response.ok) throw new Error(`No se pudo obtener el capítulo ${chapter}`);
					return response.json();
				})
			);

			const selectedVerses = chapterResponses
				.flatMap((chapterData) => chapterData.data || [])
				.filter((verse) => {
					const parts = verse.id.split(".");
					const chapter = Number(parts.at(-2));
					const verseNumber = Number.parseInt(parts.at(-1), 10);
					return structuredRanges.some((range) => {
						const firstChapter = Number(range.chapter);
						const lastChapter = Number(range.endChapter || firstChapter);
						if (chapter < firstChapter || chapter > lastChapter) return false;
						const firstVerse = chapter === firstChapter ? Number(range.start) : 1;
						const lastVerse = chapter === lastChapter ? Number(range.end || range.start) : Number.MAX_SAFE_INTEGER;
						return verseNumber >= firstVerse && verseNumber <= lastVerse;
					});
				})
				.sort((left, right) => {
					const leftParts = left.id.split(".").map(Number);
					const rightParts = right.id.split(".").map(Number);
					return leftParts.at(-2) - rightParts.at(-2) || leftParts.at(-1) - rightParts.at(-1);
				});

			const uniqueVerses = [...new Map(selectedVerses.map((verse) => [verse.id, verse])).values()];
			const versesContents = await Promise.all(
				uniqueVerses.map(async (verse) => {
					const response = await fetch(
						`https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${verse.id}`,
						{ headers: { "api-key": apiKey } }
					);
					if (!response.ok) throw new Error(`No se pudo obtener el versículo ${verse.id}`);
					return response.json();
				})
			);

			data = {
				data: {
					content: versesContents
						.map((verseData) => {
							const verseId = verseData.data.id;
							const verseNumber = verseId.split(".").pop();
							const verseContent = verseData.data.content.replace(/<\/?[^>]+(>|$)/g, "").replace(/^\d+\s*/, "");
							return `<div class="verse"><span class="verse-number"><sup>${verseNumber}</sup></span> ${verseContent}</div>`;
						})
						.join(""),
					reference: requestedReference || passageId,
					copyright: versesContents[0]?.data.copyright || "",
				},
			};
		} else if (!verseRange) {
			apiUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}`;

			const response = await fetch(apiUrl, {
				headers: {
					"api-key": apiKey,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				return NextResponse.json(
					{
						error: "Error al obtener el pasaje desde la API de Bible",
						details: errorData,
					},
					{ status: response.status }
				);
			}

			data = await response.json();
		} else {
			// Obtener los versículos específicos del capítulo
			// Primero obtenemos todos los versículos del capítulo
			apiUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/chapters/${passageId}/verses`;

			const response = await fetch(apiUrl, {
				headers: {
					"api-key": apiKey,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				return NextResponse.json(
					{
						error: "Error al obtener los versículos del capítulo",
						details: errorData,
					},
					{ status: response.status }
				);
			}

			const versesData = await response.json();

			// Procesar el rango de versículos
			const [start, end] = verseRange.split("-").map((v) => parseInt(v, 10));
			const filteredVerses = versesData.data.filter((verse) => {
				// Extraer el número de versículo de la referencia
				const verseNumber = parseInt(verse.id.split(".").pop(), 10);
				return verseNumber >= start && verseNumber <= end;
			});

			// Obtener el contenido de cada versículo filtrado
			const versesPromises = filteredVerses.map((verse) =>
				fetch(
					`https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${verse.id}`,
					{
						headers: { "api-key": apiKey },
					}
				).then((res) => res.json())
			);

			const versesContents = await Promise.all(versesPromises);

			// Preparar los datos para procesamiento similar al pasaje completo
			const versesHtml = versesContents
				.map((verseData) => {
					// Extraer número de versículo
					const verseId = verseData.data.id;
					const verseNumber = verseId.split(".").pop();

					// Limpiar el HTML del contenido
					let verseContent = verseData.data.content.replace(
						/<\/?[^>]+(>|$)/g,
						""
					);

					// Eliminar números al inicio del versículo si existen
					verseContent = verseContent.replace(/^\d+\s*/, "");

					// Crear el HTML del versículo
					return `<div class="verse"><span class="verse-number"><sup>${verseNumber}</sup></span> ${verseContent}</div>`;
				})
				.join("");

			// Crear una estructura similar a la que devuelve el endpoint de passages
			data = {
				data: {
					content: versesHtml,
					reference: `${
						versesData.data[0].reference.split(":")[0]
					}:${start}-${end}`,
					copyright: versesContents[0]?.data.copyright || "",
				},
			};
		}

		// Procesar el contenido para formatear los números de versículo si es un pasaje completo
		let content = data.data.content;

		// Si es pasaje completo y no versículos individuales ya formateados
		if (!verseRange && !structuredRanges) {
			// Eliminar etiquetas HTML que puedan venir de la API
			content = content.replace(/<\/?[^>]+(>|$)/g, "");

			// Dividir por números de versículo para procesarlos individualmente
			const versePattern = /(\d+)([A-Za-záéíóúüñÁÉÍÓÚÜÑ])/g;
			let matches = [...content.matchAll(versePattern)];

			if (matches.length > 0) {
				// Estructura para guardar los versículos procesados
				const verses = [];
				let lastIndex = 0;

				// Procesar cada coincidencia
				matches.forEach((match, index) => {
					const verseNum = match[1];
					const verseStartChar = match[2];
					const matchIndex = match.index;

					// Si es el primer versículo y hay texto antes, añadirlo como introducción
					if (index === 0 && matchIndex > 0) {
						const intro = content.substring(0, matchIndex).trim();
						if (intro) verses.push(intro);
					}

					// Encontrar dónde termina este versículo (inicio del siguiente o fin del texto)
					const nextMatchIndex =
						index < matches.length - 1
							? matches[index + 1].index
							: content.length;

					// Extraer el texto del versículo (sin el número)
					const verseText =
						verseStartChar +
						content
							.substring(matchIndex + verseNum.length + 1, nextMatchIndex)
							.trim();

					// Crear el HTML del versículo con el número como superíndice y estilo visual similar a LaTeX
					verses.push(
						`<div class="verse"><span class="verse-number"><sup>${verseNum}</sup></span> ${verseText}</div>`
					);

					lastIndex = nextMatchIndex;
				});

				// Si hay texto después del último versículo, añadirlo
				if (lastIndex < content.length) {
					const remainingText = content.substring(lastIndex).trim();
					if (remainingText) verses.push(`<div>${remainingText}</div>`);
				}

				// Unir todos los versículos en un solo HTML
				content = verses.join("");
			}
		}

		// Envolver el contenido en un div con estilos para el formato
		content = `
			<div class="passage-content">
				<style>
					.passage-content {
						font-family: inherit;
						line-height: 1.8;
						text-align: left;
					}
					.verse {
						margin-bottom: 1rem;
					}
					.verse-number {
						font-weight: bold;
						color: #666;
						padding: 0 0.25rem;
					}
				</style>
				${content}
			</div>
		`;

		// Formateamos la respuesta para nuestra aplicación
		const response = NextResponse.json({
			content: content,
			reference: data.data.reference,
			copyright: data.data.copyright || "",
		});
		// SEO: evitar que motores indexen endpoints JSON.
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
		return response;
	} catch (error) {
		console.error("Error al procesar la petición:", error);
		return NextResponse.json(
			{
				error: "Error al procesar la petición",
				message: error.message,
			},
			{ status: 500 }
		);
	}
}
