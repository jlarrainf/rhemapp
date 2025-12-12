import Link from "next/link";

export const metadata = {
	robots: {
		index: false,
		follow: false,
	},
};

export default function NotFound() {
	return (
		<div className="max-w-2xl mx-auto py-12">
			<h1 className="text-3xl font-bold text-[#314156] dark:text-gray-100 transition-colors duration-300 mb-4">
				Página no encontrada
			</h1>
			<p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-6">
				La ruta que buscas no existe. Puedes volver al inicio y seguir
				explorando Rhemapp.
			</p>
			<Link
				href="/"
				className="inline-flex items-center px-4 py-2 bg-[#314156] text-white dark:bg-[#b79b72] dark:text-gray-900 rounded hover:bg-[#314156]/90 dark:hover:bg-[#b79b72]/90 transition-colors duration-300"
			>
				Ir al inicio
			</Link>
		</div>
	);
}
