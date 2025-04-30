"use client";

import React, { useState, useEffect } from "react";
import VerseCard from "@/components/VerseCard.jsx";

export default function RandomVerse() {
	const [verses, setVerses] = useState([]);
	const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Cargar versículos del archivo JSON
	useEffect(() => {
		const loadVerses = async () => {
			try {
				setLoading(true);
				setError(null);

				const response = await fetch("/data/verses.json");
				if (!response.ok) {
					throw new Error("No se pudo cargar el archivo de versículos");
				}

				const data = await response.json();
				if (!data || !Array.isArray(data.verses) || data.verses.length === 0) {
					throw new Error("El formato del archivo de versículos es incorrecto");
				}

				// Verificar que los versículos tienen el formato correcto
				const validVerses = data.verses.filter(
					(verse) => verse && verse.verse && verse.reference
				);

				if (validVerses.length === 0) {
					throw new Error("No se encontraron versículos válidos");
				}

				setVerses(validVerses);

				// Seleccionar un versículo aleatorio inicial
				const randomIndex = Math.floor(Math.random() * validVerses.length);
				setCurrentVerseIndex(randomIndex);

				// Inicializar el historial con el primer versículo
				setHistory([randomIndex]);
				setHistoryIndex(0);
			} catch (error) {
				console.error("Error al cargar versículos:", error);
				setError(error.message || "Error desconocido al cargar versículos");
			} finally {
				setLoading(false);
			}
		};

		loadVerses();
	}, []);

	// Función para mostrar el siguiente versículo aleatorio
	const getNextVerse = () => {
		if (verses.length <= 1) return;

		let randomIndex;
		do {
			randomIndex = Math.floor(Math.random() * verses.length);
		} while (randomIndex === currentVerseIndex);

		setCurrentVerseIndex(randomIndex);

		// Actualizar el historial
		const newHistory = history.slice(0, historyIndex + 1);
		newHistory.push(randomIndex);
		setHistory(newHistory);
		setHistoryIndex(newHistory.length - 1);
	};

	// Función para mostrar el versículo anterior del historial
	const getPreviousVerse = () => {
		if (historyIndex > 0) {
			setHistoryIndex(historyIndex - 1);
			setCurrentVerseIndex(history[historyIndex - 1]);
		}
	};

	// Si aún no se han cargado los versículos, mostrar un mensaje de carga
	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-gray-700">
					Cargando versículo...
				</h1>
			</div>
		);
	}

	// Si hay un error, mostrarlo
	if (error || verses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-red-600 mb-4">
					Error al cargar los versículos
				</h1>
				<p className="text-gray-600">
					{error || "No se pudieron cargar los versículos"}
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

	const currentVerse = verses[currentVerseIndex] || {};

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<h1 className="text-3xl font-bold text-gray-800 mb-8">
				Versículo Aleatorio
			</h1>

			<VerseCard
				verse={currentVerse.verse || ""}
				reference={currentVerse.reference || ""}
				verseId={currentVerse.verseId || ""}
				chapterId={currentVerse.chapterId || ""}
				onNext={getNextVerse}
				onPrevious={getPreviousVerse}
				showNavigation={true}
			/>

			<div className="mt-8 text-gray-600">
				<p>Haz clic en "Siguiente" para ver otro versículo aleatorio</p>
				<p>Haz clic en "Anterior" para volver al versículo previo</p>
			</div>
		</div>
	);
}
