import { DAILY_TIME_ZONE, formatDateKey, getDateKeyInTimeZone } from "../liturgicalSchedule.js";
import { isValidLocalTime, isValidIanaTimezone } from "./validation.js";

export function getNotificationLocalParts(date = new Date(), timeZone = DAILY_TIME_ZONE) {
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
	const value = (type) => parts.find((part) => part.type === type)?.value || "0";
	return {
		dateKey: `${value("year")}-${value("month")}-${value("day")}`,
		hour: Number(value("hour")),
		minute: Number(value("minute")),
		second: Number(value("second")),
	};
}

export function shouldDispatchForPreference({ localTime, timezone, now = new Date() }) {
	if (!isValidLocalTime(localTime) || !isValidIanaTimezone(timezone)) return false;
	const [hour, minute] = localTime.split(":").map(Number);
	const parts = getNotificationLocalParts(now, timezone);
	return parts.hour === hour && parts.minute === minute;
}

export function createNotificationScheduleKey({ deviceId, dateKey }) {
	return `${deviceId}:chile:${dateKey}`;
}

export function getCurrentNotificationDateKey(now = new Date()) {
	return getDateKeyInTimeZone(now, DAILY_TIME_ZONE);
}

export { formatDateKey };
