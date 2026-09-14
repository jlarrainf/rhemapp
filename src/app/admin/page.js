import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Administración",
	description: "Área administrativa protegida de Rhemapp.",
	robots: { index: false, follow: false },
};

export default async function AdminPage() {
	try {
		const session = await requireRole("admin");

		return (
			<section className="mx-auto w-full max-w-3xl space-y-6 py-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Área restringida</p>
					<h1 className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">Administración</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-300">Sesión administrativa verificada para {session.user.displayName || "la cuenta autorizada"}.</p>
				</div>
				<div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<p className="text-gray-700 dark:text-gray-200">Las acciones administrativas requieren el rol correspondiente y se ejecutarán en el servidor.</p>
					<Link
						href="/admin/sugerencias"
						className="mt-5 inline-flex min-h-10 items-center rounded-md border border-[#b79b72] px-4 py-2 text-sm font-semibold text-[#314156] focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:text-gray-100"
					>
						Abrir cola editorial
					</Link>
					<Link
						href="/"
						className="ml-2 mt-5 inline-flex min-h-10 items-center rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]"
					>
						Volver al inicio
					</Link>
				</div>
			</section>
		);
	} catch (error) {
			if (error?.status === 401) {
				return (
					<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
						<h1 className="text-3xl font-bold text-[#314156] dark:text-white">Inicia sesión para continuar</h1>
						<p className="text-gray-600 dark:text-gray-300">Esta sección está restringida a cuentas autorizadas.</p>
						<Link className="inline-flex min-h-10 items-center rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]" href="/login?next=%2Fadmin">
							Iniciar sesión
						</Link>
					</section>
				);
			}

			if (error?.status === 403) {
				return (
					<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
						<h1 className="text-3xl font-bold text-[#314156] dark:text-white">Acceso restringido</h1>
						<p className="text-gray-600 dark:text-gray-300">Tu cuenta no tiene permisos para realizar acciones administrativas.</p>
						<Link className="inline-flex min-h-10 items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-[#314156] focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:border-gray-600 dark:text-gray-100" href="/">
							Volver al inicio
						</Link>
					</section>
				);
			}

			return (
				<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
					<h1 className="text-3xl font-bold text-[#314156] dark:text-white">No se pudo comprobar el acceso</h1>
					<p className="text-gray-600 dark:text-gray-300">Inténtalo nuevamente más tarde. No se muestran funciones administrativas.</p>
				</section>
			);
		}
}
