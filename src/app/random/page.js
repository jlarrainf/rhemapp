import RandomVerseClient from "./RandomVerseClient";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { getSiteUrl } from "@/lib/siteUrl";

export default function RandomVersePage() {
	const siteUrl = getSiteUrl();
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${siteUrl}/random/#webpage`,
		url: `${siteUrl}/random`,
		name: "Versículo aleatorio | Rhemapp",
		description:
			"Descubre versículos bíblicos de forma aleatoria para meditar y volver a la Palabra de Dios.",
		isPartOf: { "@id": `${siteUrl}/#website` },
		inLanguage: "es",
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			{/* SEO: datos estructurados específicos de la página (contenido estable). */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>

			<div className="mb-8 text-center max-w-2xl">
				<BookOpenIcon className="w-14 h-14 mx-auto mb-4 text-[#314156] dark:text-gray-100 transition-colors duration-300" />
				<h1 className="text-3xl font-bold text-[#314156] dark:text-gray-100 mb-2 transition-colors duration-300">
					Versículo Aleatorio
				</h1>
				{/* SEO: descripción fija y estable en el HTML inicial (la parte aleatoria queda debajo). */}
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center">
					Descubre versículos bíblicos de forma aleatoria para meditar y volver
					a la Palabra de Dios. Puedes navegar entre versículos y consultar el
					pasaje completo.
				</p>
			</div>

			<RandomVerseClient />
		</div>
	);
}
