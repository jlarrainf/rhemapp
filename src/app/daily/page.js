import { getSiteUrl } from "@/lib/siteUrl";
import {
	DAILY_TIME_ZONE,
	formatDailyDate,
	getDailyReading,
	getDateKeyInTimeZone,
} from "@/lib/dailyReading";
import DailyVerseClient from "./DailyVerseClient";

export const dynamic = "force-dynamic";

export default function DailyVersePage() {
	const now = new Date();
	const todayKey = getDateKeyInTimeZone(now, DAILY_TIME_ZONE);
	const currentDate = formatDailyDate(now, DAILY_TIME_ZONE);
	const siteUrl = getSiteUrl();
	let reading = null;
	let error = null;

	try {
		reading = getDailyReading({ date: now, timeZone: DAILY_TIME_ZONE });
	} catch (cause) {
		console.error("Error al cargar el evangelio diario:", cause);
		error = cause?.message || "No se pudo cargar el evangelio del día";
	}

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${siteUrl}/daily/#webpage`,
		url: `${siteUrl}/daily`,
		name: "Evangelio del día | Rhemapp",
		description:
			"Lee el Evangelio del día según el calendario litúrgico de Chile y medita la Palabra de Dios.",
		isPartOf: { "@id": `${siteUrl}/#website` },
		inLanguage: "es",
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
			/>
			<DailyVerseClient
				initialReading={reading}
				initialError={error}
				initialDateKey={reading?.dateKey || todayKey}
				initialDateLabel={currentDate}
				initialNextChangeAt={reading?.nextChangeAt || null}
			/>
		</>
	);
}
