const MAX_GROUP_NAME_LENGTH = 120;

export class ReadingGroupValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = "ReadingGroupValidationError";
		this.status = 422;
	}
}

export class ReadingGroupNotFoundError extends Error {
	constructor() {
		super("No se encontró el grupo solicitado");
		this.name = "ReadingGroupNotFoundError";
		this.status = 404;
	}
}

export function normalizeGroupName(value) {
	if (typeof value !== "string") throw new ReadingGroupValidationError("El nombre del grupo es requerido");
	const name = value.trim().replace(/\s+/g, " ");
	if (!name) throw new ReadingGroupValidationError("El nombre del grupo no puede estar vacío");
	if ([...name].length > MAX_GROUP_NAME_LENGTH) {
		throw new ReadingGroupValidationError("El nombre del grupo es demasiado largo");
	}

	const normalizedName = name
		.normalize("NFKD")
		.replace(/\p{Mark}/gu, "")
		.toLocaleLowerCase("es-CL");

	return { name, normalizedName };
}

export function validateGroupId(value) {
	if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
		throw new ReadingGroupValidationError("El identificador del grupo no es válido");
	}
	return value.toLowerCase();
}
