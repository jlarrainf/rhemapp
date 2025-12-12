// Datos y helpers del Rosario extraídos de la UI.
// Mantenerlo como módulo puro permite SSR del contenido inicial (SEO) y reuso en cliente.

export const DAYS = [
	"domingo",
	"lunes",
	"martes",
	"miércoles",
	"jueves",
	"viernes",
	"sábado",
];

function gozosos() {
	return {
		type: "Misterios Gozosos",
		mysteries: [
			{
				titulo: "La Anunciación del Ángel a María",
				descripcion:
					"El ángel Gabriel anuncia a María que será la madre del Hijo de Dios.",
				cita: "Lucas 1:28",
				versiculo: "«Alégrate, llena de gracia, el Señor está contigo.»",
				verseId: "LUK.1.28",
				chapterId: "LUK.1",
			},
			{
				titulo: "La Visita de María a su prima Isabel",
				descripcion:
					"María visita a su prima Isabel, quien la reconoce como la madre del Mesías.",
				cita: "Lucas 1:42",
				versiculo:
					"«¡Bendita tú entre las mujeres y bendito el fruto de tu vientre!»",
				verseId: "LUK.1.42",
				chapterId: "LUK.1",
			},
			{
				titulo: "El Nacimiento de Jesús en Belén",
				descripcion:
					"Jesús nace en un pesebre en Belén, cumpliendo las profecías.",
				cita: "Lucas 2:7",
				versiculo:
					"Y dio a luz a su hijo primogénito, lo envolvió en pañales y lo acostó en un pesebre.",
				verseId: "LUK.2.7",
				chapterId: "LUK.2",
			},
			{
				titulo: "La Presentación de Jesús en el Templo",
				descripcion:
					"María y José presentan a Jesús en el Templo según la ley de Moisés.",
				cita: "Lucas 2:22-23",
				versiculo:
					"Llevaron a Jesús a Jerusalén para presentarlo al Señor, como está escrito en la ley del Señor.",
				verseId: "LUK.2.22-LUK.2.23",
				chapterId: "LUK.2",
			},
			{
				titulo: "El Niño Jesús perdido y hallado en el Templo",
				descripcion:
					"Jesús, a los 12 años, es encontrado en el Templo discutiendo con los doctores de la Ley.",
				cita: "Lucas 2:46",
				versiculo:
					"Al tercer día lo encontraron en el templo, sentado en medio de los maestros, escuchándolos y haciéndoles preguntas.",
				verseId: "LUK.2.46",
				chapterId: "LUK.2",
			},
		],
	};
}

function luminosos() {
	return {
		type: "Misterios Luminosos",
		mysteries: [
			{
				titulo: "El Bautismo de Jesús en el Jordán",
				descripcion:
					"Jesús es bautizado por Juan el Bautista, y Dios lo proclama su Hijo amado.",
				cita: "Mateo 3:17",
				versiculo:
					"Y una voz que venía de los cielos decía: «Este es mi Hijo amado, en quien me complazco.»",
				verseId: "MAT.3.17",
				chapterId: "MAT.3",
			},
			{
				titulo: "Las Bodas de Caná",
				descripcion:
					"Jesús realiza su primer milagro, convirtiendo el agua en vino en las Bodas de Caná.",
				cita: "Juan 2:7-8",
				versiculo:
					"Jesús les dice: «Llenen las tinajas de agua.» Y las llenaron hasta el borde.",
				verseId: "JHN.2.7-JHN.2.8",
				chapterId: "JHN.2",
			},
			{
				titulo: "El Anuncio del Reino de Dios",
				descripcion:
					"Jesús predica sobre el Reino de Dios y llama al arrepentimiento.",
				cita: "Marcos 1:15",
				versiculo:
					"«El tiempo se ha cumplido y el Reino de Dios está cerca; conviértanse y crean en la Buena Nueva.»",
				verseId: "MRK.1.15",
				chapterId: "MRK.1",
			},
			{
				titulo: "La Transfiguración de Jesús",
				descripcion:
					"Jesús se transfigura ante Pedro, Santiago y Juan, revelando su gloria divina.",
				cita: "Mateo 17:2",
				versiculo:
					"Y se transfiguró delante de ellos: su rostro se puso brillante como el sol y sus vestidos se volvieron blancos como la luz.",
				verseId: "MAT.17.2",
				chapterId: "MAT.17",
			},
			{
				titulo: "La Institución de la Eucaristía",
				descripcion:
					"Jesús establece la Eucaristía en la Última Cena con sus discípulos.",
				cita: "Lucas 22:19",
				versiculo:
					"Y tomó pan, dio gracias, lo partió y lo dio a sus discípulos, diciendo: «Esto es mi cuerpo, que se entrega por ustedes; hagan esto en memoria mía.»",
				verseId: "LUK.22.19",
				chapterId: "LUK.22",
			},
		],
	};
}

function dolorosos() {
	return {
		type: "Misterios Dolorosos",
		mysteries: [
			{
				titulo: "La Oración de Jesús en el Huerto",
				descripcion:
					"Jesús ora en el Huerto de Getsemaní antes de su arresto.",
				cita: "Mateo 26:39",
				versiculo:
					"Y adelantándose un poco, cayó rostro en tierra, y suplicaba así: «Padre mío, si es posible, que pase de mí este cáliz, pero no sea como yo quiero, sino como quieres tú.»",
				verseId: "MAT.26.39",
				chapterId: "MAT.26",
			},
			{
				titulo: "La Flagelación de Jesús",
				descripcion: "Jesús es azotado por orden de Pilato.",
				cita: "Juan 19:1",
				versiculo: "Pilato entonces tomó a Jesús y mandó azotarle.",
				verseId: "JHN.19.1",
				chapterId: "JHN.19",
			},
			{
				titulo: "La Coronación de espinas",
				descripcion:
					"Los soldados coronan a Jesús con espinas y se burlan de él.",
				cita: "Mateo 27:29",
				versiculo:
					"Y trenzando una corona de espinas, se la pusieron sobre su cabeza, y en su mano derecha una caña; y doblando la rodilla delante de él, le hacían burla diciendo: «¡Salve, Rey de los judíos!»",
				verseId: "MAT.27.29",
				chapterId: "MAT.27",
			},
			{
				titulo: "Jesús con la cruz a cuestas",
				descripcion: "Jesús carga su cruz camino al Calvario.",
				cita: "Juan 19:17",
				versiculo:
					"Y llevando su cruz, salió hacia el lugar llamado Calvario, que en hebreo se llama Gólgota.",
				verseId: "JHN.19.17",
				chapterId: "JHN.19",
			},
			{
				titulo: "La Crucifixión y Muerte de Jesús",
				descripcion:
					"Jesús es crucificado y muere en la cruz por nuestra salvación.",
				cita: "Lucas 23:46",
				versiculo:
					"Jesús, dando una gran voz, dijo: «Padre, en tus manos encomiendo mi espíritu» y, dicho esto, expiró.",
				verseId: "LUK.23.46",
				chapterId: "LUK.23",
			},
		],
	};
}

function gloriosos() {
	return {
		type: "Misterios Gloriosos",
		mysteries: [
			{
				titulo: "La Resurrección de Jesús",
				descripcion: "Jesús resucita al tercer día, venciendo a la muerte.",
				cita: "Marcos 16:6",
				versiculo:
					"«No se asusten. Ustedes buscan a Jesús de Nazaret, el Crucificado; ha resucitado, no está aquí.»",
				verseId: "MRK.16.6",
				chapterId: "MRK.16",
			},
			{
				titulo: "La Ascensión de Jesús al Cielo",
				descripcion:
					"Jesús asciende al cielo cuarenta días después de su resurrección.",
				cita: "Hechos 1:9",
				versiculo:
					"Dicho esto, fue levantado en presencia de ellos, y una nube le ocultó a sus ojos.",
				verseId: "ACT.1.9",
				chapterId: "ACT.1",
			},
			{
				titulo: "La Venida del Espíritu Santo",
				descripcion:
					"El Espíritu Santo desciende sobre los apóstoles en Pentecostés.",
				cita: "Hechos 2:4",
				versiculo:
					"Todos quedaron llenos del Espíritu Santo y comenzaron a hablar en otras lenguas, según el Espíritu les concedía expresarse.",
				verseId: "ACT.2.4",
				chapterId: "ACT.2",
			},
			{
				titulo: "La Asunción de María al Cielo",
				descripcion: "María es llevada al cielo en cuerpo y alma.",
				cita: "Apocalipsis 12:1",
				versiculo:
					"Una gran señal apareció en el cielo: una Mujer, vestida del sol, con la luna bajo sus pies, y una corona de doce estrellas sobre su cabeza.",
				verseId: "REV.12.1",
				chapterId: "REV.12",
			},
			{
				titulo: "La Coronación de María como Reina del Cielo",
				descripcion: "María es coronada como Reina del Cielo y de la tierra.",
				cita: "Salmo 45:9",
				versiculo: "A tu derecha está la reina, enjoyada con oro de Ofir.",
				verseId: "PSA.45.9",
				chapterId: "PSA.45",
			},
		],
	};
}

export function getRosaryForDayIndex(dayIndex) {
	if (dayIndex === 1 || dayIndex === 6) return gozosos();
	if (dayIndex === 4) return luminosos();
	if (dayIndex === 2 || dayIndex === 5) return dolorosos();
	return gloriosos();
}

export function buildRosaryByDayIndex() {
	const byIndex = {};
	for (let i = 0; i < 7; i += 1) {
		byIndex[i] = getRosaryForDayIndex(i);
	}
	return byIndex;
}
