import assert from "node:assert/strict";
import test from "node:test";
import {
	ALLOWED_TRANSITIONS,
	SUGGESTION_STATUS,
	canTransition,
} from "../src/lib/suggestions/constants.js";
import {
	SuggestionRateLimitError,
	SuggestionValidationError,
	validatePublishedPayload,
	validateReviewPayload,
	validateSuggestionPayload,
} from "../src/lib/suggestions/validation.js";
import { clearSuggestionRateLimitForTests, consumeSuggestionRateLimit } from "../src/lib/suggestions/rateLimit.js";

const validSuggestion = {
	date: "2026-09-13",
	readingType: "gospel",
	reference: "Mateo 18:21-35",
	sourceUrl: "https://www.eucaristiadiaria.cl/dia_cal.php?fecha=2026-09-13",
	body: "La referencia publicada no coincide con la fuente indicada.",
};

test("normaliza una sugerencia válida y conserva el contrato en español", () => {
	assert.deepEqual(validateSuggestionPayload({ ...validSuggestion, reference: " Mateo 18:21-35 " }), {
		...validSuggestion,
		reference: "Mateo 18:21-35",
	});
});

test("rechaza fecha, referencia, fuente, HTML y campos desconocidos", () => {
	for (const payload of [
		{ ...validSuggestion, date: "2026-02-30" },
		{ ...validSuggestion, reference: "una referencia inventada" },
		{ ...validSuggestion, sourceUrl: "javascript:alert(1)" },
		{ ...validSuggestion, body: "<script>no</script>" },
		{ ...validSuggestion, extra: "no permitido" },
	]) {
		assert.throws(() => validateSuggestionPayload(payload), SuggestionValidationError);
	}
});

test("la máquina de estados permite solo transiciones editoriales válidas", () => {
	assert.equal(canTransition(SUGGESTION_STATUS.PENDING, SUGGESTION_STATUS.IN_REVIEW), true);
	assert.equal(canTransition(SUGGESTION_STATUS.IN_REVIEW, SUGGESTION_STATUS.APPROVED), true);
	assert.equal(canTransition(SUGGESTION_STATUS.APPROVED, SUGGESTION_STATUS.PUBLISHED), true);
	assert.equal(canTransition(SUGGESTION_STATUS.REJECTED, SUGGESTION_STATUS.APPROVED), false);
	assert.deepEqual(ALLOWED_TRANSITIONS[SUGGESTION_STATUS.PUBLISHED], []);
});

test("toda decisión editorial exige comentario y estado permitido", () => {
	assert.deepEqual(validateReviewPayload({ status: "approved", comment: "Fuente comprobada" }), {
		status: "approved",
		comment: "Fuente comprobada",
		expectedStatus: null,
	});
	assert.throws(() => validateReviewPayload({ status: "approved", comment: "" }), SuggestionValidationError);
	assert.throws(() => validateReviewPayload({ status: "published", comment: "No debe saltarse la publicación" }), SuggestionValidationError);
});

test("el rate limit rechaza el sexto envío dentro de la ventana", () => {
	clearSuggestionRateLimitForTests();
	for (let index = 0; index < 5; index += 1) {
		assert.equal(consumeSuggestionRateLimit({ userId: "user-a", ip: "127.0.0.1", now: 1000 }).allowed, true);
	}
	assert.throws(
		() => consumeSuggestionRateLimit({ userId: "user-a", ip: "127.0.0.1", now: 1000 }),
		SuggestionRateLimitError,
	);
	clearSuggestionRateLimitForTests();
});

test("solo una entrada genérica completa y verificada puede publicarse", () => {
	const entry = {
		date: "2026-09-13",
		calendar: "chile",
		liturgicalYear: "2026",
		celebration: "DOMINGO",
		source: { provider: "Fuente verificada", url: "https://fuente.example/2026-09-13", verified: true },
		readings: [
			{
				type: "first-reading",
				order: 1,
				reference: "Génesis 1:1-2",
				passageId: "GEN.1.1-2",
				ranges: [{ chapter: 1, start: 1, end: 2 }],
				title: "La creación",
				excerpt: "La creación",
				excerptReference: "Génesis 1:1-2",
				source: { provider: "Fuente verificada", url: "https://fuente.example/2026-09-13", verified: true },
			},
			{
				type: "psalm",
				order: 2,
				reference: "Salmos 1:1-2",
				passageId: "PSA.1.1-2",
				ranges: [{ chapter: 1, start: 1, end: 2 }],
				title: "Dichoso",
				excerpt: "Dichoso",
				excerptReference: "Salmos 1:1-2",
				source: { provider: "Fuente verificada", url: "https://fuente.example/2026-09-13", verified: true },
			},
			{
				type: "gospel",
				order: 4,
				reference: "Mateo 18:21-35",
				passageId: "MAT.18.21-35",
				ranges: [{ chapter: 18, start: 21, end: 35 }],
				title: "El perdón",
				excerpt: "El perdón",
				excerptReference: "Mateo 18:21-35",
				source: { provider: "Fuente verificada", url: "https://fuente.example/2026-09-13", verified: true },
			},
		],
	};
	assert.equal(validatePublishedPayload(entry), entry);
	assert.throws(() => validatePublishedPayload({ ...entry, source: { ...entry.source, verified: false } }), SuggestionValidationError);
});
