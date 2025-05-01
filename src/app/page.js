import Link from "next/link";
import Image from "next/image";
import {
	BookOpenIcon,
	CalendarIcon,
	BeakerIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[70vh]">
			<div className="text-center mb-12">
				<div className="flex justify-center mb-6">
					<Image
						src="/Rhemapp_isotype.svg"
						alt="Rhemapp Logo"
						width={80}
						height={80}
						className="w-20 h-20"
					/>
				</div>
				<h1 className="text-4xl font-bold text-[#314156] mb-4">Rhemapp</h1>
				<p className="text-xl text-gray-600 max-w-2xl">
					Una aplicación minimalista para leer versículos bíblicos aleatorios y
					la lectura del día
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
				<Link href="/random" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md border border-gray-100 transition-transform hover:transform hover:scale-105 hover:shadow-lg h-full hover:border-[#b79b72]">
						<BookOpenIcon className="w-16 h-16 text-[#314156] mb-4" />
						<h2 className="text-2xl font-semibold text-[#314156] mb-2">
							Versículo Aleatorio
						</h2>
						<p className="text-gray-600 text-center">
							Explora versículos aleatorios de la Biblia con opciones para
							navegar entre ellos
						</p>
					</div>
				</Link>

				<Link href="/daily" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md border border-gray-100 transition-transform hover:transform hover:scale-105 hover:shadow-lg h-full hover:border-[#b79b72]">
						<CalendarIcon className="w-16 h-16 text-[#b79b72] mb-4" />
						<h2 className="text-2xl font-semibold text-[#314156] mb-2">
							Lectura del Día
						</h2>
						<p className="text-gray-600 text-center">
							Descubre el versículo seleccionado especialmente para hoy
						</p>
					</div>
				</Link>

				<Link href="/rosario" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white rounded-lg shadow-md border border-gray-100 transition-transform hover:transform hover:scale-105 hover:shadow-lg h-full hover:border-[#b79b72]">
						<BeakerIcon className="w-16 h-16 text-[#b79b72] mb-4" />
						<h2 className="text-2xl font-semibold text-[#314156] mb-2">
							Misterios del Rosario
						</h2>
						<p className="text-gray-600 text-center">
							Visualiza los misterios correspondientes al día actual para rezar
							el rosario
						</p>
					</div>
				</Link>
			</div>
		</div>
	);
}
