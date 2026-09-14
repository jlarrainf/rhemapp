import Link from "next/link";
import { requireAuthenticatedSession } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listSavedReadings } from "@/lib/savedReadings/service";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Mi biblioteca",
	description: "Revisa tus lecturas bíblicas guardadas y organízalas en grupos.",
	robots: { index: false, follow: false },
};

export default async function LibraryPage() {
	try {
		const supabase = await createSupabaseServerClient();
		const session = await requireAuthenticatedSession(supabase);
		const items = await listSavedReadings(supabase, session.user.id);
		return <LibraryClient initialItems={items} />;
	} catch (error) {
		if (error?.status === 401) {
			return (
				<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
					<h1 className="text-3xl font-bold text-[#314156] dark:text-white">Inicia sesión para ver tu biblioteca</h1>
					<p className="text-gray-600 dark:text-gray-300">Tus lecturas guardadas son privadas y solo están disponibles para tu cuenta.</p>
					<Link
						href="/login?next=%2Fbiblioteca"
						className="inline-flex min-h-10 items-center rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]"
					>
						Iniciar sesión
					</Link>
				</section>
			);
		}

		return (
			<section className="mx-auto w-full max-w-2xl space-y-4 py-8" role="alert">
				<h1 className="text-3xl font-bold text-[#314156] dark:text-white">No se pudo cargar tu biblioteca</h1>
				<p className="text-gray-600 dark:text-gray-300">Inténtalo nuevamente más tarde. Tus guardados privados no se muestran.</p>
			</section>
		);
	}
}
