import RosarioClient from "./RosarioClient";
import { buildRosaryByDayIndex, DAYS } from "@/lib/rosary";
import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export default function RosarioPage() {
	const initialDayIndex = new Date().getDay();
	const byDayIndex = buildRosaryByDayIndex();
	const siteUrl = getSiteUrl();
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${siteUrl}/rosario/#webpage`,
		url: `${siteUrl}/rosario`,
		name: "Misterios del Rosario | Rhemapp",
		description:
			"Medita los misterios del rosario correspondientes a cada día de la semana con su cita bíblica y versículo.",
		isPartOf: { "@id": `${siteUrl}/#website` },
		inLanguage: "es",
	};

	// SEO/SSR: el contenido inicial se calcula en servidor y se pasa como props.
	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<RosarioClient
				days={DAYS}
				byDayIndex={byDayIndex}
				initialDayIndex={initialDayIndex}
			/>
		</>
	);
}
