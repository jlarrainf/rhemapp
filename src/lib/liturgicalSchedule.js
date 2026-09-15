export const DAILY_TIME_ZONE = "America/Santiago";
export const MIN_PUBLISHED_DATE = "2025-01-01";
export const MIN_CALENDAR_MONTH = MIN_PUBLISHED_DATE.slice(0, 7);
export const SUNDAY_CUTOFF_MINUTES = 15 * 60;

function createDateRequestError(message) {
	const error = new Error(message);
	error.status = 400;
	return error;
}

function getDatePartsInTimeZone(date, timeZone = DAILY_TIME_ZONE) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);

	return {
		year: parts.find((part) => part.type === "year")?.value || "1970",
		month: parts.find((part) => part.type === "month")?.value || "01",
		day: parts.find((part) => part.type === "day")?.value || "01",
	};
}

function getTimePartsInTimeZone(date, timeZone = DAILY_TIME_ZONE) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);

	return {
		hour: Number(parts.find((part) => part.type === "hour")?.value || 0),
		minute: Number(parts.find((part) => part.type === "minute")?.value || 0),
		second: Number(parts.find((part) => part.type === "second")?.value || 0),
	};
}

function getWeekdayInTimeZone(date, timeZone = DAILY_TIME_ZONE) {
	const weekday = new Intl.DateTimeFormat("en-US", {
		timeZone,
		weekday: "short",
	}).format(date);

	return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[weekday];
}

export function getWeekdayIndexInTimeZone(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	return getWeekdayInTimeZone(date, timeZone);
}

export function isValidDateKey(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year
		&& date.getUTCMonth() === month - 1
		&& date.getUTCDate() === day;
}

export function isValidMonthKey(value) {
	if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
	const [year, month] = value.split("-").map(Number);
	return year >= 1 && month >= 1 && month <= 12;
}

export function getMonthKeyInTimeZone(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	const { year, month } = getDatePartsInTimeZone(date, timeZone);
	return `${year}-${month}`;
}

export function addCalendarMonths(monthKey, months) {
	if (!isValidMonthKey(monthKey) || !Number.isInteger(months)) {
		throw new Error(`Mes inválido: ${monthKey}`);
	}
	const [year, month] = monthKey.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1 + months, 1));
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function getCalendarMonthDateKeys(monthKey) {
	if (!isValidMonthKey(monthKey)) throw new Error(`Mes inválido: ${monthKey}`);
	const [year, month] = monthKey.split("-").map(Number);
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	return Array.from({ length: daysInMonth }, (_, index) =>
		`${monthKey}-${String(index + 1).padStart(2, "0")}`
	);
}

export function getCalendarMonthLabel(monthKey, locale = "es-CL") {
	if (!isValidMonthKey(monthKey)) throw new Error(`Mes inválido: ${monthKey}`);
	return new Intl.DateTimeFormat(locale, {
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${monthKey}-01T12:00:00Z`));
}

export function getWeekdayIndexForDateKey(dateKey) {
	if (!isValidDateKey(dateKey)) throw new Error(`Fecha inválida: ${dateKey}`);
	const [year, month, day] = dateKey.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function getDateKeyInTimeZone(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	const { year, month, day } = getDatePartsInTimeZone(date, timeZone);
	return `${year}-${month}-${day}`;
}

export function addCalendarDays(dateKey, days) {
	if (!isValidDateKey(dateKey)) throw new Error(`Fecha inválida: ${dateKey}`);
	const date = new Date(`${dateKey}T12:00:00Z`);
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

export function resolveReadingDate({ dateKey, now = new Date(), timeZone = DAILY_TIME_ZONE } = {}) {
	if (dateKey === "") throw createDateRequestError("La fecha seleccionada no puede estar vacía");
	if (dateKey !== undefined && dateKey !== null) {
		if (!isValidDateKey(dateKey)) throw createDateRequestError("La fecha debe usar el formato YYYY-MM-DD");
		if (dateKey < MIN_PUBLISHED_DATE) {
			throw createDateRequestError(`No se pueden consultar fechas anteriores al ${MIN_PUBLISHED_DATE}`);
		}
		return { dateKey, mode: "date" };
	}

	return {
		dateKey: getDateKeyInTimeZone(now, timeZone),
		mode: "today",
	};
}

export function resolveSundayDateKey({ now = new Date(), timeZone = DAILY_TIME_ZONE } = {}) {
	const dateKey = getDateKeyInTimeZone(now, timeZone);
	const weekday = getWeekdayInTimeZone(now, timeZone);
	if (weekday === 0) return dateKey;

	if (weekday === 6) {
		const { hour, minute } = getTimePartsInTimeZone(now, timeZone);
		const currentMinutes = hour * 60 + minute;
		const isBeforeCutoff = currentMinutes < SUNDAY_CUTOFF_MINUTES;
		return addCalendarDays(dateKey, isBeforeCutoff ? -6 : 1);
	}

	return addCalendarDays(dateKey, -weekday);
}

export function formatDailyDate(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	return new Intl.DateTimeFormat("es-CL", {
		day: "2-digit",
		month: "long",
		year: "numeric",
		timeZone,
	}).format(date);
}

export function formatDateKey(dateKey, locale = "es-CL") {
	if (!isValidDateKey(dateKey)) throw new Error(`Fecha inválida: ${dateKey}`);
	return new Intl.DateTimeFormat(locale, {
		day: "2-digit",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	}).format(new Date(`${dateKey}T12:00:00Z`));
}

export function getNextMidnight(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	const currentKey = getDateKeyInTimeZone(date, timeZone);
	let candidate = new Date(date.getTime() + 1000);

	for (let index = 0; index < 48 * 60; index += 1) {
		if (getDateKeyInTimeZone(candidate, timeZone) !== currentKey) return candidate;
		candidate = new Date(candidate.getTime() + 60 * 1000);
	}

	return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}
