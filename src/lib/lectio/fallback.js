import { LECTIO_CATEGORIES } from "./constants.js";

function safeAnchorText(anchor) {
	return String(anchor?.text || "este detalle de la lectura")
		.replace(/[?¿]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, 180);
}

const TEMPLATES = Object.freeze({
	observe: (anchor) => `Al leer «${safeAnchorText(anchor)}», ¿qué palabra, imagen o acción concreta aparece y qué detalle del texto te invita a mirar con atención?`,
	meditate: (anchor) => `A partir de «${safeAnchorText(anchor)}», ¿qué significado puede tener este detalle dentro de la lectura completa y qué movimiento interior despierta en ti?`,
	pray: (anchor) => `Después de contemplar «${safeAnchorText(anchor)}», ¿qué respuesta sencilla quieres dirigirle a Dios desde lo que este texto pone hoy delante de ti?`,
	act: (anchor) => `A la luz de «${safeAnchorText(anchor)}», ¿qué acción concreta, prudente y posible puedes realizar hoy para responder a la invitación que reconoces en la lectura?`,
});

const GENERAL_TEMPLATES = Object.freeze({
	observe: "Al leer la lectura seleccionada, ¿qué palabra, imagen o acción concreta destaca y te invita a mirar el texto con atención?",
	meditate: "Al considerar la lectura seleccionada, ¿qué significado puede tener su mensaje y qué movimiento interior despierta en ti?",
	pray: "Después de leer la lectura seleccionada, ¿qué respuesta sencilla quieres dirigirle a Dios desde lo que el texto pone hoy delante de ti?",
	act: "A la luz de la lectura seleccionada, ¿qué acción concreta, prudente y posible puedes realizar hoy para responder a su invitación?",
});

export function buildFallbackQuestions(anchors = []) {
	return LECTIO_CATEGORIES.map((category, index) => {
		const anchor = anchors[index % Math.max(anchors.length, 1)] || null;
		return {
			category,
			text: anchor ? TEMPLATES[category](anchor) : GENERAL_TEMPLATES[category],
			anchorIds: anchor ? [anchor.id] : [],
			general: !anchor,
		};
	});
}

export function buildFallbackAdaptation({ readingKey, anchors = [], promptVersion, schemaVersion, reason = "fallback" }) {
	return {
		version: 1,
		readingKey,
		generated: false,
		status: "fallback",
		promptVersion,
		schemaVersion,
		anchors,
		questions: buildFallbackQuestions(anchors),
		validation: { valid: false, status: "fallback", reasons: [reason] },
	};
}
