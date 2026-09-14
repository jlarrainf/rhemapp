"use client";

import { useEffect, useState } from "react";

const DEFAULT_TIMEZONE = "America/Santiago";

function detectTimezone() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TIMEZONE;
	} catch {
		return DEFAULT_TIMEZONE;
	}
}

export default function NotificationPreferencesForm() {
	const [form, setForm] = useState({ enabled: false, localTime: "08:00", timezone: detectTimezone() });
	const [isLoading, setIsLoading] = useState(true);
	const [isPending, setIsPending] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		let cancelled = false;
		fetch("/api/notification-preferences", { cache: "no-store", headers: { Accept: "application/json" } })
			.then(async (response) => {
				const data = await response.json().catch(() => null);
				if (!response.ok) throw new Error(data?.error || "No se pudieron cargar las preferencias de avisos.");
				if (!cancelled && data?.preferences) setForm(data.preferences);
			})
			.catch((cause) => {
				if (!cancelled) setError(cause?.message || "No se pudieron cargar las preferencias de avisos.");
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setNotice("");
		setIsPending(true);
		try {
			const response = await fetch("/api/notification-preferences", {
				method: "PATCH",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				cache: "no-store",
				body: JSON.stringify(form),
			});
			const data = await response.json().catch(() => null);
			if (!response.ok) throw new Error(data?.error || "No se pudieron guardar las preferencias de avisos.");
			if (data?.preferences) setForm(data.preferences);
			setNotice("Preferencias de avisos actualizadas.");
		} catch (cause) {
			setError(cause?.message || "No se pudieron guardar las preferencias de avisos.");
		} finally {
			setIsPending(false);
		}
	};

	return (
		<form className="rounded-2xl border border-[#b79b72]/50 bg-white p-6 shadow-sm dark:bg-gray-800 sm:p-8" onSubmit={handleSubmit}>
			<div className="mb-5">
				<p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b79b72]">Avisos de la lectura</p>
				<h2 className="mt-2 text-xl font-semibold text-[#314156] dark:text-white">Configura tu horario</h2>
				<p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
					La primera fase móvil es una PWA sin push. Estas preferencias se comparten con la futura app Android y este navegador nunca solicitará permiso de notificaciones.
				</p>
			</div>
			{error ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200" role="alert">{error}</p> : null}
			{notice ? <p className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200" role="status">{notice}</p> : null}
			{isLoading ? <p className="text-sm text-gray-500 dark:text-gray-400" role="status">Cargando preferencias…</p> : (
				<>
					<label className="flex min-h-11 items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
						<input
							type="checkbox"
							checked={form.enabled}
							onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
							className="h-5 w-5 rounded border-gray-300 text-[#314156] focus:ring-2 focus:ring-[#b79b72] dark:border-gray-600"
						/>
						<span>Activar avisos diarios en dispositivos Android</span>
					</label>
					<div className="mt-5 grid gap-5 sm:grid-cols-2">
						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="notification-local-time">Hora local</label>
							<input id="notification-local-time" type="time" value={form.localTime} onChange={(event) => setForm((current) => ({ ...current, localTime: event.target.value }))} className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
							<p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Predeterminada: 08:00. Se aplica todos los días.</p>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200" htmlFor="notification-timezone">Zona horaria IANA</label>
							<input id="notification-timezone" type="text" value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} autoComplete="off" className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
							<p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Detectada: {detectTimezone()}. Puedes editarla.</p>
						</div>
					</div>
					<div className="mt-6 flex justify-end">
						<button type="submit" disabled={isPending} className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b79b72] dark:text-[#253449]">
							{isPending ? "Guardando…" : "Guardar preferencias"}
						</button>
					</div>
				</>
			)}
		</form>
	);
}
