import Link from "next/link";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import PasswordResetForm from "./PasswordResetForm";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Crear nueva contraseña",
	description: "Crea una nueva contraseña para tu cuenta de Rhemapp.",
	robots: { index: false, follow: false },
};

export default async function PasswordResetPage() {
	try {
		await requireAuthenticatedSession();
		return (
			<section className="mx-auto flex w-full max-w-md flex-col gap-6 py-8 sm:py-12">
				<div className="text-center">
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Rhemapp</p>
					<h1 className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">Crear nueva contraseña</h1>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
						Elige una contraseña nueva para recuperar el acceso.
					</p>
				</div>
				<PasswordResetForm />
			</section>
		);
	} catch (error) {
		return (
			<section className="mx-auto flex w-full max-w-md flex-col gap-4 py-8 sm:py-12" role="alert">
				<h1 className="text-3xl font-bold text-[#314156] dark:text-white">El enlace ya no es válido</h1>
				<p className="text-gray-600 dark:text-gray-300">
					Solicita un nuevo enlace para crear tu contraseña. Tus datos privados siguen protegidos.
				</p>
				<Link
					href="/recuperar"
					className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]"
				>
					Solicitar otro enlace
				</Link>
			</section>
		);
	}
}
