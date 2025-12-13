"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CalendarIcon } from "@heroicons/react/24/outline";
import VerseCard from "@/components/VerseCard.jsx";

function formatDateLocal(date) {
	const options = { day: "2-digit", month: "long", year: "numeric" };
	return date.toLocaleDateString("es-ES", options);
}

function getCurrentDateKeyLocal(date) {
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${month}-${day}`;
}

function stableIndex(seed, modulo) {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
	}
	return modulo > 0 ? hash % modulo : 0;
}

export default function DailyVerseClient({
	initialVerse,
	initialError,
	initialDateKey,
	initialDateLabel,
}) {
	const [verse, setVerse] = useState(initialVerse);
	const [error, setError] = useState(initialError);
	const [dateKey, setDateKey] = useState(initialDateKey);
	const [dateLabel, setDateLabel] = useState(initialDateLabel);
	const [loading, setLoading] = useState(false);

	const shouldAttemptClientUpdate = useMemo(() => {
		// Siempre intentamos sincronizar fecha con el dispositivo.
		// Solo refetch si cambia el día o si no hay versículo inicial.
		return true;
	}, []);

	useEffect(() => {
		if (!shouldAttemptClientUpdate) return;

		const now = new Date();
		const localDateKey = getCurrentDateKeyLocal(now);
		const localDateLabel = formatDateLocal(now);

		setDateKey(localDateKey);
		setDateLabel(localDateLabel);

		const needsFetch = !verse || localDateKey !== initialDateKey;
		if (!needsFetch) return;

		let cancelled = false;

		const load = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch("/api/verses?scope=daily");
				if (!response.ok) {
					throw new Error("No se pudo cargar el archivo de versículos");
				}

				const data = await response.json();
				if (!data || !Array.isArray(data.verses)) {
					throw new Error("El formato del archivo de versículos es incorrecto");
				}

				let todayVerse = Array.isArray(data.dailyVerses)
					? data.dailyVerses.find((item) => item?.date === localDateKey)
					: null;

				if (!todayVerse && data.verses.length > 0) {
					const idx = stableIndex(localDateKey, data.verses.length);
					todayVerse = {
						...(data.verses[idx] || {}),
						isRandom: true,
					};
				}

				if (!todayVerse || !todayVerse.verse || !todayVerse.reference) {
					throw new Error("No se pudo obtener un versículo válido para hoy");
				}

				if (cancelled) return;
				setVerse(todayVerse);
			} catch (e) {
				if (cancelled) return;
				console.error("Error al cargar el versículo diario (cliente):", e);
				setError(e?.message || "Error desconocido al cargar el versículo");
			} finally {
				if (cancelled) return;
				setLoading(false);
			}
		};

		load();
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	if (loading && !verse) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<div className="mb-8 text-center">
					<CalendarIcon className="w-14 h-14 mx-auto mb-4 text-[#314156] dark:text-gray-100 transition-colors duration-300" />
					<h1 className="text-3xl font-bold text-[#314156] dark:text-gray-100 mb-2 transition-colors duration-300">
						Lectura del Día
					</h1>
					<p className="text-xl text-[#b79b72] mb-2 font-semibold transition-colors duration-300">
						{dateLabel}
					</p>
					<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center max-w-2xl mx-auto">
						Cargando versículo…
					</p>
				</div>
			</div>
		);
	}

	if (error || !verse) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-red-600 mb-4">
					Error al cargar el versículo
				</h1>
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center max-w-2xl">
					{error || "No se pudo cargar el versículo del día"}
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<div className="mb-8 text-center">
				<CalendarIcon className="w-14 h-14 mx-auto mb-4 text-[#314156] dark:text-gray-100 transition-colors duration-300" />
				<h1 className="text-3xl font-bold text-[#314156] dark:text-gray-100 mb-2 transition-colors duration-300">
					Lectura del Día
				</h1>
				<p className="text-xl text-[#b79b72] mb-2 font-semibold transition-colors duration-300">
					{dateLabel}
				</p>
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center max-w-2xl mx-auto">
					Lee el versículo bíblico del día para meditar la Palabra de Dios. Cada
					fecha presenta una lectura breve y accesible, con opción de ver el
					pasaje completo.
				</p>
			</div>

			<VerseCard
				verse={verse.verse || ""}
				reference={verse.reference || ""}
				verseId={verse.verseId || ""}
				chapterId={verse.chapterId || ""}
				showNavigation={false}
			/>

			{verse.isRandom && (
				<div className="mt-4 text-gray-500 dark:text-gray-400 text-sm transition-colors duration-300 text-center">
					<p>
						No hay un versículo específico para hoy, mostrando uno seleccionado
						por fecha.
					</p>
				</div>
			)}

			{/* Si el día del dispositivo difiere del server/Chile, mantenemos el aviso solo si hubo fallback; no mostramos nada extra. */}
		</div>
	);
}
