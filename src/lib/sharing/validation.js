const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ShareValidationError extends Error {
	constructor(message) {
		super(message);
		this.name = "ShareValidationError";
		this.status = 422;
	}
}

export class ShareNotFoundError extends Error {
	constructor() {
		super("No se encontró el contenido para compartir");
		this.name = "ShareNotFoundError";
		this.status = 404;
	}
}

export class ShareUnavailableError extends Error {
	constructor() {
		super("Este enlace ya no está disponible");
		this.name = "ShareUnavailableError";
		this.status = 404;
	}
}

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validatePrivateSharePayload(payload) {
	if (!isPlainObject(payload)) throw new ShareValidationError("El cuerpo debe ser un objeto JSON");
	const fields = Object.keys(payload).sort();
	if (fields.some((field) => !["resourceType", "resourceId"].includes(field))) {
		throw new ShareValidationError("La solicitud de compartir no es válida");
	}
	if (payload.resourceType !== "saved-reading") {
		throw new ShareValidationError("Este tipo de contenido no se puede compartir de forma privada");
	}
	if (typeof payload.resourceId !== "string" || !UUID_PATTERN.test(payload.resourceId)) {
		throw new ShareValidationError("El identificador del contenido no es válido");
	}
	return {
		resourceType: payload.resourceType,
		resourceId: payload.resourceId.toLowerCase(),
	};
}

export function validateShareId(value) {
	if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
		throw new ShareValidationError("El identificador del enlace no es válido");
	}
	return value.toLowerCase();
}

export function normalizeShareSource(source) {
	if (!isPlainObject(source)) return null;
	const provider = typeof source.provider === "string" ? source.provider.trim().slice(0, 200) : "";
	const url = typeof source.url === "string" ? source.url.trim().slice(0, 500) : "";
	const verified = typeof source.verified === "boolean" ? source.verified : undefined;
	if (url) {
		try {
			const parsed = new URL(url);
			if (!["http:", "https:"].includes(parsed.protocol)) return null;
		} catch {
			return null;
		}
	}
	if (!provider && !url && verified === undefined) return null;
	return {
		...(provider ? { provider } : {}),
		...(url ? { url } : {}),
		...(verified !== undefined ? { verified } : {}),
	};
}

export { UUID_PATTERN };
