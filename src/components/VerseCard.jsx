"use client";

import React, { useState, useEffect } from "react";
import {
	ArrowPathIcon,
	HeartIcon,
	ArrowLeftIcon,
	ArrowRightIcon,
	BookOpenIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

const VerseCard = ({
	verse,
	reference,
	verseId,
	chapterId,
	onNext,
	onPrevious,
	showNavigation = false,
}) => {
	const [isFavorite, setIsFavorite] = useState(false);
	const [fullPassage, setFullPassage] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showFullPassage, setShowFullPassage] = useState(false);

	const toggleFavorite = () => {
		setIsFavorite(!isFavorite);
		// En una implementación más completa, aquí guardaríamos el favorito en localStorage
	};

	const getFullPassage = async () => {
		if (!chapterId) {
			// Si no tenemos un chapterId, intentamos extraerlo del verseId
			if (verseId) {
				const parts = verseId.split(".");
				if (parts.length >= 2) {
					const extractedChapterId = `${parts[0]}.${parts[1]}`;
					fetchPassage(extractedChapterId);
				} else {
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
			if (!response.ok) {
				throw new Error("Error al obtener el pasaje");
			}
			const data = await response.json();
			setFullPassage(data);
			setShowFullPassage(true);
		} catch (error) {
			console.error("Error al obtener el pasaje completo:", error);
			alert(
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
						className="absolute left-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer flex items-center justify-start pl-2 opacity-0 hover:opacity-100 transition-opacity"
						aria-label="Anterior versículo"
					>
						<div className="bg-white rounded-full p-2 shadow-md">
							<ArrowLeftIcon className="w-5 h-5 text-gray-600" />
						</div>
					</div>

					{/* Área para "siguiente" (lado derecho) */}
					<div
						onClick={onNext}
						className="absolute right-0 top-0 bottom-0 w-1/4 z-10 cursor-pointer flex items-center justify-end pr-2 opacity-0 hover:opacity-100 transition-opacity"
						aria-label="Siguiente versículo"
					>
						<div className="bg-white rounded-full p-2 shadow-md">
							<ArrowRightIcon className="w-5 h-5 text-gray-600" />
						</div>
					</div>
				</>
			)}

			{/* Tarjeta del versículo */}
			<div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100">
				<div className="mb-4 text-center">
					<blockquote className="mb-4 text-xl italic text-gray-700">
						"{verse}"
					</blockquote>
					<p className="text-lg font-semibold text-gray-600">— {reference}</p>
				</div>

				{/* Botones de acción */}
				<div className="flex justify-center space-x-4">
					<button
						onClick={toggleFavorite}
						className="p-2 text-red-600 transition-colors rounded-full hover:bg-red-100"
						aria-label={
							isFavorite ? "Quitar de favoritos" : "Marcar como favorito"
						}
					>
						{isFavorite ? (
							<HeartSolidIcon className="w-6 h-6" />
						) : (
							<HeartIcon className="w-6 h-6" />
						)}
					</button>

					<button
						onClick={getFullPassage}
						disabled={isLoading}
						className="flex items-center space-x-1 px-3 py-2 text-blue-600 transition-colors rounded-full hover:bg-blue-100 disabled:opacity-50"
					>
						<BookOpenIcon className="w-5 h-5" />
						<span>{isLoading ? "Cargando..." : "Ver pasaje completo"}</span>
					</button>
				</div>
			</div>

			{/* Modal para mostrar el pasaje completo */}
			{showFullPassage && fullPassage && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto p-6">
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-semibold">{fullPassage.reference}</h3>
							<button
								onClick={closeFullPassage}
								className="text-gray-600 hover:text-gray-900"
							>
								✕
							</button>
						</div>
						<div
							className="prose prose-lg max-w-none"
							dangerouslySetInnerHTML={{ __html: fullPassage.content }}
						/>
						<div className="mt-4 text-sm text-gray-600">
							{fullPassage.copyright}
						</div>
						<div className="mt-6 flex justify-end">
							<button
								onClick={closeFullPassage}
								className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
