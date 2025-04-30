// API endpoint para obtener un pasaje completo de la Biblia
import { NextResponse } from "next/server";

export async function GET(request) {
	try {
		// Obtener los parámetros de la URL
		const { searchParams } = new URL(request.url);
		const bibleId = searchParams.get("bibleId") || "592420522e16049f-01"; // Versión en español por defecto (Reina-Valera 1960)
		const passageId = searchParams.get("passageId");

		if (!passageId) {
			return NextResponse.json(
				{ error: "El ID del pasaje es requerido" },
				{ status: 400 }
			);
		}

		// Realizar la petición a la API de Bible
		const apiKey = process.env.NEXT_PUBLIC_BIBLE_API_KEY;
		const apiUrl = `https://api.scripture.api.bible/v1/bibles/${bibleId}/passages/${passageId}`;

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

		const data = await response.json();

		// Procesar el contenido para formatear los números de versículo
		let content = data.data.content;

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
		}

		// Formateamos la respuesta para nuestra aplicación
		return NextResponse.json({
			content: content,
			reference: data.data.reference,
			copyright: data.data.copyright,
		});
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
