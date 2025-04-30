"use client";

import React, { useState, useEffect } from "react";
import VerseCard from "@/components/VerseCard.jsx";

export default function DailyVerse() {
	const [verse, setVerse] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentDate, setCurrentDate] = useState(null);

	// Función simple para formatear la fecha sin dependencias externas
	const formatDate = () => {
		const date = new Date();
		const options = { day: "2-digit", month: "long", year: "numeric" };
		return date.toLocaleDateString("es-ES", options);
	};

	// Función para obtener el formato MM-DD de la fecha actual
	const getCurrentDateFormat = () => {
		const date = new Date();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${month}-${day}`;
	};

	useEffect(() => {
		const loadDailyVerse = async () => {
			try {
				setLoading(true);
				setError(null);

				// Establece la fecha actual
				setCurrentDate(formatDate());

				const response = await fetch("/data/verses.json");
				if (!response.ok) {
					throw new Error("No se pudo cargar el archivo de versículos");
				}

				const data = await response.json();
				if (!data || !data.verses || !data.dailyVerses) {
					throw new Error("El formato del archivo de versículos es incorrecto");
				}

				// Formato MM-DD (mes-día) para encontrar el versículo del día
				const today = getCurrentDateFormat();

				// Buscar si hay un versículo específico para hoy
				let todayVerse = data.dailyVerses.find((item) => item.date === today);

				// Si no hay un versículo específico para hoy, usar uno aleatorio
				if (!todayVerse && data.verses && data.verses.length > 0) {
					const randomIndex = Math.floor(Math.random() * data.verses.length);
					todayVerse = {
						...(data.verses[randomIndex] || {}),
						isRandom: true,
					};
				}

				// Verificar que todayVerse tiene todas las propiedades necesarias
				if (!todayVerse || !todayVerse.verse || !todayVerse.reference) {
					throw new Error("No se pudo obtener un versículo válido para hoy");
				}

				setVerse(todayVerse);
			} catch (error) {
				console.error("Error al cargar el versículo diario:", error);
				setError(error.message || "Error desconocido al cargar el versículo");
			} finally {
				setLoading(false);
			}
		};

		loadDailyVerse();
	}, []);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-gray-700">
					Cargando versículo del día...
				</h1>
			</div>
		);
	}

	if (error || !verse) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-red-600 mb-4">
					Error al cargar el versículo
				</h1>
				<p className="text-gray-600">
					{error || "No se pudo cargar el versículo del día"}
				</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Reintentar
				</button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<h1 className="text-3xl font-bold text-gray-800 mb-2">Lectura del Día</h1>
			<p className="text-xl text-gray-600 mb-8">{currentDate}</p>

			<VerseCard
				verse={verse.verse || ""}
				reference={verse.reference || ""}
				verseId={verse.verseId || ""}
				chapterId={verse.chapterId || ""}
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
