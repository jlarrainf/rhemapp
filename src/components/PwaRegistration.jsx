"use client";

import { useEffect } from "react";

export default function PwaRegistration() {
	useEffect(() => {
		if (!("serviceWorker" in navigator)) return undefined;
		let cancelled = false;
		navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
			if (!cancelled) {
				// La lectura manual sigue disponible cuando el navegador no admite PWA.
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);

	return null;
}
