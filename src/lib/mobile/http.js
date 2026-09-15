import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { MOBILE_RESPONSE_HEADERS } from "./constants.js";

export function mobileJson(data, init = {}) {
	return NextResponse.json(data, {
		...init,
		headers: { ...MOBILE_RESPONSE_HEADERS, ...(init.headers || {}) },
	});
}

export function isSameOrigin(request) {
	const origin = request.headers.get("origin");
	return !origin || origin === new URL(request.url).origin;
}

export async function parseJsonBody(request, { maxBytes = 32_768 } = {}) {
	const contentLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(contentLength) && contentLength > maxBytes) {
		const error = new Error("La solicitud es demasiado grande");
		error.status = 413;
		throw error;
	}
	const contentType = request.headers.get("content-type") || "";
	if (!contentType.toLowerCase().includes("application/json")) {
		const error = new Error("La solicitud debe enviarse como JSON");
		error.status = 415;
		throw error;
	}
	const raw = await request.text();
	if (raw.length > maxBytes) {
		const error = new Error("La solicitud es demasiado grande");
		error.status = 413;
		throw error;
	}
	try {
		return JSON.parse(raw);
	} catch {
		const error = new Error("El cuerpo de la solicitud no es un JSON válido");
		error.status = 400;
		throw error;
	}
}

export function getBearerToken(request) {
	const value = request.headers.get("authorization") || "";
	return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

function safeEqual(left, right) {
	const a = Buffer.from(String(left || ""));
	const b = Buffer.from(String(right || ""));
	return a.length === b.length && timingSafeEqual(a, b);
}

export function isAuthorizedSchedulerRequest(request) {
	const expected = process.env.NOTIFICATIONS_SCHEDULER_SECRET;
	if (!expected) return false;
	const provided = request.headers.get("x-scheduler-secret") || getBearerToken(request);
	return safeEqual(provided, expected);
}
