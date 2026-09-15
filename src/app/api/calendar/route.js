import { NextResponse } from "next/server";
import { CalendarRequestError, getLiturgicalCalendarMonth, parseCalendarRequest } from "../../../lib/liturgicalCalendar.js";

export const dynamic = "force-dynamic";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const { monthKey, calendar } = parseCalendarRequest(searchParams);
		const result = await getLiturgicalCalendarMonth({ monthKey, calendar });
		const response = NextResponse.json(result);
		response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
		return response;
	} catch (error) {
		const status = error?.status || (error instanceof CalendarRequestError ? 400 : 503);
		if (status >= 500) console.error("Error al cargar el calendario litúrgico:", error);
		return NextResponse.json(
			{ error: error?.message || "No se pudo cargar el calendario litúrgico" },
			{ status }
		);
	}
}
