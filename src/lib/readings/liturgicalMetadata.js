export const LITURGICAL_RANKS = Object.freeze([
	"weekday",
	"memorial",
	"optional-memorial",
	"feast",
	"solemnity",
	"commemoration",
	"other",
]);

export const LITURGICAL_SEASONS = Object.freeze([
	"advent",
	"christmas",
	"lent",
	"easter",
	"ordinary",
]);

export const LITURGICAL_COLORS = Object.freeze([
	"green",
	"white",
	"red",
	"violet",
	"rose",
	"black",
	"gold",
]);

function isPlainObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value, maximumLength = 500) {
	return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maximumLength;
}

function isVerifiedSource(value) {
	if (!isPlainObject(value) || !isNonEmptyString(value.provider, 200) || value.verified !== true) return false;
	try {
		const url = new URL(value.url);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

function normalizedText(value) {
	return typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLocaleLowerCase("es-CL") : "";
}

function hasDateOnlyCelebration(value) {
	return /^\d{1,2}\s+de\s+[\p{L}]+(?:\s+de\s+\d{4})?$/iu.test(value.trim());
}

function inferRank(name) {
	const normalized = normalizedText(name);
	if (normalized.includes("solemnidad")) return "solemnity";
	if (normalized.includes("fiesta")) return "feast";
	if (normalized.includes("memoria opcional")) return "optional-memorial";
	if (normalized.includes("memoria")) return "memorial";
	if (normalized.includes("conmemoración")) return "commemoration";
	if (normalized.includes("semana del tiempo") || normalized.includes("feria")) return "weekday";
	return "other";
}

function validateMetadataSource(source, path, errors) {
	if (!isVerifiedSource(source)) {
		errors.push(`${path}: requiere proveedor, URL HTTP(S) y verificación explícita`);
	}
}

function validateInformationSource(source, path, errors) {
	validateMetadataSource(source, path, errors);
	if (isPlainObject(source) && !isNonEmptyString(source.attribution, 200)) {
		errors.push(`${path}.attribution: atribución requerida`);
	}
}

function validateSaint(saint, path, errors) {
	if (!isPlainObject(saint)) {
		errors.push(`${path}: debe ser un objeto`);
		return;
	}
	if (!isNonEmptyString(saint.name, 200)) errors.push(`${path}.name: nombre requerido`);
	if (saint.description !== undefined && !isNonEmptyString(saint.description, 1000)) {
		errors.push(`${path}.description: debe ser una descripción no vacía`);
	}
	validateMetadataSource(saint.source, `${path}.source`, errors);
	if (saint.informationSource !== undefined) {
		validateInformationSource(saint.informationSource, `${path}.informationSource`, errors);
	}
}

function validateCelebration(celebration, index, errors) {
	const path = `celebrations[${index}]`;
	if (!isPlainObject(celebration)) {
		errors.push(`${path}: debe ser un objeto`);
		return;
	}
	if (!isNonEmptyString(celebration.name, 300)) errors.push(`${path}.name: nombre requerido`);
	if (!LITURGICAL_RANKS.includes(celebration.rank)) errors.push(`${path}.rank: rango litúrgico no permitido`);
	if (typeof celebration.isPrimary !== "boolean") errors.push(`${path}.isPrimary: debe ser booleano`);
	validateMetadataSource(celebration.source, `${path}.source`, errors);
	if (celebration.saints !== undefined) {
		if (!Array.isArray(celebration.saints)) {
			errors.push(`${path}.saints: debe ser un arreglo`);
		} else {
			celebration.saints.forEach((saint, saintIndex) => validateSaint(saint, `${path}.saints[${saintIndex}]`, errors));
		}
	}
}

export function validateLiturgicalMetadata(entry) {
	const errors = [];
	if (!isPlainObject(entry)) return { valid: false, errors: ["metadata: debe ser un objeto"] };

	if (entry.liturgicalSeason !== undefined && !LITURGICAL_SEASONS.includes(entry.liturgicalSeason)) {
		errors.push("liturgicalSeason: tiempo litúrgico no permitido");
	}
	if (entry.liturgicalColor !== undefined && !LITURGICAL_COLORS.includes(entry.liturgicalColor)) {
		errors.push("liturgicalColor: color litúrgico no permitido");
	}

	if (entry.celebrations !== undefined) {
		if (!Array.isArray(entry.celebrations) || entry.celebrations.length === 0) {
			errors.push("celebrations: debe contener al menos una celebración");
		} else {
			entry.celebrations.forEach((celebration, index) => validateCelebration(celebration, index, errors));
			const names = entry.celebrations.map((celebration) => normalizedText(celebration?.name)).filter(Boolean);
			if (new Set(names).size !== names.length) errors.push("celebrations: no puede repetir nombres");
			const saintNames = entry.celebrations
				.flatMap((celebration) => Array.isArray(celebration?.saints) ? celebration.saints : [])
				.map((saint) => normalizedText(saint?.name))
				.filter(Boolean);
			if (new Set(saintNames).size !== saintNames.length) errors.push("celebrations.saints: no puede repetir santos");
			const primaryCount = entry.celebrations.filter((celebration) => celebration?.isPrimary === true).length;
			if (primaryCount !== 1) errors.push("celebrations: debe tener exactamente una celebración principal");
			if (entry.celebrations[0]?.isPrimary !== true) errors.push("celebrations: la celebración principal debe conservar el primer lugar editorial");
		}
	}

	return { valid: errors.length === 0, errors };
}

function cloneSource(source) {
	return isPlainObject(source) ? { ...source } : source;
}

function cloneSaints(saints, source) {
	if (!Array.isArray(saints)) return [];
	return saints.map((saint) => ({
		name: saint.name.trim(),
		...(saint.description ? { description: saint.description.trim() } : {}),
		source: cloneSource(saint.source || source),
		...(saint.informationSource ? { informationSource: cloneSource(saint.informationSource) } : {}),
	}));
}

export function normalizeLiturgicalMetadata(entry) {
	if (!isPlainObject(entry)) return [];
	if (Array.isArray(entry.celebrations)) {
		const validation = validateLiturgicalMetadata(entry);
		if (!validation.valid) return [];
		return entry.celebrations.map((celebration) => ({
			name: celebration.name.trim(),
			rank: celebration.rank,
			isPrimary: celebration.isPrimary,
			saints: cloneSaints(celebration.saints, celebration.source),
			source: cloneSource(celebration.source),
		}));
	}

	const legacyName = typeof entry.celebration === "string" ? entry.celebration.trim() : "";
	if (!legacyName || hasDateOnlyCelebration(legacyName) || !isVerifiedSource(entry.source)) return [];
	return [{
		name: legacyName,
		rank: inferRank(legacyName),
		isPrimary: true,
		saints: [],
		source: cloneSource(entry.source),
	}];
}

export function getPrimaryCelebration(entry) {
	return normalizeLiturgicalMetadata(entry).find((celebration) => celebration.isPrimary) || null;
}

const PUBLIC_SOURCE_FIELDS = [
	"provider",
	"url",
	"ordoUrl",
	"pageTitle",
	"verified",
	"fetchedAt",
	"syncStatus",
	"provisional",
	"ordoValidated",
	"attribution",
	"license",
	"terms",
];

export function toPublicSource(source) {
	if (!isPlainObject(source)) return null;
	return Object.fromEntries(
		PUBLIC_SOURCE_FIELDS
			.filter((field) => source[field] !== undefined)
			.map((field) => [field, source[field]])
	);
}

export function toPublicInformationSource(source) {
	if (!isPlainObject(source)) return null;
	return Object.fromEntries(
		["provider", "url", "verified", "attribution"]
			.filter((field) => source[field] !== undefined)
			.map((field) => [field, source[field]])
	);
}

export function toPublicLiturgicalMetadata(entry) {
	const celebrations = normalizeLiturgicalMetadata(entry);
	return {
		...(celebrations.length > 0 ? {
			celebrations: celebrations.map((celebration) => ({
				...celebration,
				source: toPublicSource(celebration.source),
				saints: celebration.saints.map((saint) => ({
					name: saint.name,
					source: toPublicSource(saint.source),
					...(saint.informationSource ? { informationSource: toPublicInformationSource(saint.informationSource) } : {}),
				})),
			})),
		} : {}),
		...(entry?.liturgicalSeason ? { liturgicalSeason: entry.liturgicalSeason } : {}),
		...(entry?.liturgicalColor ? { liturgicalColor: entry.liturgicalColor } : {}),
	};
}

export function toPublicPublishedEntry(entry) {
	if (!isPlainObject(entry)) return entry;
	const publicMetadata = toPublicLiturgicalMetadata(entry);
	const publicEntry = { ...entry, ...publicMetadata };
	if (!publicMetadata.celebrations) delete publicEntry.celebrations;
	publicEntry.source = toPublicSource(entry.source);
	if (Array.isArray(entry.readings)) {
		publicEntry.readings = entry.readings.map((reading) => ({
			...reading,
			source: toPublicSource(reading.source),
		}));
	}
	if (Array.isArray(publicEntry.celebrations)) {
		publicEntry.celebrations = publicEntry.celebrations.map((celebration) => ({
			...celebration,
			source: toPublicSource(celebration.source),
			saints: celebration.saints.map((saint) => ({
				...saint,
				source: toPublicSource(saint.source),
				...(saint.informationSource ? { informationSource: toPublicInformationSource(saint.informationSource) } : {}),
			})),
		}));
	}
	return publicEntry;
}
