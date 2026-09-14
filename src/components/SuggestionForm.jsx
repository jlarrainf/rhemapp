"use client";

import { useState } from "react";

const READING_TYPES = [
	["first-reading", "Primera lectura"],
	["psalm", "Salmo"],
	["second-reading", "Segunda lectura"],
	["gospel", "Evangelio"],
];

export default function SuggestionForm({ onCreated }) {
	const [form, setForm] = useState({ date: "", readingType: "gospel", reference: "", sourceUrl: "", body: "" });
	const [status, setStatus] = useState("");
	const [error, setError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	function updateField(event) {
		setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setStatus("");
		setIsSubmitting(true);
		try {
			const response = await fetch("/api/suggestions", {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify(form),
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo enviar la sugerencia.");
			onCreated?.(data.suggestion);
			setForm({ date: "", readingType: "gospel", reference: "", sourceUrl: "", body: "" });
			setStatus("Tu sugerencia quedó pendiente de revisión.");
		} catch (cause) {
			setError(cause.message || "No se pudo enviar la sugerencia.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800" aria-labelledby="suggestion-form-title">
			<h2 id="suggestion-form-title" className="text-xl font-semibold text-[#314156] dark:text-gray-100">Enviar una sugerencia</h2>
			<p className="text-sm text-gray-600 dark:text-gray-300">Las propuestas se revisan antes de modificar las lecturas publicadas.</p>
			<div className="grid gap-4 sm:grid-cols-2">
				<label className="space-y-1 text-sm font-medium text-[#314156] dark:text-gray-100">
					<span>Fecha de la lectura</span>
					<input name="date" type="date" required value={form.date} onChange={updateField} className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900" />
				</label>
				<label className="space-y-1 text-sm font-medium text-[#314156] dark:text-gray-100">
					<span>Tipo de lectura</span>
					<select name="readingType" required value={form.readingType} onChange={updateField} className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900">
						{READING_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
					</select>
				</label>
			</div>
			<label className="block space-y-1 text-sm font-medium text-[#314156] dark:text-gray-100">
				<span>Referencia bíblica</span>
				<input name="reference" required maxLength={300} value={form.reference} onChange={updateField} placeholder="Ej.: Lucas 6:27-36" className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900" />
			</label>
			<label className="block space-y-1 text-sm font-medium text-[#314156] dark:text-gray-100">
				<span>Fuente verificable</span>
				<input name="sourceUrl" type="url" required maxLength={500} value={form.sourceUrl} onChange={updateField} placeholder="https://…" className="min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900" />
			</label>
			<label className="block space-y-1 text-sm font-medium text-[#314156] dark:text-gray-100">
				<span>Qué debería revisarse</span>
				<textarea name="body" required maxLength={5000} value={form.body} onChange={updateField} rows={5} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-900" placeholder="Describe la lectura nueva o el dato que necesita corrección." />
			</label>
			{error && <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">{error}</p>}
			{status && <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300" role="status">{status}</p>}
			<button type="submit" disabled={isSubmitting} className="min-h-11 rounded-md bg-[#314156] px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] disabled:opacity-50 dark:bg-[#b79b72] dark:text-[#253449]">
				{isSubmitting ? "Enviando…" : "Enviar sugerencia"}
			</button>
		</form>
	);
}
