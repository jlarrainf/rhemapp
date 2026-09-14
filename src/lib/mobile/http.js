import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { NOTIFICATION_HEADERS } from "./constants.js";

export function mobileJson(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...NOTIFICATION_HEADERS, ...(init.headers || {}) },
	});
}

export async function readJsonBody(request, maxBytes = 8192) {
	const contentType = request.headers.get("content-type") || "";
	if (!contentType.toLowerCase().includes("application/json")) {
		return { ok: false, response: mobileJson({ error: "La solicitud debe enviarse como JSON" }, { status: 415 }) };
	}
	const contentLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(contentLength) && contentLength > maxBytes) {
		return { ok: false, response: mobileJson({ error: "La solicitud es demasiado grande" }, { status: 413 }) };
	}
	try {
		const rawBody = await request.text();
		if (rawBody.length > maxBytes) return { ok: false, response: mobileJson({ error: "La solicitud es demasiado grande" }, { status: 413 }) };
		return { ok: true, value: JSON.parse(rawBody) };
	} catch {
		return { ok: false, response: mobileJson({ error: "El cuerpo de la solicitud no es un JSON válido" }, { status: 400 }) };
	}
}

function safeEqual(left, right) {
	const leftBuffer = Buffer.from(left || "", "utf8");
	const rightBuffer = Buffer.from(right || "", "utf8");
	return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAuthorizedSchedulerRequest(request) {
	const secret = process.env.NOTIFICATIONS_SCHEDULER_SECRET || "";
	if (!secret) return false;
	const headerSecret = request.headers.get("x-scheduler-secret") || "";
	const authorization = request.headers.get("authorization") || "";
	const bearerSecret = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
	return safeEqual(headerSecret, secret) || safeEqual(bearerSecret, secret);
}

export function getBearerToken(request) {
	const authorization = request.headers.get("authorization") || "";
	return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}
