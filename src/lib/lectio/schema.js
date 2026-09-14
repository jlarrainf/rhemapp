import { LECTIO_CATEGORIES, isLectioCategory } from "./constants.js";

export class LectioSchemaError extends Error {
	constructor(message, errors = []) {
		super(message);
		this.name = "LectioSchemaError";
		this.errors = errors.length > 0 ? errors : [message];
	}
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function stripCodeFence(value) {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return fenced ? fenced[1].trim() : trimmed;
}

function assertAllowedKeys(value, allowed, path, errors) {
	if (!isPlainObject(value)) {
		errors.push(`${path}: debe ser un objeto`);
		return;
	}
	for (const key of Object.keys(value)) {
		if (!allowed.includes(key)) errors.push(`${path}.${key}: campo no permitido`);
	}
}

export function parseLectioModelOutput(raw) {
	let value = raw;
	if (typeof raw === "string") {
		try {
			value = JSON.parse(stripCodeFence(raw));
		} catch {
			throw new LectioSchemaError("La respuesta de IA no contiene JSON válido");
		}
	}

	const errors = [];
	assertAllowedKeys(value, ["questions"], "output", errors);
	if (!Array.isArray(value?.questions)) errors.push("output.questions: debe ser una lista");
	if (errors.length > 0) throw new LectioSchemaError("La salida no cumple el esquema de Lectio", errors);
	if (value.questions.length !== LECTIO_CATEGORIES.length) {
		throw new LectioSchemaError("La salida debe contener exactamente cuatro preguntas");
	}

	const questions = value.questions.map((question, index) => {
		const path = `output.questions[${index}]`;
		const questionErrors = [];
		assertAllowedKeys(question, ["category", "text", "anchorIds"], path, questionErrors);
		if (!isLectioCategory(question?.category)) questionErrors.push(`${path}.category: categoría no permitida`);
		if (typeof question?.text !== "string") questionErrors.push(`${path}.text: debe ser texto`);
		if (!Array.isArray(question?.anchorIds) || question.anchorIds.length === 0) questionErrors.push(`${path}.anchorIds: requiere al menos un ID`);
		if (Array.isArray(question?.anchorIds) && question.anchorIds.some((id) => typeof id !== "string" || id.length > 100)) {
			questionErrors.push(`${path}.anchorIds: contiene un ID inválido`);
		}
		errors.push(...questionErrors);
		return {
			category: question?.category,
			text: typeof question?.text === "string" ? question.text.trim() : "",
			anchorIds: Array.isArray(question?.anchorIds) ? [...new Set(question.anchorIds)] : [],
		};
	});

	if (errors.length > 0) throw new LectioSchemaError("La salida no cumple el esquema de Lectio", errors);
	return { questions };
}
