import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTION_KEY_PATTERN = /^[0-9a-f]{64}$/i;

function getEncryptionKey() {
	const encoded = process.env.PUSH_TOKEN_ENCRYPTION_KEY || "";
	if (!ENCRYPTION_KEY_PATTERN.test(encoded)) {
		const error = new Error("El cifrado de tokens push no está configurado");
		error.code = "PUSH_TOKEN_ENCRYPTION_NOT_CONFIGURED";
		throw error;
	}
	return Buffer.from(encoded, "hex");
}

export function hashPushToken(token) {
	return createHash("sha256").update(String(token), "utf8").digest("hex");
}

export function encryptPushToken(token) {
	const iv = randomBytes(12);
	const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
	const ciphertext = Buffer.concat([cipher.update(String(token), "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return [iv, authTag, ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptPushToken(value) {
	const [ivEncoded, tagEncoded, ciphertextEncoded] = String(value || "").split(".");
	if (!ivEncoded || !tagEncoded || !ciphertextEncoded) throw new Error("El token push cifrado no es válido");
	try {
		const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivEncoded, "base64url"));
		decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"));
		return Buffer.concat([decipher.update(Buffer.from(ciphertextEncoded, "base64url")), decipher.final()]).toString("utf8");
	} catch {
		throw new Error("El token push cifrado no es válido");
	}
}
