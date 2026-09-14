import { getSiteUrl } from "@/lib/siteUrl";
import {
	DAILY_TIME_ZONE,
	ReadingRequestError,
	ReadingUnavailableError,
	formatDailyDate,
	formatDateKey,
	getDateKeyInTimeZone,
} from "@/lib/dailyReading";
import { getPublishedReadingWithOverrides } from "@/lib/editorial/publishedReadings";
import DailyVerseClient from "./DailyVerseClient";
import { NOTIFICATION_READING_TYPES } from "@/lib/mobile/constants";

export const dynamic = "force-dynamic";

function getQueryValue(value, name) {
	if (Array.isArray(value)) {
		if (value.length !== 1) throw new ReadingRequestError(`El parámetro ${name} solo puede aparecer una vez`);
		return value[0];
	}
	return value;
}

export default async function DailyVersePage({ searchParams }) {
	const now = new Date();
	const todayKey = getDateKeyInTimeZone(now, DAILY_TIME_ZONE);
	const currentDate = formatDailyDate(now, DAILY_TIME_ZONE);
	const siteUrl = getSiteUrl();
	const query = await searchParams;
	let requestedDateKey;
	let requestedMode;
	let requestedReadingType;
	let reading = null;
	let error = null;
	let initialMode = "today";

	try {
		requestedDateKey = getQueryValue(query?.date, "date");
		requestedMode = getQueryValue(query?.mode, "mode");
		requestedReadingType = getQueryValue(query?.reading, "reading");
		if (requestedDateKey !== undefined && requestedMode !== undefined) {
			throw new ReadingRequestError("No se pueden combinar date y mode");
		}
		if (requestedReadingType !== undefined && !NOTIFICATION_READING_TYPES.includes(requestedReadingType)) {
			throw new ReadingRequestError("El tipo de lectura seleccionado no es válido");
		}
		initialMode = requestedDateKey ? "date" : requestedMode || "today";
		if (requestedDateKey !== undefined) {
			reading = await getPublishedReadingWithOverrides({
				dateKey: requestedDateKey,
				mode: "date",
				now,
				timeZone: DAILY_TIME_ZONE,
			});
		} else {
			const mode = requestedMode || "today";
			if (!["today", "sunday"].includes(mode)) {
				throw new ReadingRequestError("El modo de lectura seleccionado no es válido");
			}
			reading = await getPublishedReadingWithOverrides({ mode, now, timeZone: DAILY_TIME_ZONE });
		}
		initialMode = reading.mode;
	} catch (cause) {
		if (!(cause instanceof ReadingRequestError) && !(cause instanceof ReadingUnavailableError)) {
			console.error("Error al cargar las lecturas diarias:", cause);
		}
		error = cause?.message || "No se pudieron cargar las lecturas del día";
	}

	const fallbackDateLabel = requestedDateKey && /^\d{4}-\d{2}-\d{2}$/.test(requestedDateKey)
		? (() => {
			try {
				return formatDateKey(requestedDateKey);
			} catch {
				return currentDate;
			}
		})()
		: currentDate;
	const initialInputDateKey = reading?.dateKey
		|| (requestedDateKey && /^\d{4}-\d{2}-\d{2}$/.test(requestedDateKey) ? requestedDateKey : todayKey);

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "WebPage",
		"@id": `${siteUrl}/daily/#webpage`,
		url: `${siteUrl}/daily`,
		name: "Lecturas del día | Rhemapp",
		description:
			"Lee las lecturas del día según el calendario litúrgico de Chile y medita la Palabra de Dios.",
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
				initialDateKey={initialInputDateKey}
				initialDateLabel={reading?.dateLabel || fallbackDateLabel}
				initialNextChangeAt={reading?.nextChangeAt || null}
				initialMode={initialMode}
				initialReadingType={requestedReadingType || null}
			/>
		</>
	);
}
