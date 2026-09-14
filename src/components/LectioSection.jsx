"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { buildFallbackQuestions } from "@/lib/lectio/fallback.js";

const CATEGORY_LABELS = {
	observe: "Observar",
	meditate: "Meditar",
	pray: "Orar",
	act: "Actuar",
};

function localFallback() {
	return {
		generated: false,
		status: "fallback",
		questions: buildFallbackQuestions(),
	};
}

export default function LectioSection({ readingKey }) {
	const [isOpen, setIsOpen] = useState(false);
	const [adaptation, setAdaptation] = useState(() => localFallback());
	const [isLoading, setIsLoading] = useState(Boolean(readingKey));
	const [error, setError] = useState("");
	const contentId = useId().replace(/:/g, "");

	useEffect(() => {
		setIsOpen(false);
		if (!readingKey) {
			setIsLoading(false);
			setAdaptation(localFallback());
			return undefined;
		}

		const controller = new AbortController();
		setIsLoading(true);
		setError("");
		fetch(`/api/lectio?readingKey=${encodeURIComponent(readingKey)}`, {
			cache: "no-store",
			headers: { Accept: "application/json" },
			signal: controller.signal,
		})
			.then(async (response) => {
				const data = await response.json().catch(() => ({}));
				if (!response.ok || !Array.isArray(data.questions) || data.questions.length !== 4) {
					throw new Error(data.error || "No se pudo cargar la reflexión asistida");
				}
				setAdaptation(data);
			})
			.catch((cause) => {
				if (cause?.name === "AbortError") return;
				setAdaptation(localFallback());
				setError("Se muestra una reflexión general mientras se recuperan las preguntas.");
			})
			.finally(() => setIsLoading(false));

		return () => controller.abort();
	}, [readingKey]);

	const questions = Array.isArray(adaptation?.questions) && adaptation.questions.length === 4
		? adaptation.questions
		: buildFallbackQuestions();
	const hasGeneralFallback = questions.some((question) => question.general === true) || adaptation?.generated !== true;

	return (
		<section className="mt-8 w-full max-w-3xl rounded-2xl border border-[#b79b72]/50 bg-white/80 p-4 shadow-sm dark:bg-gray-800/80 sm:p-6" aria-labelledby={`${contentId}-title`}>
			<button
				type="button"
				className="flex min-h-11 w-full items-center justify-between gap-4 rounded-lg text-left text-[#314156] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] dark:text-gray-100"
				aria-expanded={isOpen}
				aria-controls={contentId}
				onClick={() => setIsOpen((current) => !current)}
			>
				<span>
					<span id={`${contentId}-title`} className="block text-lg font-semibold">Lectio divina</span>
					<span className="mt-1 block text-sm font-normal text-gray-600 dark:text-gray-300">Preguntas de reflexión asistida</span>
				</span>
				<ChevronDownIcon className={`h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
			</button>

			{isOpen && (
				<div id={contentId} className="mt-5 border-t border-gray-200 pt-5 dark:border-gray-700">
					<p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
						Esta es una reflexión asistida. No es enseñanza oficial de la Iglesia ni consejo pastoral, médico o psicológico.
					</p>
					{isLoading && <p className="mt-4 text-sm text-gray-500 dark:text-gray-400" role="status">Cargando preguntas de reflexión…</p>}
					{!isLoading && hasGeneralFallback && (
						<p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200" role="status">
							Reflexión general: no hay una adaptación específica disponible en este momento.
						</p>
					)}
					{error && <p className="mt-3 text-sm text-amber-700 dark:text-amber-300" role="status">{error}</p>}
					<ol className="mt-5 space-y-4">
						{questions.map((question) => (
							<li key={question.category} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
								<p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#b79b72]">{CATEGORY_LABELS[question.category] || "Reflexión"}</p>
								<p className="mt-2 leading-7 text-[#314156] dark:text-gray-100">{question.text}</p>
							</li>
						))}
					</ol>
				</div>
			)}
		</section>
	);
}
