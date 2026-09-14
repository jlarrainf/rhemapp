const READING_KEY_PATTERN = /^chile:(\d{4})-(\d{2})-(\d{2})$/;

export class LectioValidationError extends Error {
	constructor(message, errors = []) {
		super(message);
		this.name = "LectioValidationError";
		this.errors = errors.length > 0 ? errors : [message];
		this.status = 422;
	}
}

function isValidDate(year, month, day) {
	const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
	return date.getUTCFullYear() === Number(year)
		&& date.getUTCMonth() === Number(month) - 1
		&& date.getUTCDate() === Number(day);
}

export function parseReadingKey(value) {
	if (typeof value !== "string") throw new LectioValidationError("Indica una lectura válida");
	const match = value.match(READING_KEY_PATTERN);
	if (!match || !isValidDate(match[1], match[2], match[3])) throw new LectioValidationError("La clave de lectura no es válida");
	return {
		readingKey: value,
		dateKey: `${match[1]}-${match[2]}-${match[3]}`,
	};
}

export function readingKeyFromDate(dateKey) {
	return parseReadingKey(`chile:${dateKey}`).readingKey;
}
