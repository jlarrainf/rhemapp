import { createHash, randomBytes } from "node:crypto";

const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export class ShareTokenError extends Error {
	constructor() {
		super("El enlace compartido no es válido");
		this.name = "ShareTokenError";
		this.status = 404;
	}
}

export function createShareToken() {
	const token = randomBytes(32).toString("base64url");
	return { token, tokenHash: hashShareToken(token) };
}

export function hashShareToken(token) {
	if (typeof token !== "string" || !SHARE_TOKEN_PATTERN.test(token)) throw new ShareTokenError();
	return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isShareToken(value) {
	return typeof value === "string" && SHARE_TOKEN_PATTERN.test(value);
}

export { SHARE_TOKEN_PATTERN };
