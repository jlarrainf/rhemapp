export class PushProviderError extends Error {
	constructor(message, { code = "PUSH_PROVIDER_ERROR", retryable = true, invalidToken = false } = {}) {
		super(message);
		this.name = "PushProviderError";
		this.code = code;
		this.retryable = retryable;
		this.invalidToken = invalidToken;
	}
}

function getProviderUrl() {
	const value = process.env.PUSH_PROVIDER_URL || "";
	if (!value) throw new PushProviderError("El proveedor de avisos no está configurado", { code: "provider_not_configured", retryable: false });
	try {
		const url = new URL(value);
		if (url.protocol !== "https:" && process.env.NODE_ENV === "production") throw new Error("https_required");
		return url.toString();
	} catch {
		throw new PushProviderError("La URL del proveedor de avisos no es válida", { code: "provider_configuration_invalid", retryable: false });
	}
}

export async function sendPushNotification({ token, payload, idempotencyKey }) {
	const url = getProviderUrl();
	const providerToken = process.env.PUSH_PROVIDER_TOKEN || "";
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...(providerToken ? { Authorization: `Bearer ${providerToken}` } : {}),
			"Idempotency-Key": idempotencyKey,
		},
		body: JSON.stringify({ token, payload, idempotencyKey }),
		cache: "no-store",
	});

	if (response.status === 404 || response.status === 410) {
		throw new PushProviderError("El proveedor rechazó el token del dispositivo", { code: "invalid_token", retryable: false, invalidToken: true });
	}
	if (!response.ok) {
		throw new PushProviderError(`El proveedor respondió con estado ${response.status}`, {
			code: response.status >= 500 ? "provider_unavailable" : "provider_rejected",
			retryable: response.status >= 500 || response.status === 429,
		});
	}

	const result = await response.json().catch(() => ({}));
	return {
		messageId: typeof result?.messageId === "string" ? result.messageId.slice(0, 200) : response.headers.get("x-message-id"),
	};
}
