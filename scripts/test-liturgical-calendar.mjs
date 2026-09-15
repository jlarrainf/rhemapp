import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
	addCalendarMonths,
	getCalendarMonthDateKeys,
	getCalendarMonthLabel,
	getWeekdayIndexForDateKey,
	isValidMonthKey,
} from "../src/lib/liturgicalSchedule.js";
import {
	assertValidCalendarMonth,
	getLiturgicalCalendarMonth,
	parseCalendarRequest,
} from "../src/lib/liturgicalCalendar.js";

const invalidCases = JSON.parse(fs.readFileSync(
	path.join(process.cwd(), "specs", "009-liturgical-calendar", "fixtures", "invalid-calendar.json"),
	"utf8"
));

test("validates and navigates ISO calendar months without date-only parsing", () => {
	assert.equal(isValidMonthKey("2026-02"), true);
	assert.equal(isValidMonthKey("2026-2"), false);
	assert.equal(isValidMonthKey("2026-13"), false);
	assert.equal(getCalendarMonthDateKeys("2026-02").length, 28);
	assert.equal(getCalendarMonthDateKeys("2028-02").length, 29);
	assert.equal(addCalendarMonths("2026-12", 1), "2027-01");
	assert.equal(addCalendarMonths("2027-01", -1), "2026-12");
	assert.equal(getWeekdayIndexForDateKey("2026-09-13"), 0);
	assert.match(getCalendarMonthLabel("2026-09"), /septiembre de 2026/i);
});

test("rejects invalid and pre-publication months", () => {
	for (const month of invalidCases.invalidMonths.filter((value) => value !== "2026-02")) {
		assert.throws(() => assertValidCalendarMonth(month));
	}
	assert.throws(() => assertValidCalendarMonth("2024-12"));
});

test("derives a short monthly summary and marks unpublished days unavailable", async () => {
	const calendar = await getLiturgicalCalendarMonth({ monthKey: "2026-09" });
	assert.equal(calendar.calendar, "chile");
	assert.equal(calendar.timeZone, "America/Santiago");
	assert.equal(calendar.days.length, 30);
	assert.equal(calendar.days[0].date, "2026-09-01");
	assert.equal(calendar.days[0].available, false);
	const publishedDay = calendar.days.find((day) => day.available);
	assert.ok(publishedDay);
	assert.equal(typeof publishedDay.primaryCelebration, "string");
	assert.equal("readings" in publishedDay, false);
	const saintDay = calendar.days.find((day) => day.date === "2026-09-26");
	assert.deepEqual(saintDay.saints, ["Santos Cosme y Damián"]);
	const noSaintDay = calendar.days.find((day) => day.date === "2026-09-12");
	assert.deepEqual(noSaintDay.saints, []);
	const currentSaintDay = calendar.days.find((day) => day.date === "2026-09-15");
	assert.deepEqual(currentSaintDay.saints, ["Nuestra Señora de los Dolores"]);
});

test("rejects an unsupported calendar without inventing a second calendar", async () => {
	await assert.rejects(
		() => getLiturgicalCalendarMonth({ monthKey: "2026-09", calendar: "argentina" }),
		/usa chile/
	);
});

test("parses the public calendar request and rejects repeated parameters", () => {
	assert.deepEqual(parseCalendarRequest(new URLSearchParams("month=2026-09")), { monthKey: "2026-09", calendar: "chile" });
	assert.throws(() => parseCalendarRequest(new URLSearchParams("month=2026-09&month=2026-10")), /una vez/);
	assert.throws(() => parseCalendarRequest(new URLSearchParams("calendar=chile")), /obligatorio/);
});
