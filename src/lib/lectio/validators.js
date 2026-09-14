import { LECTIO_CATEGORIES, LECTIO_MAX_QUESTION_WORDS, LECTIO_MIN_QUESTION_WORDS } from "./constants.js";
import { hasAnchorEvidence } from "./anchors.js";
import { parseLectioModelOutput } from "./schema.js";

const CATEGORY_MARKERS = Object.freeze({
	observe: ["detalle", "palabra", "imagen", "acción", "expresión", "aparece", "mira", "observa"],
	meditate: ["significado", "sentido", "invita", "despierta", "movimiento", "comprender", "interior"],
	pray: ["dios", "señor", "dirigirle", "responderle", "oración", "agradecer", "pedir"],
	act: ["acción", "paso", "realizar", "responder", "hoy", "práctica", "concreta", "posible"],
});

const UNSAFE_TERMS = [
	"ignore previous", "ignora las instrucciones", "instrucciones anteriores", "jailbreak", "system prompt", "prompt del sistema",
	"openrouter", "api key", "clave api", "documento doctrinal", "documentos doctrinales", "magisterio", "cita a",
	"médic", "medic", "psicol", "terapia", "diagnóstic", "diagnostic", "tratamiento", "prescrib", "suicid", "autoles",
];

const GENERIC_PATTERNS = [
	"qué significa la biblia para ti",
	"qué te dice la lectura",
	"qué mensaje te deja",
	"cómo te interpela este texto",
	"qué puedes aprender de la biblia",
];

function wordCount(value) {
	return String(value || "").trim().split(/\s+/u).filter(Boolean).length;
}

function normalizedText(value) {
	return String(value || "")
		.toLocaleLowerCase("es-CL")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\p{L}\d\s]/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function hasSpanishMarkers(text) {
	return /\b(el|la|los|las|que|qué|lectura|texto|Dios|Señor|hoy|acción|palabra|significado)\b/iu.test(text);
}

function hasUnsafeContent(text) {
	const normalized = normalizedText(text);
	return UNSAFE_TERMS.some((term) => normalized.includes(normalizedText(term)));
}

function isGenericContent(text) {
	const normalized = normalizedText(text);
	return GENERIC_PATTERNS.some((pattern) => normalized.includes(normalizedText(pattern)));
}

function hasCategoryIntent(category, text) {
	const normalized = normalizedText(text);
	return CATEGORY_MARKERS[category].some((marker) => normalized.includes(normalizedText(marker)));
}

function overlap(left, right) {
	const leftSet = new Set(normalizedText(left).split(" ").filter((term) => term.length >= 5));
	const rightSet = new Set(normalizedText(right).split(" ").filter((term) => term.length >= 5));
	if (leftSet.size === 0 || rightSet.size === 0) return 0;
	const common = [...leftSet].filter((term) => rightSet.has(term)).length;
	return common / Math.max(leftSet.size, rightSet.size);
}

function validateQuestion(question, index, anchors, { allowGeneral = false } = {}) {
	const errors = [];
	const path = `questions[${index}]`;
	const text = typeof question?.text === "string" ? question.text.trim() : "";
	const anchorMap = new Map((anchors || []).map((anchor) => [anchor.id, anchor]));
	const anchorIds = Array.isArray(question?.anchorIds) ? [...new Set(question.anchorIds)] : [];

	if (!text) errors.push(`${path}.text: pregunta vacía`);
	const words = wordCount(text);
	if (words < LECTIO_MIN_QUESTION_WORDS || words > LECTIO_MAX_QUESTION_WORDS) errors.push(`${path}.text: debe tener entre 15 y 60 palabras`);
	if (!text.includes("¿") || !text.endsWith("?") || (text.match(/\?/gu) || []).length !== 1) errors.push(`${path}.text: debe ser una sola interrogación`);
	if (!hasSpanishMarkers(text)) errors.push(`${path}.text: no parece estar escrita en español`);
	if (hasUnsafeContent(text)) errors.push(`${path}.text: contiene instrucciones o contenido no permitido`);
	if (isGenericContent(text)) errors.push(`${path}.text: la pregunta es genérica o intercambiable entre lecturas`);
	if (!hasCategoryIntent(question?.category, text)) errors.push(`${path}.text: no corresponde a la intención de ${question?.category}`);

	if (!allowGeneral && anchorIds.length === 0) errors.push(`${path}.anchorIds: la pregunta generada requiere un anclaje`);
	const linkedAnchors = anchorIds.map((id) => anchorMap.get(id)).filter(Boolean);
	if (anchorIds.some((id) => !anchorMap.has(id))) errors.push(`${path}.anchorIds: apunta a un anclaje inexistente`);
	if (!allowGeneral && linkedAnchors.length === 0) errors.push(`${path}.anchorIds: no apunta a la lectura suministrada`);
	if (allowGeneral && anchorIds.length === 0 && question?.general !== true) errors.push(`${path}.general: el fallback sin anclaje debe identificarse como reflexión general`);
	if (!allowGeneral && linkedAnchors.length > 0 && !linkedAnchors.some((anchor) => hasAnchorEvidence(text, anchor))) {
		errors.push(`${path}: el texto no contiene evidencia del anclaje declarado`);
	}
	if (question?.general === true && !allowGeneral) errors.push(`${path}.general: una salida generada no puede marcarse como general`);

	return { errors, words, linkedAnchors };
}

export function validateLectioQuestions(questions, { anchors = [], allowGeneral = false } = {}) {
	const errors = [];
	const seenCategories = new Set();
	const metrics = {
		questionCount: Array.isArray(questions) ? questions.length : 0,
		anchorLinkedCount: 0,
		generalCount: 0,
		wordCounts: [],
		uniqueCategories: 0,
		diversityScore: 0,
	};

	if (!Array.isArray(questions) || questions.length !== LECTIO_CATEGORIES.length) {
		return { valid: false, errors: ["questions: se requieren exactamente cuatro preguntas"], metrics };
	}

	for (const category of LECTIO_CATEGORIES) {
		const count = questions.filter((question) => question?.category === category).length;
		if (count !== 1) errors.push(`questions: debe existir exactamente una pregunta de ${category}`);
	}

	for (const [index, question] of questions.entries()) {
		if (seenCategories.has(question?.category)) errors.push(`questions[${index}].category: categoría repetida`);
		seenCategories.add(question?.category);
		const result = validateQuestion(question, index, anchors, { allowGeneral });
		errors.push(...result.errors);
		metrics.wordCounts.push(result.words);
		if (result.linkedAnchors.length > 0) metrics.anchorLinkedCount += 1;
		if (question?.general === true) metrics.generalCount += 1;
	}

	const normalizedQuestions = questions.map((question) => normalizedText(question?.text));
	for (let index = 0; index < normalizedQuestions.length; index += 1) {
		for (let otherIndex = index + 1; otherIndex < normalizedQuestions.length; otherIndex += 1) {
			if (normalizedQuestions[index] && normalizedQuestions[index] === normalizedQuestions[otherIndex]) {
				errors.push(`questions: hay preguntas repetidas (${index + 1} y ${otherIndex + 1})`);
			} else if (overlap(normalizedQuestions[index], normalizedQuestions[otherIndex]) >= 0.82) {
				errors.push(`questions: hay preguntas intercambiables o repetitivas (${index + 1} y ${otherIndex + 1})`);
			}
		}
	}

	metrics.uniqueCategories = seenCategories.size;
	metrics.diversityScore = new Set(normalizedQuestions).size / LECTIO_CATEGORIES.length;
	return { valid: errors.length === 0, errors, metrics };
}

export function validateGeneratedLectioOutput(raw, { anchors = [] } = {}) {
	try {
		const parsed = parseLectioModelOutput(raw);
		const validation = validateLectioQuestions(parsed.questions, { anchors });
		if (!validation.valid) return { ...validation, normalized: null };
		const questions = [...parsed.questions].sort((left, right) => LECTIO_CATEGORIES.indexOf(left.category) - LECTIO_CATEGORIES.indexOf(right.category));
		return { ...validation, normalized: questions.map((question) => ({ ...question, general: false })) };
	} catch (error) {
		return {
			valid: false,
			errors: error.errors || [error.message || "La salida no cumple el esquema"],
			normalized: null,
			metrics: { questionCount: 0, anchorLinkedCount: 0, generalCount: 0, wordCounts: [], uniqueCategories: 0, diversityScore: 0 },
		};
	}
}

export function validateFallbackQuestions(questions, { anchors = [] } = {}) {
	return validateLectioQuestions(questions, { anchors, allowGeneral: true });
}
