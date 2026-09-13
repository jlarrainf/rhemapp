import Link from "next/link";
import RecoveryForm from "./RecoveryForm";

export const metadata = {
	title: "Recuperar acceso",
	description: "Solicita instrucciones para recuperar el acceso a tu cuenta de Rhemapp.",
	robots: { index: false, follow: false },
};

export default function RecoveryPage() {
	return (
		<section className="mx-auto flex w-full max-w-md flex-col gap-6 py-8 sm:py-12">
			<div className="text-center">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b79b72]">Rhemapp</p>
				<h1 className="mt-3 text-3xl font-bold text-[#314156] dark:text-white">Recuperar acceso</h1>
				<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
					Te enviaremos instrucciones para crear una nueva contraseña.
				</p>
			</div>
			<RecoveryForm />
			<p className="text-center text-sm">
				<Link className="text-[#314156] underline underline-offset-4 dark:text-[#d9c4a5]" href="/login">
					Volver a iniciar sesión
				</Link>
			</p>
		</section>
	);
}
