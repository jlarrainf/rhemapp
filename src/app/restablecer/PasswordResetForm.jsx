"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
	PASSWORD_UPDATE_MIN_LENGTH,
	validatePasswordUpdate,
} from "@/lib/auth/recovery";
import { getSupabaseAuthErrorMessage } from "@/lib/auth/messages";

const GENERIC_ERROR = "No se pudo actualizar la contraseña. Inténtalo nuevamente.";

export default function PasswordResetForm() {
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");
	const [isPending, setIsPending] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");

		const validation = validatePasswordUpdate({ password, confirmation });
		if (!validation.ok) {
			setError(validation.error);
			return;
		}

		setIsPending(true);
		try {
			const supabase = createSupabaseBrowserClient();
			const { error: updateError } = await supabase.auth.updateUser({ password });
			if (updateError) throw updateError;
			await supabase.auth.signOut({ scope: "global" }).catch(() => {});
			setNotice("Tu contraseña fue actualizada. Ya puedes iniciar sesión nuevamente.");
			setPassword("");
			setConfirmation("");
		} catch (updateError) {
			setError(getSupabaseAuthErrorMessage(updateError, "password") || GENERIC_ERROR);
		} finally {
			setIsPending(false);
		}
	};

	if (notice) {
		return (
			<div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-900/60 dark:bg-green-950/30" role="status">
				<p className="text-sm leading-6 text-green-800 dark:text-green-200">{notice}</p>
				<Link
					href="/login"
					className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:bg-[#b79b72] dark:text-[#253449]"
				>
					Ir a iniciar sesión
				</Link>
			</div>
		);
	}

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
			<div>
				<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="new-password">
					Contraseña nueva
				</label>
				<input
					id="new-password"
					name="password"
					type="password"
					autoComplete="new-password"
					minLength={PASSWORD_UPDATE_MIN_LENGTH}
					required
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
				/>
			</div>
			<div className="mt-4">
				<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="confirm-password">
					Confirma la contraseña
				</label>
				<input
					id="confirm-password"
					name="confirmation"
					type="password"
					autoComplete="new-password"
					minLength={PASSWORD_UPDATE_MIN_LENGTH}
					required
					value={confirmation}
					onChange={(event) => setConfirmation(event.target.value)}
					className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
				/>
			</div>
			<button
				type="submit"
				disabled={isPending}
				className="mt-5 min-h-11 w-full rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253449] focus:outline-none focus:ring-2 focus:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b79b72] dark:text-[#253449]"
			>
				{isPending ? "Actualizando…" : "Actualizar contraseña"}
			</button>
		</form>
	);
}
