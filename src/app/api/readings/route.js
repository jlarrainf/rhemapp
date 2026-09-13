import { NextResponse } from "next/server";
import {
	DAILY_TIME_ZONE,
	ReadingRequestError,
	ReadingUnavailableError,
	getPublishedReading,
} from "../../../lib/dailyReading.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const dateValues = searchParams.getAll("date");
		const modeValues = searchParams.getAll("mode");
		if (dateValues.length > 1 || modeValues.length > 1) {
			throw new ReadingRequestError("Cada parámetro solo puede aparecer una vez");
		}
		const date = dateValues[0] ?? null;
		const requestedMode = modeValues[0] ?? null;

		if (date !== null && requestedMode !== null) {
			throw new ReadingRequestError("No se pueden combinar date y mode");
		}
		if (date === "") throw new ReadingRequestError("La fecha seleccionada no puede estar vacía");

		if (requestedMode !== null && !["today", "sunday"].includes(requestedMode)) {
			throw new ReadingRequestError("El modo debe ser today o sunday");
		}

		const reading = getPublishedReading({
			dateKey: date || undefined,
			mode: date !== null ? "date" : requestedMode || "today",
			timeZone: DAILY_TIME_ZONE,
		});
		const response = NextResponse.json(reading);

		response.headers.set("Cache-Control", "no-store, max-age=0");
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
		return response;
	} catch (error) {
		const status = error?.status || (error instanceof ReadingUnavailableError ? 404 : 503);
		if (status >= 500) console.error("Error al cargar las lecturas litúrgicas:", error);
		return NextResponse.json(
			{ error: error?.message || "No se pudieron cargar las lecturas litúrgicas" },
			{ status }
		);
	}
}
