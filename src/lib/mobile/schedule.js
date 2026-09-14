import {
	DAILY_TIME_ZONE,
	formatDateKey,
	getDateKeyInTimeZone,
} from "../liturgicalSchedule.js";

function getDateTimePartsInTimeZone(date, timeZone) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	}).formatToParts(date);
	const valueFor = (type, fallback = "") => parts.find((part) => part.type === type)?.value || fallback;
	return {
		dateKey: `${valueFor("year", "1970")}-${valueFor("month", "01")}-${valueFor("day", "01")}`,
		hour: Number(valueFor("hour", "0")),
		minute: Number(valueFor("minute", "0")),
		second: Number(valueFor("second", "0")),
	};
}

export function getNotificationLocalParts(date = new Date(), timeZone = DAILY_TIME_ZONE) {
	return getDateTimePartsInTimeZone(date, timeZone);
}

export function parseLocalTime(localTime) {
	const [hour, minute] = String(localTime || "").split(":").map(Number);
	return { hour, minute };
}

export function shouldDispatchForPreference({ localTime, timezone, now = new Date() }) {
	const expected = parseLocalTime(localTime);
	if (!Number.isInteger(expected.hour) || !Number.isInteger(expected.minute)) return false;
	const current = getNotificationLocalParts(now, timezone);
	return current.hour === expected.hour && current.minute === expected.minute;
}

export function getNotificationScheduleKey({ localTime, timezone, now = new Date() }) {
	const current = getNotificationLocalParts(now, timezone);
	return `${current.dateKey}T${localTime}@${timezone}`;
}

export function getCurrentReadingDateKey(now = new Date()) {
	return getDateKeyInTimeZone(now, DAILY_TIME_ZONE);
}

export function formatNotificationDate(dateKey) {
	return formatDateKey(dateKey, "es-CL");
}
