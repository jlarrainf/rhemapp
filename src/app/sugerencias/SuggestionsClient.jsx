"use client";

import { useState } from "react";
import SuggestionForm from "@/components/SuggestionForm.jsx";

const STATUS_LABELS = {
	pending: "Pendiente",
	in_review: "En revisión",
	approved: "Aprobada",
	rejected: "Rechazada",
	needs_changes: "Necesita cambios",
	published: "Publicada",
};

const TYPE_LABELS = {
	"first-reading": "Primera lectura",
	psalm: "Salmo",
	"second-reading": "Segunda lectura",
	gospel: "Evangelio",
};

function formatDate(value) {
	if (!value) return "";
	const parsed = new Date(`${value}T12:00:00Z`);
	return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("es-CL", { dateStyle: "long", timeZone: "UTC" }).format(parsed);
}

function formatDateTime(value) {
	if (!value) return "";
	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santiago" }).format(parsed);
}

export default function SuggestionsClient({ initialSuggestions = [] }) {
	const [suggestions, setSuggestions] = useState(initialSuggestions);

	return (
		<section className="mx-auto w-full max-w-3xl space-y-6 py-8" aria-labelledby="suggestions-title">
			<header>
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Participación</p>
				<h1 id="suggestions-title" className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">Sugerencias de lecturas</h1>
				<p className="mt-2 text-gray-600 dark:text-gray-300">Ayuda a mantener el calendario litúrgico de Chile confiable y trazable.</p>
			</header>
			<SuggestionForm onCreated={(suggestion) => setSuggestions((current) => [suggestion, ...current])} />
			<section aria-labelledby="my-suggestions-title" className="space-y-4">
				<h2 id="my-suggestions-title" className="text-xl font-semibold text-[#314156] dark:text-gray-100">Mis sugerencias</h2>
				{suggestions.length === 0 ? (
					<p className="rounded-lg border border-dashed border-gray-300 p-6 text-gray-600 dark:border-gray-700 dark:text-gray-300">Todavía no has enviado sugerencias.</p>
				) : suggestions.map((suggestion) => (
					<article key={suggestion.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b79b72]">{TYPE_LABELS[suggestion.readingType] || "Lectura"}</p>
								<h3 className="mt-1 text-lg font-semibold text-[#314156] dark:text-gray-100">{suggestion.reference}</h3>
							</div>
							<span className="rounded-full border border-[#b79b72]/50 px-3 py-1 text-sm text-[#314156] dark:text-gray-100">{STATUS_LABELS[suggestion.status] || suggestion.status}</span>
						</div>
						<p className="mt-3 text-sm text-gray-600 dark:text-gray-300">Fecha propuesta: {formatDate(suggestion.date)}</p>
						<p className="mt-3 whitespace-pre-wrap text-gray-700 dark:text-gray-200">{suggestion.body}</p>
						<a href={suggestion.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-[#314156] underline decoration-[#b79b72] underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:text-gray-100">Ver fuente indicada</a>
						<p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Enviada el {formatDateTime(suggestion.createdAt)}</p>
					</article>
				))}
			</section>
		</section>
	);
}
