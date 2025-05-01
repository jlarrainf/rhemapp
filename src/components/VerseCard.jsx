"use client";

import React, { useState, useEffect } from "react";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	BookOpenIcon,
} from "@heroicons/react/24/outline";
import { useTheme } from "./ThemeContext";

const VerseCard = ({
	verse,
	reference,
	verseId,
	chapterId,
	onNext,
	onPrevious,
	showNavigation = false,
}) => {
	const [fullPassage, setFullPassage] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showFullPassage, setShowFullPassage] = useState(false);
	const [errorMessage, setErrorMessage] = useState(null);
	const { isDarkMode } = useTheme();

	const getFullPassage = async () => {
		setErrorMessage(null);
		if (!chapterId) {
			// Si no tenemos un chapterId, intentamos extraerlo del verseId
			if (verseId) {
				const parts = verseId.split(".");
				if (parts.length >= 2) {
					const extractedChapterId = `${parts[0]}.${parts[1]}`;
					fetchPassage(extractedChapterId);
				} else {
					setErrorMessage("No se pudo determinar el capítulo de la referencia");
					console.error("No se pudo determinar el chapterId del versículo");
				}
			}
		} else {
			fetchPassage(chapterId);
		}
	};

	const fetchPassage = async (passageId) => {
		setIsLoading(true);
		try {
			const bibleId = "592420522e16049f-01"; // Usando una versión en español por defecto
			const response = await fetch(
				`/api/passage?bibleId=${bibleId}&passageId=${passageId}`
			);

			const data = await response.json();

			if (!response.ok || data.error) {
				throw new Error(data.error || "Error al obtener el pasaje");
			}

			// Verificar que tenemos todos los campos necesarios
			if (!data.content || !data.reference) {
				throw new Error("Los datos del pasaje están incompletos");
			}

			setFullPassage(data);
			setShowFullPassage(true);
		} catch (error) {
			console.error("Error al obtener el pasaje completo:", error);
			setErrorMessage(
				"No se pudo cargar el pasaje completo. Por favor, intenta de nuevo."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const closeFullPassage = () => {
		setShowFullPassage(false);
	};

	return (
		<div className="relative w-full max-w-2xl mx-auto">
			{/* Áreas de navegación a los lados de la tarjeta */}
			{showNavigation && (
				<>
					{/* Área para "anterior" (lado izquierdo) */}
					<div
						onClick={onPrevious}
						className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity duration-300"
						aria-label="Anterior versículo"
					>
						<div className="bg-white dark:bg-gray-700 rounded-full p-2 shadow-md backdrop-blur-sm transition-colors duration-300">
							<ArrowLeftIcon className="w-5 h-5 text-[#314156] dark:text-gray-100" />
						</div>
					</div>

					{/* Área para "siguiente" (lado derecho) */}
					<div
						onClick={onNext}
						className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity duration-300"
						aria-label="Siguiente versículo"
					>
						<div className="bg-white dark:bg-gray-700 rounded-full p-2 shadow-md backdrop-blur-sm transition-colors duration-300">
							<ArrowRightIcon className="w-5 h-5 text-[#314156] dark:text-gray-100" />
						</div>
					</div>
				</>
			)}

			{/* Tarjeta del versículo */}
			<div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 hover:border-[#b79b72] dark:hover:border-[#b79b72]/80 transition-all duration-300">
				<div className="mb-4 text-center">
					<blockquote className="mb-4 text-xl italic text-[#314156] dark:text-gray-100 font-medium transition-colors duration-300">
						"{verse}"
					</blockquote>
					<p className="text-lg font-semibold text-[#b79b72] dark:text-[#b79b72]/90 transition-colors duration-300">
						— {reference}
					</p>
				</div>

				{/* Botones de acción */}
				<div className="flex justify-center">
					<button
						onClick={getFullPassage}
						disabled={isLoading}
						className="flex items-center space-x-1 px-4 py-2 text-[#314156] dark:text-gray-200 transition-all duration-300 rounded-full hover:bg-[#b79b72]/20 dark:hover:bg-[#b79b72]/30 disabled:opacity-50"
					>
						<BookOpenIcon className="w-5 h-5" />
						<span>{isLoading ? "Cargando..." : "Ver pasaje completo"}</span>
					</button>
				</div>

				{/* Mensaje de error */}
				{errorMessage && (
					<div className="mt-3 text-center text-red-500 dark:text-red-400 text-sm transition-colors duration-300">
						{errorMessage}
					</div>
				)}
			</div>

			{/* Modal para mostrar el pasaje completo */}
			{showFullPassage && fullPassage && fullPassage.content && (
				<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto p-6 shadow-xl dark:shadow-black/30 border dark:border-gray-700 transition-colors duration-300">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-semibold text-[#314156] dark:text-gray-100 transition-colors duration-300">
								{fullPassage.reference}
							</h3>
							<button
								onClick={closeFullPassage}
								className="text-gray-600 hover:text-[#314156] dark:text-gray-400 dark:hover:text-gray-100 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
							>
								✕
							</button>
						</div>
						<div
							className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-[#314156] dark:prose-headings:text-gray-100 prose-a:text-[#b79b72] dark:prose-a:text-[#b79b72]/90 transition-colors duration-300"
							dangerouslySetInnerHTML={{ __html: fullPassage.content }}
						/>
						<div className="mt-4 text-sm text-[#b79b72] dark:text-[#b79b72]/80 transition-colors duration-300">
							{fullPassage.copyright}
						</div>
						<div className="mt-6 flex justify-end">
							<button
								onClick={closeFullPassage}
								className="px-4 py-2 bg-[#314156] text-white dark:bg-[#b79b72] dark:text-gray-900 rounded hover:bg-[#314156]/90 dark:hover:bg-[#b79b72]/90 transition-colors duration-300"
							>
								Cerrar
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default VerseCard;
