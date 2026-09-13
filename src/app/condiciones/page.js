import Link from "next/link";

export const metadata = {
	title: "Condiciones de uso",
	description: "Condiciones básicas para usar Rhemapp.",
};

export default function TermsPage() {
	return (
		<article className="mx-auto w-full max-w-3xl space-y-8 py-8">
			<header className="space-y-3">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Rhemapp</p>
				<h1 className="text-3xl font-bold text-[#314156] dark:text-white">Condiciones de uso</h1>
				<p className="text-gray-600 dark:text-gray-300">
					Usa Rhemapp de forma responsable y únicamente para fines personales y legítimos.
				</p>
			</header>

			<section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:p-8">
				<h2 className="text-xl font-semibold text-[#314156] dark:text-white">Uso de la cuenta</h2>
				<p>
					Mantén bajo tu control las credenciales de tu cuenta y no uses Rhemapp para intentar
					acceder a datos de otras personas, evadir límites o interrumpir el servicio.
				</p>
				<h2 className="pt-3 text-xl font-semibold text-[#314156] dark:text-white">Contenido</h2>
				<p>
					Las referencias y lecturas litúrgicas se muestran con la atribución de sus fuentes. El
					contenido que guardes como privado permanece asociado a tu cuenta hasta que lo elimines.
				</p>
				<h2 className="pt-3 text-xl font-semibold text-[#314156] dark:text-white">Cierre de cuenta</h2>
				<p>
					Puedes cerrar sesión o solicitar la eliminación de tu cuenta. Las funciones privadas
					requieren una sesión válida.
				</p>
			</section>

			<p className="text-sm text-gray-600 dark:text-gray-400">
				Consulta también la <Link className="underline" href="/privacidad">información de privacidad</Link>.
			</p>
		</article>
	);
}
