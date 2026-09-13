import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateDailyDataset } from "../src/lib/readings/validateDailyDataset.js";

const fixturesDirectory = path.join(process.cwd(), "specs", "001-liturgical-readings", "fixtures");

function loadFixture(fileName) {
	return JSON.parse(fs.readFileSync(path.join(fixturesDirectory, fileName), "utf8"));
}

function asDataset(...entries) {
	return { calendar: "chile", year: 2026, liturgicalYear: "2026", entries };
}

test("accepts complete and no-second-reading fixtures", () => {
	const result = validateDailyDataset(asDataset(
		loadFixture("2026-09-10-without-second-reading.json"),
		loadFixture("2026-09-13-complete.json"),
	), { year: "2026", start: "2026-09-10", end: "2026-09-10" });

	assert.equal(result.valid, true);
});

test("detects duplicate dates", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	const result = validateDailyDataset(asDataset(entry, structuredClone(entry)), {
		year: "2026",
		start: "2026-09-13",
		end: "2026-09-13",
	});

	assert.equal(result.valid, false);
	assert.ok(result.errors.some((error) => error.includes("Fecha duplicada")));
});

test("detects incomplete readings and missing traceability", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.readings = entry.readings.filter((reading) => reading.type !== "psalm");
	entry.source.url = "";
	const result = validateDailyDataset(asDataset(entry), {
		year: "2026",
		start: "2026-09-13",
		end: "2026-09-13",
	});

	assert.equal(result.valid, false);
	assert.ok(result.errors.some((error) => error.includes("psalm")));
	assert.ok(result.errors.some((error) => error.includes("source")));
});

test("detects a missing date in the requested range", () => {
	const result = validateDailyDataset(asDataset(loadFixture("2026-09-13-complete.json")), {
		year: "2026",
		start: "2026-09-12",
		end: "2026-09-13",
	});

	assert.equal(result.valid, false);
	assert.ok(result.errors.some((error) => error.includes("Falta lectura para 2026-09-12")));
});
