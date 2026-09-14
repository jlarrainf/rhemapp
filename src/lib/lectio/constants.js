export const LECTIO_CATEGORIES = Object.freeze([
	"observe",
	"meditate",
	"pray",
	"act",
]);

export const LECTIO_CATEGORY_LABELS = Object.freeze({
	observe: "Observar",
	meditate: "Meditar",
	pray: "Orar",
	act: "Actuar",
});

export const LECTIO_PROMPT_VERSION = "1.0.0";
export const LECTIO_SCHEMA_VERSION = "1.0.0";
export const LECTIO_GUIDE_VERSION = "1.0.0";
export const LECTIO_MAX_QUESTION_WORDS = 60;
export const LECTIO_MIN_QUESTION_WORDS = 15;

export const LECTIO_STATES = Object.freeze({
	PENDING: "pending",
	PUBLISHED: "published",
	FALLBACK: "fallback",
});

export const LECTIO_GENERATION_MAX_ATTEMPTS = 3;
export const LECTIO_PENDING_STALE_MS = 10 * 60 * 1000;

export function isLectioCategory(value) {
	return LECTIO_CATEGORIES.includes(value);
}
