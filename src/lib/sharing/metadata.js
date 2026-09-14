export function createSharedReadingMetadata({ resource = null, url, isPrivate = false } = {}) {
	const title = resource?.title || resource?.reference || (isPrivate ? "Lectura compartida" : "Lectura pública");
	const description = isPrivate
		? "Una lectura compartida de forma privada desde Rhemapp."
		: `Lee ${resource?.reference || "esta lectura"} en Rhemapp.`;
	return {
		title,
		description,
		alternates: url ? { canonical: url } : undefined,
		openGraph: {
			title,
			description,
			url,
			siteName: "Rhemapp",
			locale: "es_CL",
			type: "article",
		},
		twitter: {
			card: "summary",
			title,
			description,
		},
		robots: isPrivate ? { index: false, follow: false } : { index: true, follow: true },
	};
}

export function createUnavailableShareMetadata({ isPrivate = false } = {}) {
	return {
		title: isPrivate ? "Enlace privado no disponible" : "Enlace compartido no válido",
		description: "El enlace compartido no está disponible.",
		robots: { index: false, follow: false },
	};
}
