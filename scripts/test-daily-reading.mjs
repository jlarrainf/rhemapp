import assert from "node:assert/strict";
import test from "node:test";
import {
	ReadingUnavailableError,
	getDailyReading,
	getPublishedReading,
} from "../src/lib/dailyReading.js";

test("publishes a generic entry for an explicit date", () => {
	const result = getPublishedReading({ dateKey: "2026-09-10", mode: "date" });

	assert.equal(result.dateKey, "2026-09-10");
	assert.equal(result.mode, "date");
	assert.deepEqual(
		result.readings.map((reading) => reading.type),
		["first-reading", "psalm", "gospel"],
	);
});

test("resolves the published Sunday entry through the generic domain", () => {
	const result = getPublishedReading({
		mode: "sunday",
		now: new Date("2026-09-13T15:00:00Z"),
	});

	assert.equal(result.dateKey, "2026-09-13");
	assert.equal(result.mode, "sunday");
	assert.equal(result.readings.at(-1).type, "gospel");
});

test("rejects an empty explicit date before resolving today", () => {
	assert.throws(
		() => getPublishedReading({ dateKey: "", mode: "date" }),
		(error) => error.status === 400 && error.message.includes("vacía"),
	);
});

test("reports a missing calendar year as unavailable content", () => {
	assert.throws(
		() => getPublishedReading({ dateKey: "2027-01-01", mode: "date" }),
		(error) => error instanceof ReadingUnavailableError && error.status === 404,
	);
});

test("keeps the compatible daily contract while exposing readings", () => {
	const result = getDailyReading({ date: new Date("2026-09-10T12:00:00Z") });

	assert.equal(result.dateKey, "2026-09-10");
	assert.equal(result.readings[0].type, "first-reading");
	assert.equal(result.gospel.reference, "Lucas 6:27-36");
});
