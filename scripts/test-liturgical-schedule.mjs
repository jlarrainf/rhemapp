import assert from "node:assert/strict";
import test from "node:test";
import {
	DAILY_TIME_ZONE,
	resolveReadingDate,
	resolveSundayDateKey,
} from "../src/lib/liturgicalSchedule.js";

test("resolves today using the Chilean calendar date", () => {
	const now = new Date("2026-09-13T02:00:00Z");
	const result = resolveReadingDate({ now, timeZone: DAILY_TIME_ZONE });

	assert.deepEqual(result, { dateKey: "2026-09-12", mode: "today" });
});

test("keeps an explicit selected date independent from the device instant", () => {
	const result = resolveReadingDate({
		dateKey: "2025-01-01",
		now: new Date("2030-02-03T23:30:00Z"),
	});

	assert.deepEqual(result, { dateKey: "2025-01-01", mode: "date" });
});

test("rejects invalid and out-of-range selected dates", () => {
	assert.throws(
		() => resolveReadingDate({ dateKey: "2026-02-30" }),
		(error) => error.status === 400 && /YYYY-MM-DD/.test(error.message)
	);
	assert.throws(
		() => resolveReadingDate({ dateKey: "2024-12-31" }),
		(error) => error.status === 400 && /2025-01-01/.test(error.message)
	);
});

test("uses the previous Sunday before Saturday 15:00 in Chile", () => {
	const result = resolveSundayDateKey({ now: new Date("2026-09-19T17:59:59Z") });
	assert.equal(result, "2026-09-13");
});

test("covers both sides of the exact Saturday 15:00:00 cutoff", () => {
	assert.equal(resolveSundayDateKey({ now: new Date("2026-09-19T17:59:59Z") }), "2026-09-13");
	assert.equal(resolveSundayDateKey({ now: new Date("2026-09-19T18:00:00Z") }), "2026-09-20");
	assert.equal(resolveReadingDate({ dateKey: "2026-09-13", now: new Date("2026-09-19T18:00:00Z") }).dateKey, "2026-09-13");
});

test("uses the most recent Sunday on Monday", () => {
	const result = resolveSundayDateKey({ now: new Date("2026-09-14T12:00:00Z") });
	assert.equal(result, "2026-09-13");
});

test("uses the next Sunday at Saturday 15:00 in Chile", () => {
	const result = resolveSundayDateKey({ now: new Date("2026-09-19T18:00:00Z") });
	assert.equal(result, "2026-09-20");
});

test("uses the current Sunday during Sunday", () => {
	const result = resolveSundayDateKey({ now: new Date("2026-09-20T15:00:00Z") });
	assert.equal(result, "2026-09-20");
});
