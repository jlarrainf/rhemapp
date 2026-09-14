import Link from "next/link";

const READING_LABELS = {
	"first-reading": "Primera lectura",
	psalm: "Salmo",
	"second-reading": "Segunda lectura",
	gospel: "Evangelio",
};

const CONTENT_LABELS = {
	"liturgical-reading": "Lectura litúrgica",
	"random-verse": "Versículo bíblico",
	"bible-passage": "Pasaje bíblico",
};

function getSourceLabel(source) {
	if (!source) return null;
	const label = source.provider || "Fuente original";
	return source.url ? (
		<a
			href={source.url}
			target="_blank"
			rel="noreferrer"
			className="underline decoration-[#b79b72] underline-offset-2 hover:text-[#b79b72]"
		>
			{label}
		</a>
	) : label;
}

export function SharedReadingUnavailable({ rateLimited = false }) {
	return (
		<section className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 text-center">
			<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Rhemapp</p>
			<h1 className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">
				{rateLimited ? "Enlace temporalmente no disponible" : "Este enlace ya no está disponible"}
			</h1>
			<p className="mt-3 max-w-lg text-gray-600 dark:text-gray-300">
				{rateLimited
					? "Espera un momento y vuelve a intentarlo."
					: "La lectura pudo haber sido revocada, retirada o no existe. No se muestran detalles privados."}
			</p>
			<Link
				href="/"
				className="mt-6 inline-flex min-h-11 items-center rounded-full bg-[#314156] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#314156]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 dark:bg-[#b79b72] dark:text-gray-900 dark:focus-visible:ring-offset-gray-900"
			>
				Ir a Rhemapp
			</Link>
		</section>
	);
}

export default function SharedReadingView({ resource, isPrivate = false }) {
	const metadata = resource.metadata || {};
	const readingType = READING_LABELS[metadata.readingType];
	const contentLabel = CONTENT_LABELS[resource.contentType] || "Lectura compartida";
	const sourceLabel = getSourceLabel(resource.source);

	return (
		<section className="mx-auto w-full max-w-3xl py-8" aria-labelledby="shared-reading-title">
			<header className="mb-8 text-center">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">
					{isPrivate ? "Enlace privado" : contentLabel}
				</p>
				<h1 id="shared-reading-title" className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">
					{resource.title || resource.reference}
				</h1>
				{resource.dateLabel && <p className="mt-2 text-lg font-semibold text-[#b79b72]">{resource.dateLabel}</p>}
				{resource.celebration && <p className="mt-2 text-sm uppercase tracking-[0.08em] text-gray-600 dark:text-gray-300">{resource.celebration}</p>}
				{readingType && <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">{readingType}</p>}
			</header>

			<article className="rounded-lg border border-gray-100 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
				<p className="text-center text-lg font-semibold text-[#b79b72]">{resource.reference}</p>
				{resource.passageContent ? (
					<div className="mt-6 whitespace-pre-line text-lg leading-8 text-[#314156] dark:text-gray-100">
						{resource.passageContent}
					</div>
				) : (
					<blockquote className="mt-6 text-center text-xl font-medium italic leading-8 text-[#314156] dark:text-gray-100">
						“{resource.excerpt}”
					</blockquote>
				)}
				{resource.copyright && <p className="mt-6 text-sm text-[#b79b72]">{resource.copyright}</p>}
				<footer className="mt-6 border-t border-gray-200 pt-4 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
					{sourceLabel ? <p>Fuente: {sourceLabel}</p> : <p>Fuente original no disponible para este snapshot.</p>}
					{isPrivate && <p className="mt-1">Este enlace muestra únicamente el contenido compartido por su propietario.</p>}
				</footer>
			</article>
		</section>
	);
}
