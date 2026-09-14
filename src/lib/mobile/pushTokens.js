import crypto from "node:crypto";

function getEncryptionKey() {
	const configured = process.env.PUSH_TOKEN_ENCRYPTION_KEY || "";
	if (!/^[0-9a-f]{64}$/i.test(configured)) {
		const error = new Error("PUSH_TOKEN_ENCRYPTION_KEY debe ser una clave hexadecimal de 32 bytes");
		error.code = "PUSH_TOKEN_ENCRYPTION_NOT_CONFIGURED";
		throw error;
	}
	return Buffer.from(configured, "hex");
}

export function hashPushToken(token) {
	return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function encryptPushToken(token) {
	const key = getEncryptionKey();
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
	const ciphertext = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return [iv, authTag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptPushToken(value) {
	const [ivValue, authTagValue, ciphertextValue] = String(value || "").split(".");
	if (!ivValue || !authTagValue || !ciphertextValue) throw new Error("El token cifrado no tiene un formato válido");
	const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivValue, "base64url"));
	decipher.setAuthTag(Buffer.from(authTagValue, "base64url"));
	return Buffer.concat([
		decipher.update(Buffer.from(ciphertextValue, "base64url")),
		decipher.final(),
	]).toString("utf8");
}
