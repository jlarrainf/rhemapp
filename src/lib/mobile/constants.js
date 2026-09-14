import { DAILY_TIME_ZONE } from "../liturgicalSchedule.js";

export const MOBILE_CONTRACT_VERSION = 1;
export const DEFAULT_NOTIFICATION_LOCAL_TIME = "08:00";
export const DEFAULT_NOTIFICATION_TIMEZONE = DAILY_TIME_ZONE;
export const NOTIFICATION_PLATFORM = "android";
export const NOTIFICATION_READING_MODE = "today";
export const NOTIFICATION_READING_TYPES = Object.freeze([
	"first-reading",
	"psalm",
	"second-reading",
	"gospel",
]);
export const NOTIFICATION_MAX_ATTEMPTS = 3;
export const PUSH_TOKEN_MAX_LENGTH = 4096;
export const DAILY_PATH = "/daily";

export const NOTIFICATION_HEADERS = Object.freeze({
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
	"X-Content-Type-Options": "nosniff",
});
