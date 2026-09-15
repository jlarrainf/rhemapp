export class PushProviderError extends Error {
	constructor(message, { code = "provider_error", invalidToken = false, retryable = false } = {}) {
		super(message);
		this.name = "PushProviderError";
		this.code = code;
		this.invalidToken = invalidToken;
		this.retryable = retryable;
	}
}

export async function sendPushNotification({ token, payload, idempotencyKey }) {
	const providerUrl = process.env.PUSH_PROVIDER_URL;
	if (!providerUrl) throw new PushProviderError("El proveedor de avisos no está configurado", { code: "provider_not_configured" });
	let url;
	try {
		url = new URL(providerUrl);
		if (!/^https?:$/i.test(url.protocol)) throw new Error("unsupported protocol");
	} catch {
		throw new PushProviderError("La URL del proveedor de avisos no es válida", { code: "provider_not_configured" });
	}
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15_000);
	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"Idempotency-Key": idempotencyKey,
				...(process.env.PUSH_PROVIDER_TOKEN ? { Authorization: `Bearer ${process.env.PUSH_PROVIDER_TOKEN}` } : {}),
			},
			body: JSON.stringify({ token, payload, idempotencyKey }),
			signal: controller.signal,
		});
		if (response.status === 404 || response.status === 410) {
			throw new PushProviderError("El proveedor rechazó el token", { code: "invalid_token", invalidToken: true });
		}
		if (response.status === 429 || response.status >= 500) {
			throw new PushProviderError("El proveedor no está disponible", { code: "provider_retryable", retryable: true });
		}
		if (!response.ok) throw new PushProviderError("El proveedor rechazó el aviso", { code: "provider_rejected" });
		let data = {};
		try { data = await response.json(); } catch { /* A successful adapter may omit a response body. */ }
		return { messageId: typeof data?.messageId === "string" ? data.messageId.slice(0, 200) : null };
	} catch (error) {
		if (error instanceof PushProviderError) throw error;
		throw new PushProviderError("No se pudo contactar al proveedor", { code: error?.name === "AbortError" ? "provider_timeout" : "provider_network", retryable: true });
	} finally {
		clearTimeout(timeout);
	}
}
