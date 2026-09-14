"use client";

import { useState } from "react";
import { buildPublicShareUrl } from "@/lib/sharing/publicUrls.js";

function getShareTitle(content) {
	return content?.title || content?.reference || "Lectura de Rhemapp";
}

async function copyShareUrl(url) {
	if (navigator.clipboard?.writeText) {
		await navigator.clipboard.writeText(url);
		return true;
	}
	return false;
}

export default function ShareReadingButton({ content, privateResource = null }) {
	const [shareUrl, setShareUrl] = useState("");
	const [status, setStatus] = useState("");
	const [isBusy, setIsBusy] = useState(false);
	const [isRevoked, setIsRevoked] = useState(false);
	const [privateShareId, setPrivateShareId] = useState(privateResource?.shareId || "");

	const shareUrlWithFallback = async (url) => {
		setShareUrl(url);
		if (typeof navigator.share === "function") {
			try {
				await navigator.share({ title: getShareTitle(content), text: content?.reference || "Lectura compartida desde Rhemapp", url });
				setStatus("Compartido correctamente.");
				return;
			} catch (error) {
				if (error?.name === "AbortError") {
					setStatus("Compartir cancelado.");
					return;
				}
			}
		}

		try {
			const copied = await copyShareUrl(url);
			setStatus(copied
				? "Enlace copiado al portapapeles."
				: "No se pudo copiar automáticamente. Selecciona el enlace para copiarlo.");
		} catch {
			setStatus("No se pudo copiar automáticamente. Selecciona el enlace para copiarlo.");
		}
	};

	const handleShare = async () => {
		if (isBusy || isRevoked) return;
		setIsBusy(true);
		setStatus("");
		try {
			let url;
			if (privateResource) {
				const response = await fetch("/api/shares", {
					method: "POST",
					headers: { "Content-Type": "application/json", Accept: "application/json" },
					body: JSON.stringify(privateResource),
				});
				const data = await response.json().catch(() => ({}));
				if (!response.ok || !data.share?.url) throw new Error(data.error || "No se pudo crear el enlace privado.");
				url = data.share.url;
				setPrivateShareId(data.share.id || "");
			} else {
				url = buildPublicShareUrl(content, window.location.origin);
			}
			setIsRevoked(false);
			await shareUrlWithFallback(url);
		} catch (error) {
			setStatus(error.message || "No se pudo preparar el enlace compartido.");
		} finally {
			setIsBusy(false);
		}
	};

	const revokeShare = async () => {
		if (!privateShareId || isBusy || isRevoked) return;
		setIsBusy(true);
		setStatus("");
		try {
			const response = await fetch(`/api/shares/${encodeURIComponent(privateShareId)}`, {
				method: "DELETE",
				headers: { Accept: "application/json" },
			});
			const data = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(data.error || "No se pudo revocar el enlace privado.");
			setIsRevoked(true);
			setStatus("Enlace privado revocado.");
		} catch (error) {
			setStatus(error.message || "No se pudo revocar el enlace privado.");
		} finally {
			setIsBusy(false);
		}
	};

	return (
		<div className="flex flex-wrap items-center justify-center gap-2">
			<button
				type="button"
				onClick={() => void handleShare()}
				disabled={isBusy || isRevoked}
				className="min-h-10 rounded-full border border-[#b79b72] px-4 py-2 text-sm font-medium text-[#314156] transition-colors hover:bg-[#b79b72]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79b72] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-100 dark:focus-visible:ring-offset-gray-800"
			>
				{isBusy ? "Preparando enlace…" : isRevoked ? "Enlace revocado" : privateResource ? "Compartir enlace privado" : "Compartir lectura"}
			</button>
			{privateShareId && shareUrl && !isRevoked && (
				<button
					type="button"
					onClick={() => void revokeShare()}
					disabled={isBusy}
					className="min-h-10 rounded-full px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/40"
				>
					Revocar enlace
				</button>
			)}
			{shareUrl && status.includes("selecciona") && (
				<input
					className="min-h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-[#314156] focus:border-[#b79b72] focus:outline-none focus:ring-2 focus:ring-[#b79b72]/40 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 sm:w-auto sm:min-w-80"
					value={shareUrl}
					readOnly
					onFocus={(event) => event.target.select()}
					aria-label="Enlace para compartir"
				/>
			)}
			{status && <p className="w-full text-center text-sm text-gray-600 dark:text-gray-300" role="status">{status}</p>}
		</div>
	);
}
