"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AccountDeletionForm from "./AccountDeletionForm";

const EDITABLE_FIELDS = ["displayName", "avatarUrl", "locale", "timezone"];
const PROFILE_UPDATE_ERROR = "No se pudo actualizar el perfil. Inténtalo nuevamente.";

export default function ProfileForm({ initialProfile }) {
	const router = useRouter();
	const [form, setForm] = useState(() =>
		Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, initialProfile?.[field] || ""])),
	);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((currentForm) => ({ ...currentForm, [name]: value }));
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");
		setIsPending(true);

		try {
			const response = await fetch("/api/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				cache: "no-store",
				body: JSON.stringify({
					displayName: form.displayName || null,
					avatarUrl: form.avatarUrl || null,
					locale: form.locale,
					timezone: form.timezone,
				}),
			});
			const data = await response.json().catch(() => null);
			if (!response.ok) {
				setError(typeof data?.error === "string" ? data.error : PROFILE_UPDATE_ERROR);
				return;
			}
			if (!data?.profile) {
				setError(PROFILE_UPDATE_ERROR);
				return;
			}

			setForm((currentForm) => ({
				...currentForm,
				displayName: data.profile.displayName || "",
				avatarUrl: data.profile.avatarUrl || "",
				locale: data.profile.locale,
				timezone: data.profile.timezone,
			}));
			setNotice("Perfil actualizado correctamente.");
			router.refresh();
		} catch {
			setError(PROFILE_UPDATE_ERROR);
		} finally {
			setIsPending(false);
		}
	};

	return (
		<div className="space-y-6">
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

				<div className="space-y-5">
					<div>
						<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="displayName">
							Nombre visible
						</label>
						<input
							id="displayName"
							name="displayName"
							type="text"
							maxLength={120}
							value={form.displayName}
							onChange={handleChange}
							className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
						/>
					</div>

					<div>
						<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="email">
							Correo electrónico
						</label>
						<input
							id="email"
							name="email"
							type="email"
							value={initialProfile?.email || ""}
							disabled
							readOnly
							className="min-h-11 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-400"
						/>
						<p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">El correo se administra con tu proveedor de autenticación.</p>
					</div>

					<div>
						<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="avatarUrl">
							URL del avatar <span className="font-normal text-gray-500">(opcional)</span>
						</label>
						<input
							id="avatarUrl"
							name="avatarUrl"
							type="url"
							maxLength={2048}
							value={form.avatarUrl}
							onChange={handleChange}
							className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
						/>
					</div>

					<div className="grid gap-5 sm:grid-cols-2">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="locale">
								Idioma y región
							</label>
							<input
								id="locale"
								name="locale"
								type="text"
								inputMode="text"
								value={form.locale}
								onChange={handleChange}
								className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="timezone">
								Zona horaria
							</label>
							<input
								id="timezone"
								name="timezone"
								type="text"
								value={form.timezone}
								onChange={handleChange}
								className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
							/>
							<p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Ejemplo: America/Santiago.</p>
						</div>
					</div>
				</div>

				<div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
					<Link
						href="/"
						className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-[#314156] focus:outline-none focus:ring-2 focus:ring-[#b79b72] dark:border-gray-600 dark:text-gray-100"
					>
						Volver al inicio
					</Link>
					<button
						type="submit"
						disabled={isPending}
						className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253449] focus:outline-none focus:ring-2 focus:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b79b72] dark:text-[#253449]"
					>
						{isPending ? "Guardando…" : "Guardar cambios"}
					</button>
				</div>
			</form>
			<AccountDeletionForm />
		</div>
	);
}
