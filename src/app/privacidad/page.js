import Link from "next/link";

export const metadata = {
	title: "Privacidad",
	description: "Información sobre el uso de datos personales en Rhemapp.",
};

export default function PrivacyPage() {
	return (
		<article className="mx-auto w-full max-w-3xl space-y-8 py-8">
			<header className="space-y-3">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Rhemapp</p>
				<h1 className="text-3xl font-bold text-[#314156] dark:text-white">Privacidad</h1>
				<p className="text-gray-600 dark:text-gray-300">
					Rhemapp solicita solo los datos necesarios para mantener tu cuenta y tus preferencias.
				</p>
			</header>

			<section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 sm:p-8">
				<h2 className="text-xl font-semibold text-[#314156] dark:text-white">Qué datos usamos</h2>
				<ul className="list-disc space-y-2 pl-5">
					<li>La identidad y el correo que entrega el proveedor de autenticación.</li>
					<li>El nombre visible, avatar, idioma y zona horaria que forman tu perfil.</li>
					<li>El contenido privado que guardes mientras uses las funciones de tu cuenta.</li>
				</ul>

				<h2 className="pt-3 text-xl font-semibold text-[#314156] dark:text-white">Tus controles</h2>
				<p>
					Puedes cerrar sesión cuando quieras y solicitar la eliminación de tu cuenta. Los datos
					privados se eliminan según la política de la aplicación; los registros de auditoría que
					deban conservarse se anonimizan y se eliminan después del período definido.
				</p>
				<p>
					No guardamos contraseñas en Rhemapp ni mostramos tokens de acceso en la interfaz.
				</p>
			</section>

			<p className="text-sm text-gray-600 dark:text-gray-400">
				Consulta también las <Link className="underline" href="/condiciones">condiciones de uso</Link>.
			</p>
		</article>
	);
}
