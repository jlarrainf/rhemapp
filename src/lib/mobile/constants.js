export const MOBILE_CONTRACT_VERSION = 1;
export const DEFAULT_NOTIFICATION_LOCAL_TIME = "08:00";
export const DEFAULT_NOTIFICATION_TIMEZONE = "America/Santiago";
export const NOTIFICATION_PLATFORM = "android";
export const NOTIFICATION_READING_MODE = "today";
export const NOTIFICATION_MAX_ATTEMPTS = 3;
export const MAX_PUSH_TOKEN_LENGTH = 4096;
export const MAX_GOOGLE_ID_TOKEN_LENGTH = 16_384;
export const MAX_GOOGLE_NONCE_LENGTH = 256;
export const MOBILE_DAILY_PATH = "/daily";
export const MOBILE_RESPONSE_HEADERS = Object.freeze({
	"Cache-Control": "no-store, max-age=0",
	"X-Robots-Tag": "noindex, nofollow",
});

export const NOTIFICATION_READING_TYPES = Object.freeze([
	"first-reading",
	"psalm",
	"second-reading",
	"gospel",
]);
