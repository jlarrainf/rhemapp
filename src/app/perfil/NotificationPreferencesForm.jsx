"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_PREFERENCES = { enabled: false, localTime: "08:00", timezone: "America/Santiago" };

function detectTimezone() {
	try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Santiago"; } catch { return "America/Santiago"; }
}

export default function NotificationPreferencesForm() {
	const detectedTimezone = useMemo(() => detectTimezone(), []);
	const [preferences, setPreferences] = useState(() => ({ ...DEFAULT_PREFERENCES, timezone: detectedTimezone }));
	const [pending, setPending] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [notice, setNotice] = useState("");

	useEffect(() => {
		let active = true;
		fetch("/api/notification-preferences", { cache: "no-store" })
			.then(async (response) => {
				const data = await response.json().catch(() => null);
				if (!response.ok) throw new Error(data?.error || "No se pudieron cargar las preferencias de avisos.");
				if (active && data?.preferences) setPreferences(data.preferences);
			})
			.catch((cause) => { if (active) setError(cause.message); })
			.finally(() => { if (active) setPending(false); });
		return () => { active = false; };
	}, []);

	const save = async (event) => {
		event.preventDefault();
		setSaving(true); setError(""); setNotice("");
		try {
			const response = await fetch("/api/notification-preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify(preferences) });
			const data = await response.json().catch(() => null);
			if (!response.ok) throw new Error(data?.error || "No se pudieron guardar las preferencias de avisos.");
			setPreferences(data.preferences); setNotice("Preferencias de avisos guardadas.");
		} catch (cause) { setError(cause.message || "No se pudieron guardar las preferencias de avisos."); }
		finally { setSaving(false); }
	};

	return (
		<section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-8" aria-labelledby="notification-preferences-title">
			<h2 id="notification-preferences-title" className="text-xl font-semibold text-[#314156] dark:text-gray-100">Avisos de la lectura</h2>
			<p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Los avisos están disponibles en la app Android. La PWA nunca solicita permisos de notificación.</p>
			{pending ? <p className="mt-5 text-sm text-gray-500" role="status">Cargando preferencias…</p> : (
				<form className="mt-5 space-y-5" onSubmit={save}>
					<label className="flex min-h-11 items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-200">
						<input type="checkbox" checked={preferences.enabled} onChange={(event) => setPreferences({ ...preferences, enabled: event.target.checked })} className="h-5 w-5 accent-[#314156]" />
						<span>Activar aviso diario</span>
					</label>
					<div className="grid gap-4 sm:grid-cols-2">
						<div><label htmlFor="notification-local-time" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Hora local</label><input id="notification-local-time" type="time" value={preferences.localTime} onChange={(event) => setPreferences({ ...preferences, localTime: event.target.value })} className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></div>
						<div><label htmlFor="notification-timezone" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">Zona horaria IANA</label><input id="notification-timezone" value={preferences.timezone} onChange={(event) => setPreferences({ ...preferences, timezone: event.target.value })} className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 outline-none focus:border-[#b79b72] focus:ring-2 focus:ring-[#b79b72]/30 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Detectada: {detectedTimezone}</p></div>
					</div>
					{error && <p className="text-sm text-red-700 dark:text-red-300" role="alert">{error}</p>}
					{notice && <p className="text-sm text-green-700 dark:text-green-300" role="status">{notice}</p>}
					<button type="submit" disabled={saving} className="min-h-11 rounded-lg bg-[#314156] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#253449] focus:outline-none focus:ring-2 focus:ring-[#b79b72] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#b79b72] dark:text-[#253449]">{saving ? "Guardando…" : "Guardar preferencias"}</button>
				</form>
			)}
		</section>
	);
}
