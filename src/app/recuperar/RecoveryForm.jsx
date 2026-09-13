"use client";

import { useState } from "react";
import { RECOVERY_GENERIC_MESSAGE } from "@/lib/auth/recovery";

const GENERIC_ERROR = "No se pudo procesar la solicitud. Inténtalo nuevamente.";

export default function RecoveryForm() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [isPending, setIsPending] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");
		setIsPending(true);

		try {
			const response = await fetch("/api/auth/recovery", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({ email }),
			});
			const data = await response.json().catch(() => null);
			if (!response.ok) {
				setError(typeof data?.error === "string" ? data.error : GENERIC_ERROR);
				return;
			}
			setNotice(RECOVERY_GENERIC_MESSAGE);
		} catch {
			setError(GENERIC_ERROR);
		} finally {
			setIsPending(false);
		}
	};

	return (
		<form
			className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8"
			onSubmit={handleSubmit}
		>
			{error ? (
				<p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200" role="alert">
					{error}
				</p>
			) : null}
			{notice ? (
				<p className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200" role="status">
					{notice}
				</p>
			) : null}
			<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="recovery-email">
				Correo electrónico
			</label>
			<input
				id="recovery-email"
				name="email"
				type="email"
				autoComplete="email"
				required
				value={email}
				onChange={(event) => setEmail(event.target.value)}
				className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
			/>
			<button
				type="submit"
				disabled={isPending}
				className="mt-5 min-h-11 w-full rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253449] focus:outline-none focus:ring-2 focus:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b79b72] dark:text-[#253449]"
			>
				{isPending ? "Enviando…" : "Solicitar recuperación"}
			</button>
		</form>
	);
}
