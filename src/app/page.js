import Link from "next/link";
import Image from "next/image";
import RosaryIcon from "@/components/RosaryIcon.jsx";
import { BookOpenIcon, CalendarIcon } from "@heroicons/react/24/outline";

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
				<h1 className="text-4xl font-bold text-[#314156] dark:text-gray-100 transition-colors duration-300 mb-4">
					Rhemapp
				</h1>
				<p className="text-xl text-gray-600 dark:text-gray-300 transition-colors duration-300 max-w-2xl mx-auto text-left mb-8">
					El nombre RHEMA viene del griego{" "}
					<span className="italic font-semibold">ῥῆμα</span> que significa
					&quot;Palabra&quot;. Representa la palabra viva de Dios que habla directamente a
					nuestro corazón en el momento presente, trayendo revelación, dirección
					y propósito a nuestra vida diaria.
				</p>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-3xl mx-auto border-l-4 border-[#b79b72] dark:border-[#b79b72]/90 mb-6 transition-colors duration-300">
					<blockquote className="pl-4 py-2 mb-0 italic text-lg">
						<p className="text-gray-700 dark:text-gray-200 transition-colors duration-300">
							«Si ustedes permanecen fieles a mi palabra, serán verdaderamente
							mis discípulos: conocerán la verdad y la verdad los hará libres».
						</p>
						<p className="text-right text-[#b79b72] font-semibold mt-2">
							— Juan 8:31-32
						</p>
					</blockquote>
				</div>

				<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-lg max-w-3xl mx-auto text-left mb-10">
					Esta aplicación es una herramienta para ayudarte a conectar con la
					Palabra de Dios todos los días, permitiéndote descubrir versículos,
					reflexionar sobre la lectura diaria y meditar los misterios del
					rosario.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
				<Link href="/random" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 transition-transform hover:transform hover:scale-105 hover:shadow-lg h-full hover:border-[#b79b72] dark:hover:border-[#b79b72]/80 transition-colors duration-300">
						<BookOpenIcon className="w-16 h-16 text-[#314156] dark:text-gray-100 transition-colors duration-300 mb-4" />
						<h2 className="text-2xl font-semibold text-[#314156] dark:text-gray-100 transition-colors duration-300 mb-2">
							Versículo Aleatorio
						</h2>
						<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center">
							Explora versículos aleatorios de la Biblia con opciones para
							navegar entre ellos
						</p>
					</div>
				</Link>

				<Link href="/daily" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 transition-transform hover:transform hover:scale-105 hover:shadow-lg h-full hover:border-[#b79b72] dark:hover:border-[#b79b72]/80 transition-colors duration-300">
						<CalendarIcon className="w-16 h-16 text-[#b79b72] mb-4" />
						<h2 className="text-2xl font-semibold text-[#314156] dark:text-gray-100 transition-colors duration-300 mb-2">
							Lectura del Día
						</h2>
						<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center">
							Descubre el versículo seleccionado especialmente para hoy
						</p>
					</div>
				</Link>

				<Link href="/rosario" className="w-full">
					<div className="flex flex-col items-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 transition-transform hover:transform hover:scale-105 hover:shadow-lg h-full hover:border-[#b79b72] dark:hover:border-[#b79b72]/80 transition-colors duration-300">
						<RosaryIcon className="w-16 h-16 mb-4 text-[#314156] dark:text-gray-100 transition-colors duration-300" />
						<h2 className="text-2xl font-semibold text-[#314156] dark:text-gray-100 transition-colors duration-300 mb-2">
							Misterios del Rosario
						</h2>
						<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center">
							Visualiza los misterios correspondientes al día actual para rezar
							el rosario
						</p>
					</div>
				</Link>
			</div>
		</div>
	);
}
