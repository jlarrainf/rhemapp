"use client";

import Link from "next/link";
import { useState } from "react";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/auth/accountDeletion";

const GENERIC_ERROR = "No se pudo eliminar la cuenta. Inténtalo nuevamente.";

export default function AccountDeletionForm() {
	const [isOpen, setIsOpen] = useState(false);
	const [confirmation, setConfirmation] = useState("");
	const [error, setError] = useState("");
	const [isPending, setIsPending] = useState(false);

	const closePanel = () => {
		if (isPending) return;
		setIsOpen(false);
		setConfirmation("");
		setError("");
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setIsPending(true);

		try {
			const response = await fetch("/api/auth/account", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({ confirmation }),
			});
			const data = await response.json().catch(() => null);
			if (!response.ok) {
				setError(typeof data?.error === "string" ? data.error : GENERIC_ERROR);
				return;
			}
			window.location.assign("/login?error=account_deleted");
		} catch {
			setError(GENERIC_ERROR);
		} finally {
			setIsPending(false);
		}
	};

	if (!isOpen) {
		return (
			<section className="rounded-2xl border border-red-200 bg-red-50/60 p-6 dark:border-red-950/70 dark:bg-red-950/20">
				<h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Eliminar cuenta</h2>
				<p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-300">
					Esta acción elimina tus datos privados y cierra tus sesiones. El contenido editorial público no se elimina.
				</p>
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="mt-4 inline-flex min-h-10 items-center rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/50"
				>
					Solicitar eliminación
				</button>
			</section>
		);
	}

	return (
		<form
			className="rounded-2xl border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30"
			onSubmit={handleSubmit}
		>
			<h2 className="text-lg font-semibold text-red-900 dark:text-red-200">Confirma la eliminación</h2>
			<p className="mt-2 text-sm leading-6 text-red-800 dark:text-red-300">
				Se eliminarán tu cuenta, perfil y datos privados. Esta acción no se puede deshacer.
			</p>
			{error ? (
				<p className="mt-4 rounded-lg border border-red-300 bg-white px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">
					{error}
				</p>
			) : null}
			<label className="mt-5 block text-sm font-medium text-red-900 dark:text-red-200" htmlFor="account-deletion-confirmation">
				Escribe «{ACCOUNT_DELETION_CONFIRMATION}» para confirmar
			</label>
			<input
				id="account-deletion-confirmation"
				name="confirmation"
				type="text"
				autoComplete="off"
				value={confirmation}
				onChange={(event) => setConfirmation(event.target.value)}
				className="mt-1.5 min-h-11 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 dark:border-red-800 dark:bg-gray-900 dark:text-white"
			/>
			<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<button
					type="button"
					onClick={closePanel}
					disabled={isPending}
					className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-600 dark:text-gray-200"
				>
					Cancelar
				</button>
				<button
					type="submit"
					disabled={isPending || confirmation !== ACCOUNT_DELETION_CONFIRMATION}
					className="inline-flex min-h-11 items-center justify-center rounded-lg bg-red-700 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isPending ? "Eliminando…" : "Eliminar mi cuenta"}
				</button>
			</div>
			<p className="mt-4 text-xs text-red-800 dark:text-red-300">
				Si no deseas continuar, <Link className="underline" href="/">vuelve al inicio</Link>.
			</p>
		</form>
	);
}
