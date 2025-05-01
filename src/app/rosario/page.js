"use client";

import React, { useState, useEffect } from "react";
import { ArrowDownCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function RosarioPage() {
	const [misterios, setMisterios] = useState([]);
	const [tipoMisterio, setTipoMisterio] = useState("");
	const [loading, setLoading] = useState(true);
	const [diaActual, setDiaActual] = useState("");
	const [diaSeleccionado, setDiaSeleccionado] = useState("");

	const dias = [
		"domingo",
		"lunes",
		"martes",
		"miércoles",
		"jueves",
		"viernes",
		"sábado",
	];

	// Función para determinar los misterios según el día
	const determinarMisterios = (diaSemana) => {
		setLoading(true);

		let diaIndex;
		if (typeof diaSemana === "number") {
			// Si se proporciona el índice numérico del día
			diaIndex = diaSemana;
		} else {
			// Si se proporciona el nombre del día
			diaIndex = dias.findIndex((dia) => dia === diaSemana.toLowerCase());
			if (diaIndex === -1) {
				// Si no se encuentra el día, usamos el día actual
				diaIndex = new Date().getDay();
			}
		}

		setDiaActual(dias[diaIndex]);

		let tipo = "";
		let listaMisterios = [];

		// Determinar el tipo de misterios según el día
		if (diaIndex === 1 || diaIndex === 6) {
			// Lunes o Sábado
			tipo = "Misterios Gozosos";
			listaMisterios = [
				{
					titulo: "La Anunciación del Ángel a María",
					descripcion:
						"El ángel Gabriel anuncia a María que será la madre del Hijo de Dios.",
					cita: "Lucas 1:28",
					versiculo: "«Alégrate, llena de gracia, el Señor está contigo.»",
				},
				{
					titulo: "La Visita de María a su prima Isabel",
					descripcion:
						"María visita a su prima Isabel, quien la reconoce como la madre del Mesías.",
					cita: "Lucas 1:42",
					versiculo:
						"«¡Bendita tú entre las mujeres y bendito el fruto de tu vientre!»",
				},
				{
					titulo: "El Nacimiento de Jesús en Belén",
					descripcion:
						"Jesús nace en un pesebre en Belén, cumpliendo las profecías.",
					cita: "Lucas 2:7",
					versiculo:
						"Y dio a luz a su hijo primogénito, lo envolvió en pañales y lo acostó en un pesebre.",
				},
				{
					titulo: "La Presentación de Jesús en el Templo",
					descripcion:
						"María y José presentan a Jesús en el Templo según la ley de Moisés.",
					cita: "Lucas 2:22-23",
					versiculo:
						"Llevaron a Jesús a Jerusalén para presentarlo al Señor, como está escrito en la ley del Señor.",
				},
				{
					titulo: "El Niño Jesús perdido y hallado en el Templo",
					descripcion:
						"Jesús, a los 12 años, es encontrado en el Templo discutiendo con los doctores de la Ley.",
					cita: "Lucas 2:46",
					versiculo:
						"Al tercer día lo encontraron en el templo, sentado en medio de los maestros, escuchándolos y haciéndoles preguntas.",
				},
			];
		} else if (diaIndex === 4) {
			// Jueves
			tipo = "Misterios Luminosos";
			listaMisterios = [
				{
					titulo: "El Bautismo de Jesús en el Jordán",
					descripcion:
						"Jesús es bautizado por Juan el Bautista, y Dios lo proclama su Hijo amado.",
					cita: "Mateo 3:17",
					versiculo:
						"Y una voz que venía de los cielos decía: «Este es mi Hijo amado, en quien me complazco.»",
				},
				{
					titulo: "Las Bodas de Caná",
					descripcion:
						"Jesús realiza su primer milagro, convirtiendo el agua en vino en las Bodas de Caná.",
					cita: "Juan 2:7-8",
					versiculo:
						"Jesús les dice: «Llenen las tinajas de agua.» Y las llenaron hasta el borde.",
				},
				{
					titulo: "El Anuncio del Reino de Dios",
					descripcion:
						"Jesús predica sobre el Reino de Dios y llama al arrepentimiento.",
					cita: "Marcos 1:15",
					versiculo:
						"«El tiempo se ha cumplido y el Reino de Dios está cerca; conviértanse y crean en la Buena Nueva.»",
				},
				{
					titulo: "La Transfiguración de Jesús",
					descripcion:
						"Jesús se transfigura ante Pedro, Santiago y Juan, revelando su gloria divina.",
					cita: "Mateo 17:2",
					versiculo:
						"Y se transfiguró delante de ellos: su rostro se puso brillante como el sol y sus vestidos se volvieron blancos como la luz.",
				},
				{
					titulo: "La Institución de la Eucaristía",
					descripcion:
						"Jesús establece la Eucaristía en la Última Cena con sus discípulos.",
					cita: "Lucas 22:19",
					versiculo:
						"Y tomó pan, dio gracias, lo partió y lo dio a sus discípulos, diciendo: «Esto es mi cuerpo, que se entrega por ustedes; hagan esto en memoria mía.»",
				},
			];
		} else if (diaIndex === 2 || diaIndex === 5) {
			// Martes o Viernes
			tipo = "Misterios Dolorosos";
			listaMisterios = [
				{
					titulo: "La Oración de Jesús en el Huerto",
					descripcion:
						"Jesús ora en el Huerto de Getsemaní antes de su arresto.",
					cita: "Mateo 26:39",
					versiculo:
						"Y adelantándose un poco, cayó rostro en tierra, y suplicaba así: «Padre mío, si es posible, que pase de mí este cáliz, pero no sea como yo quiero, sino como quieres tú.»",
				},
				{
					titulo: "La Flagelación de Jesús",
					descripcion: "Jesús es azotado por orden de Pilato.",
					cita: "Juan 19:1",
					versiculo: "Pilato entonces tomó a Jesús y mandó azotarle.",
				},
				{
					titulo: "La Coronación de espinas",
					descripcion:
						"Los soldados coronan a Jesús con espinas y se burlan de él.",
					cita: "Mateo 27:29",
					versiculo:
						"Y trenzando una corona de espinas, se la pusieron sobre su cabeza, y en su mano derecha una caña; y doblando la rodilla delante de él, le hacían burla diciendo: «¡Salve, Rey de los judíos!»",
				},
				{
					titulo: "Jesús con la cruz a cuestas",
					descripcion: "Jesús carga su cruz camino al Calvario.",
					cita: "Juan 19:17",
					versiculo:
						"Y llevando su cruz, salió hacia el lugar llamado Calvario, que en hebreo se llama Gólgota.",
				},
				{
					titulo: "La Crucifixión y Muerte de Jesús",
					descripcion:
						"Jesús es crucificado y muere en la cruz por nuestra salvación.",
					cita: "Lucas 23:46",
					versiculo:
						"Jesús, dando una gran voz, dijo: «Padre, en tus manos encomiendo mi espíritu» y, dicho esto, expiró.",
				},
			];
		} else if (diaIndex === 3 || diaIndex === 0) {
			// Miércoles o Domingo
			tipo = "Misterios Gloriosos";
			listaMisterios = [
				{
					titulo: "La Resurrección de Jesús",
					descripcion: "Jesús resucita al tercer día, venciendo a la muerte.",
					cita: "Marcos 16:6",
					versiculo:
						"«No se asusten. Ustedes buscan a Jesús de Nazaret, el Crucificado; ha resucitado, no está aquí.»",
				},
				{
					titulo: "La Ascensión de Jesús al Cielo",
					descripcion:
						"Jesús asciende al cielo cuarenta días después de su resurrección.",
					cita: "Hechos 1:9",
					versiculo:
						"Dicho esto, fue levantado en presencia de ellos, y una nube le ocultó a sus ojos.",
				},
				{
					titulo: "La Venida del Espíritu Santo",
					descripcion:
						"El Espíritu Santo desciende sobre los apóstoles en Pentecostés.",
					cita: "Hechos 2:4",
					versiculo:
						"Todos quedaron llenos del Espíritu Santo y comenzaron a hablar en otras lenguas, según el Espíritu les concedía expresarse.",
				},
				{
					titulo: "La Asunción de María al Cielo",
					descripcion: "María es llevada al cielo en cuerpo y alma.",
					cita: "Apocalipsis 12:1",
					versiculo:
						"Una gran señal apareció en el cielo: una Mujer, vestida del sol, con la luna bajo sus pies, y una corona de doce estrellas sobre su cabeza.",
				},
				{
					titulo: "La Coronación de María como Reina del Cielo",
					descripcion: "María es coronada como Reina del Cielo y de la tierra.",
					cita: "Salmo 45:9",
					versiculo: "A tu derecha está la reina, enjoyada con oro de Ofir.",
				},
			];
		}

		setTipoMisterio(tipo);
		setMisterios(listaMisterios);
		setLoading(false);
	};

	// Efecto para inicializar los misterios con el día actual
	useEffect(() => {
		const hoy = new Date();
		const diaSemana = hoy.getDay(); // 0 (domingo) a 6 (sábado)
		setDiaSeleccionado(dias[diaSemana]);
		determinarMisterios(diaSemana);
	}, []);

	// Manejar el cambio de día seleccionado
	const handleDiaChange = (e) => {
		const nuevoDia = e.target.value;
		setDiaSeleccionado(nuevoDia);
		determinarMisterios(nuevoDia);
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[70vh]">
				<h1 className="text-2xl font-semibold text-[#314156]">
					Cargando misterios del día...
				</h1>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center py-8 px-4">
			<div className="mb-8 text-center">
				<Image
					src="/rosary.svg"
					alt="Rosario"
					width={60}
					height={60}
					className="w-14 h-14 mx-auto mb-4"
				/>
				<h1 className="text-3xl font-bold text-[#314156] mb-2">
					Misterios del Rosario
				</h1>
				<p className="text-xl text-[#b79b72] mb-2 font-semibold">
					{tipoMisterio}
				</p>

				<div className="flex items-center justify-center mb-4 mt-2">
					<label htmlFor="dia-select" className="mr-2 text-gray-600">
						Misterios del día:
					</label>
					<select
						id="dia-select"
						value={diaSeleccionado}
						onChange={handleDiaChange}
						className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#b79b72]/50 focus:border-[#b79b72] capitalize"
					>
						{dias.map((dia) => (
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
							<h3 className="text-xl font-semibold text-[#314156] dark:text-[#b79b72] mb-2 flex items-center">
								<span className="flex items-center justify-center bg-[#b79b72] text-white w-8 h-8 rounded-full mr-3 text-sm">
									{index + 1}
								</span>
								{misterio.titulo}
							</h3>
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
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
