"use client";

import React, { useEffect, useState } from "react";
import VerseCard from "@/components/VerseCard.jsx";

export default function RandomVerseClient() {
	const [verses, setVerses] = useState([]);
	const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
	const [history, setHistory] = useState([]);
	const [historyIndex, setHistoryIndex] = useState(-1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const loadVerses = async () => {
			try {
				setLoading(true);
				setError(null);

				// Performance: pedimos solo los versículos necesarios para /random.
				const response = await fetch("/api/verses?scope=random");
				if (!response.ok) {
					throw new Error("No se pudo cargar el archivo de versículos");
				}

				const data = await response.json();
				if (!data || !Array.isArray(data.verses) || data.verses.length === 0) {
					throw new Error("El formato del archivo de versículos es incorrecto");
				}

				const validVerses = data.verses.filter(
					(verse) => verse && verse.verse && verse.reference
				);

				if (validVerses.length === 0) {
					throw new Error("No se encontraron versículos válidos");
				}

				setVerses(validVerses);

				const randomIndex = Math.floor(Math.random() * validVerses.length);
				setCurrentVerseIndex(randomIndex);
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

	const getNextVerse = () => {
		if (verses.length <= 1) return;

		let randomIndex;
		do {
			randomIndex = Math.floor(Math.random() * verses.length);
		} while (randomIndex === currentVerseIndex);

		setCurrentVerseIndex(randomIndex);

		const newHistory = history.slice(0, historyIndex + 1);
		newHistory.push(randomIndex);
		setHistory(newHistory);
		setHistoryIndex(newHistory.length - 1);
	};

	const getPreviousVerse = () => {
		if (historyIndex > 0) {
			setHistoryIndex(historyIndex - 1);
			setCurrentVerseIndex(history[historyIndex - 1]);
		}
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh]">
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
					Cargando versículo…
				</p>
			</div>
		);
	}

	if (error || verses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[50vh]">
				<p className="text-red-600 mb-4">Error al cargar los versículos</p>
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
					{error || "No se pudieron cargar los versículos"}
				</p>
				<button
					onClick={() => window.location.reload()}
					className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 dark:bg-secondary dark:text-gray-900 dark:hover:bg-secondary/90 transition-colors duration-300"
				>
					Reintentar
				</button>
			</div>
		);
	}

	const currentVerse = verses[currentVerseIndex] || {};

	return (
		<VerseCard
			verse={currentVerse.verse || ""}
			reference={currentVerse.reference || ""}
			verseId={currentVerse.verseId || ""}
			chapterId={currentVerse.chapterId || ""}
			onNext={getNextVerse}
			onPrevious={getPreviousVerse}
			showNavigation={true}
		/>
	);
}
