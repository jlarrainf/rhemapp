import Link from "next/link";
import { BookOpenIcon, CalendarIcon } from "@heroicons/react/24/outline";

export default function Home() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<div className="text-center mb-12">
				<h1 className="text-4xl font-bold text-gray-800 mb-4">
					Bible Verses App
				</h1>
				<p className="text-xl text-gray-600 max-w-2xl">
					Una aplicación minimalista para leer versículos bíblicos aleatorios y
					la lectura del día
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
				<Link href="/random" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md border border-gray-100 transition-transform hover:transform hover:scale-105 hover:shadow-lg">
						<BookOpenIcon className="w-16 h-16 text-blue-500 mb-4" />
						<h2 className="text-2xl font-semibold text-gray-800 mb-2">
							Versículo Aleatorio
						</h2>
						<p className="text-gray-600 text-center">
							Explora versículos aleatorios de la Biblia con opciones para
							navegar entre ellos
						</p>
					</div>
				</Link>

				<Link href="/daily" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md border border-gray-100 transition-transform hover:transform hover:scale-105 hover:shadow-lg">
						<CalendarIcon className="w-16 h-16 text-green-500 mb-4" />
						<h2 className="text-2xl font-semibold text-gray-800 mb-2">
							Lectura del Día
						</h2>
						<p className="text-gray-600 text-center">
							Descubre el versículo seleccionado especialmente para hoy
						</p>
					</div>
				</Link>
			</div>
		</div>
	);
}
