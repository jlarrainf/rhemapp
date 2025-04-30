"use client";

import React, { useState, useEffect } from "react";
import VerseCard from "@/components/VerseCard";

export default function RandomVerse() {
	const [verses, setVerses] = useState([]);
	const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);

	// Cargar versículos del archivo JSON
	useEffect(() => {
		const loadVerses = async () => {
			try {
				const response = await fetch("/data/verses.json");
				const data = await response.json();
				setVerses(data.verses);

				// Seleccionar un versículo aleatorio inicial
				const randomIndex = Math.floor(Math.random() * data.verses.length);
				setCurrentVerseIndex(randomIndex);

				// Inicializar el historial con el primer versículo
				setHistory([randomIndex]);
				setHistoryIndex(0);
			} catch (error) {
				console.error("Error al cargar versículos:", error);
			}
		};

		loadVerses();
	}, []);

	// Función para mostrar el siguiente versículo aleatorio
	const getNextVerse = () => {
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
	if (verses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-gray-700">
					Cargando versículo...
				</h1>
			</div>
		);
	}

	const currentVerse = verses[currentVerseIndex];

	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<h1 className="text-3xl font-bold text-gray-800 mb-8">
				Versículo Aleatorio
			</h1>

			<VerseCard
				verse={currentVerse.verse}
				reference={currentVerse.reference}
				verseId={currentVerse.verseId}
				chapterId={currentVerse.chapterId}
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
