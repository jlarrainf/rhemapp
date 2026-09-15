import {
	DAILY_TIME_ZONE,
	MIN_CALENDAR_MONTH,
	formatDateKey,
	getCalendarMonthDateKeys,
	getCalendarMonthLabel,
	isValidMonthKey,
} from "./liturgicalSchedule.js";
import { getCurrentPublishedEntry } from "./editorial/publishedReadings.js";
import { validatePublishedEntry } from "./readings/validatePublishedEntry.js";
import {
	getPrimaryCelebration,
	normalizeLiturgicalMetadata,
	toPublicSource,
} from "./readings/liturgicalMetadata.js";

export class CalendarRequestError extends Error {
	constructor(message) {
		super(message);
		this.name = "CalendarRequestError";
		this.status = 400;
	}
}

export function parseCalendarRequest(searchParams) {
	const monthValues = searchParams.getAll("month");
	const calendarValues = searchParams.getAll("calendar");
	if (monthValues.length > 1 || calendarValues.length > 1) {
		throw new CalendarRequestError("Cada parámetro solo puede aparecer una vez");
	}
	const monthKey = monthValues[0];
	if (!monthKey) throw new CalendarRequestError("El parámetro month es obligatorio y debe usar YYYY-MM");
	return { monthKey, calendar: calendarValues[0] || "chile" };
}

function emptyCalendarDay(dateKey) {
	return {
		date: dateKey,
		label: formatDateKey(dateKey),
		primaryCelebration: null,
		celebrationRank: null,
		saints: [],
		liturgicalColor: null,
		available: false,
		source: null,
	};
}

function getSaintNames(celebrations) {
	const names = [];
	const seen = new Set();
	for (const celebration of celebrations) {
		for (const saint of celebration.saints || []) {
			const key = saint.name.trim().toLocaleLowerCase("es-CL");
			if (!key || seen.has(key)) continue;
			seen.add(key);
			names.push(saint.name.trim());
		}
	}
	return names;
}

function toCalendarDay(dateKey, entry) {
	const baseDay = emptyCalendarDay(dateKey);
	const validation = validatePublishedEntry(entry);
	if (!validation.valid) return baseDay;

	const celebrations = normalizeLiturgicalMetadata(entry);
	const primary = getPrimaryCelebration({ ...entry, celebrations });
	return {
		...baseDay,
		primaryCelebration: primary?.name || null,
		celebrationRank: primary?.rank || null,
		saints: getSaintNames(celebrations),
		liturgicalColor: entry.liturgicalColor || null,
		available: true,
		source: toPublicSource(entry.source),
	};
}

export function assertValidCalendarMonth(monthKey) {
	if (!isValidMonthKey(monthKey)) {
		throw new CalendarRequestError("El mes debe usar el formato YYYY-MM y ser válido");
	}
	if (monthKey < MIN_CALENDAR_MONTH) {
		throw new CalendarRequestError(`No se pueden consultar meses anteriores a ${MIN_CALENDAR_MONTH}`);
	}
	return monthKey;
}

export async function getLiturgicalCalendarMonth({ monthKey, calendar = "chile" } = {}) {
	if (calendar !== "chile") throw new CalendarRequestError("El calendario solicitado no está disponible; usa chile");
	assertValidCalendarMonth(monthKey);

	const days = await Promise.all(getCalendarMonthDateKeys(monthKey).map(async (dateKey) => {
		try {
			const entry = await getCurrentPublishedEntry(dateKey);
			return toCalendarDay(dateKey, entry);
		} catch {
			return emptyCalendarDay(dateKey);
		}
	}));

	return {
		month: monthKey,
		monthLabel: getCalendarMonthLabel(monthKey),
		calendar,
		timeZone: DAILY_TIME_ZONE,
		days,
	};
}
