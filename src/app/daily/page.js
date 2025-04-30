"use client";

import React, { useState, useEffect } from "react";
import DateObject from "react-date-object";
import VerseCard from "@/components/VerseCard";

export default function DailyVerse() {
	const [verse, setVerse] = useState(null);
	const [currentDate, setCurrentDate] = useState(new DateObject());
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadDailyVerse = async () => {
			try {
				setLoading(true);
				const response = await fetch("/data/verses.json");
				const data = await response.json();

				// Formato MM-DD (mes-día) para encontrar el versículo del día
				const today = `${String(currentDate.month).padStart(2, "0")}-${String(
					currentDate.day
				).padStart(2, "0")}`;

				// Buscar si hay un versículo específico para hoy
				let todayVerse = data.dailyVerses.find((item) => item.date === today);

				// Si no hay un versículo específico para hoy, usar uno aleatorio
				if (!todayVerse) {
					const randomIndex = Math.floor(Math.random() * data.verses.length);
					todayVerse = {
						...data.verses[randomIndex],
						isRandom: true,
					};
				}

				setVerse(todayVerse);
				setLoading(false);
			} catch (error) {
				console.error("Error al cargar el versículo diario:", error);
				setLoading(false);
			}
		};

		loadDailyVerse();
	}, [currentDate]);

	if (loading || !verse) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-gray-700">
					Cargando versículo del día...
				</h1>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<h1 className="text-3xl font-bold text-gray-800 mb-2">Lectura del Día</h1>
			<p className="text-xl text-gray-600 mb-8">
				{currentDate.format("DD de MMMM, YYYY")}
			</p>

			<VerseCard
				verse={verse.verse}
				reference={verse.reference}
				verseId={verse.verseId}
				chapterId={verse.chapterId}
				showNavigation={false}
			/>

			{verse.isRandom && (
				<div className="mt-4 text-gray-500 text-sm">
					<p>
						No hay un versículo específico para hoy, mostrando uno aleatorio.
					</p>
				</div>
			)}
		</div>
	);
}
