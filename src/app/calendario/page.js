import { getSiteUrl } from "@/lib/siteUrl";
import {
	DAILY_TIME_ZONE,
	ReadingRequestError,
	getMonthKeyInTimeZone,
} from "@/lib/dailyReading";
import { getLiturgicalCalendarMonth } from "@/lib/liturgicalCalendar";
import CalendarClient from "./CalendarClient";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Calendario litúrgico | Rhemapp",
	description: "Consulta el calendario litúrgico chileno y abre las lecturas publicadas de cada día.",
};

function getQueryValue(value, name) {
	if (Array.isArray(value)) {
		if (value.length !== 1) throw new ReadingRequestError(`El parámetro ${name} solo puede aparecer una vez`);
		return value[0];
	}
	return value;
}

export default async function LiturgicalCalendarPage({ searchParams }) {
	const now = new Date();
	const currentMonth = getMonthKeyInTimeZone(now, DAILY_TIME_ZONE);
	const query = await searchParams;
	let monthKey = currentMonth;
	let calendar = "chile";
	let calendarData = null;
	let error = null;

	try {
		monthKey = getQueryValue(query?.month, "month") || currentMonth;
		calendar = getQueryValue(query?.calendar, "calendar") || "chile";
		calendarData = await getLiturgicalCalendarMonth({ monthKey, calendar });
	} catch (cause) {
		if (!(cause instanceof ReadingRequestError)) console.error("Error al cargar el calendario litúrgico:", cause);
		error = cause?.message || "No se pudo cargar el calendario litúrgico";
	}

	const siteUrl = getSiteUrl();
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"@id": `${siteUrl}/calendario/#webpage`,
		url: `${siteUrl}/calendario`,
		name: "Calendario litúrgico | Rhemapp",
		description: "Calendario litúrgico chileno con enlaces a las lecturas publicadas.",
		inLanguage: "es",
	};

	return (
		<>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
			<CalendarClient
				initialCalendar={calendarData}
				initialError={error}
				initialMonthKey={monthKey}
				currentMonth={currentMonth}
			/>
		</>
	);
}
