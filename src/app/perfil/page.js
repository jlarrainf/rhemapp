import Link from "next/link";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Mi cuenta",
	description: "Área privada de tu cuenta de Rhemapp.",
	robots: { index: false, follow: false },
};

export default async function ProfilePage() {
	try {
		const session = await requireAuthenticatedSession();

		return (
			<section className="mx-auto w-full max-w-2xl space-y-6 py-8">
				<div>
					<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Área privada</p>
					<h1 className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">Mi cuenta</h1>
					<p className="mt-2 text-gray-600 dark:text-gray-300">Administra los datos mínimos de tu perfil.</p>
				</div>
				<ProfileForm initialProfile={session.user} />
			</section>
		);
	} catch (error) {
			if (error?.status === 401) {
				return (
					<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
						<h1 className="text-3xl font-bold text-[#314156] dark:text-white">Inicia sesión para continuar</h1>
						<p className="text-gray-600 dark:text-gray-300">
							Esta sección es privada. Inicia sesión para consultar tu cuenta.
						</p>
						<Link
							href="/login?next=%2Fperfil"
							className="inline-flex min-h-10 items-center rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]"
						>
							Iniciar sesión
						</Link>
					</section>
				);
			}

			return (
				<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
					<h1 className="text-3xl font-bold text-[#314156] dark:text-white">No se pudo comprobar tu sesión</h1>
					<p className="text-gray-600 dark:text-gray-300">
						Inténtalo nuevamente más tarde. Tus datos privados no se muestran.
					</p>
				</section>
			);
		}
}
