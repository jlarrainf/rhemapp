import { NextResponse } from "next/server";
import {
	DAILY_TIME_ZONE,
	formatDailyDate,
	getDailyReading,
} from "@/lib/dailyReading";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		const reading = getDailyReading();
		const response = NextResponse.json({
			...reading,
			dateLabel: formatDailyDate(new Date(), DAILY_TIME_ZONE),
			timeZone: DAILY_TIME_ZONE,
		});

		response.headers.set(
			"Cache-Control",
			"no-store, max-age=0"
		);
		response.headers.set("X-Robots-Tag", "noindex, nofollow");
		return response;
	} catch (error) {
		console.error("Error al cargar el evangelio diario:", error);
		return NextResponse.json(
			{ error: error?.message || "No se pudo cargar el evangelio del día" },
			{ status: 503 }
		);
	}
}
