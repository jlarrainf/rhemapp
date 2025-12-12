"use client";

import React, { useMemo, useState } from "react";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import RosaryIcon from "@/components/RosaryIcon.jsx";

export default function RosarioClient({ days, byDayIndex, initialDayIndex }) {
	const [dayIndex, setDayIndex] = useState(initialDayIndex);
	const [fullPassage, setFullPassage] = useState(null);
	const [showFullPassage, setShowFullPassage] = useState(false);
	const [selectedMisterioIndex, setSelectedMisterioIndex] = useState(null);

	const { type: tipoMisterio, mysteries: misterios } = useMemo(() => {
		return byDayIndex?.[dayIndex] || { type: "", mysteries: [] };
	}, [byDayIndex, dayIndex]);

	const diaSeleccionado = days?.[dayIndex] || "";

	const handleDiaChange = (e) => {
		const nuevoDia = e.target.value;
		const newIndex = days.findIndex((d) => d === nuevoDia);
		setDayIndex(newIndex === -1 ? initialDayIndex : newIndex);
	};

	const verPasajeCompleto = async (index) => {
		setSelectedMisterioIndex(index);
		try {
			const misterio = misterios[index];
			let passageId = misterio?.chapterId || "";

			if (!passageId && misterio?.verseId) {
				const parts = misterio.verseId.split(".");
				if (parts.length >= 2) {
					passageId = `${parts[0]}.${parts[1]}`;
				}
			}

			if (!passageId) {
				throw new Error("No se pudo determinar el ID del pasaje");
			}

			const response = await fetch(
				`/api/passage?passageId=${encodeURIComponent(passageId)}`
			);
			if (!response.ok) {
				throw new Error("Error al obtener el pasaje");
			}

			const data = await response.json();
			setFullPassage({
				content: data.content,
				reference: data.reference,
				copyright: data.copyright,
			});
			setShowFullPassage(true);
		} catch (error) {
			console.error("Error al obtener el pasaje completo:", error);
			alert(
				"No se pudo cargar el pasaje completo. Por favor, intenta de nuevo."
			);
		}
	};

	const cerrarPasajeCompleto = () => {
		setShowFullPassage(false);
		setFullPassage(null);
	};

	return (
		<div className="flex flex-col items-center justify-center py-8 px-4">
			<div className="mb-8 text-center">
				<RosaryIcon className="w-14 h-14 mx-auto mb-4 text-[#314156] dark:text-gray-100 transition-colors duration-300" />
				<h1 className="text-3xl font-bold text-[#314156] dark:text-gray-100 transition-colors duration-300 mb-2">
					Misterios del Rosario
				</h1>
				<p className="text-xl text-[#b79b72] mb-2 font-semibold">
					{tipoMisterio}
				</p>
				{/* SEO: texto estable que explica la función de la página. */}
				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-left max-w-2xl mx-auto">
					Medita los misterios del rosario según el día de la semana, con su
					cita bíblica y versículo correspondiente. Puedes cambiar de día y
					consultar el pasaje completo.
				</p>

				<div className="flex items-center justify-center mb-4 mt-2">
					<label
						htmlFor="dia-select"
						className="mr-2 text-gray-600 dark:text-gray-300 transition-colors duration-300"
					>
						Misterios del día:
					</label>
					<select
						id="dia-select"
						value={diaSeleccionado}
						onChange={handleDiaChange}
						className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b79b72]/50 focus:border-[#b79b72] capitalize dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 transition-colors duration-300"
					>
						{days.map((dia) => (
							<option key={dia} value={dia} className="capitalize">
								{dia}
							</option>
						))}
					</select>
				</div>
			</div>

			<div className="w-full max-w-3xl">
				{misterios.map((misterio, index) => (
					<div
						key={index}
						className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-[#b79b72] transition-all"
					>
						<div className="p-6">
							<h2 className="text-xl font-semibold text-[#314156] dark:text-[#b79b72] mb-2 flex items-center">
								<span className="flex items-center justify-center bg-[#b79b72] text-white w-8 h-8 rounded-full mr-3 text-sm">
									{index + 1}
								</span>
								{misterio.titulo}
							</h2>
							<p className="text-gray-600 dark:text-gray-300 mb-4 pl-11">
								{misterio.descripcion}
							</p>
							<div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border-l-4 border-[#b79b72]">
								<p className="italic text-gray-700 dark:text-gray-200 mb-1">
									{misterio.versiculo}
								</p>
								<p className="text-sm text-[#b79b72] text-right">
									— {misterio.cita}
								</p>
							</div>

							<div className="mt-4 flex justify-center">
								<button
									onClick={() => verPasajeCompleto(index)}
									className="flex items-center space-x-1 px-4 py-2 text-[#314156] dark:text-gray-200 transition-all duration-300 rounded-full hover:bg-[#b79b72]/20 dark:hover:bg-[#b79b72]/30"
								>
									<BookOpenIcon className="w-5 h-5 mr-1" />
									<span>Ver pasaje completo</span>
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{showFullPassage && fullPassage && (
				<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div
						className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-auto p-6 shadow-xl dark:shadow-black/30 border dark:border-gray-700 transition-colors duration-300"
						role="dialog"
						aria-modal="true"
					>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-xl font-semibold text-[#314156] dark:text-gray-100 transition-colors duration-300">
								{fullPassage.reference ||
									(selectedMisterioIndex !== null &&
										misterios[selectedMisterioIndex]?.cita)}
							</h3>
							<button
								onClick={cerrarPasajeCompleto}
								aria-label="Cerrar pasaje completo"
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
								onClick={cerrarPasajeCompleto}
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
}
