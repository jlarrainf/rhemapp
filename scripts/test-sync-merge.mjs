import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { mergeValidatedReading } from "../src/lib/readings/mergeSyncedReading.js";
import { markReadingFresh, markReadingStale, recordSyncAttempt } from "../src/lib/readings/syncState.js";

const fixturesDirectory = path.join(process.cwd(), "specs", "001-liturgical-readings", "fixtures");

function loadFixture(fileName) {
	return JSON.parse(fs.readFileSync(path.join(fixturesDirectory, fileName), "utf8"));
}

test("preserves the previous verified entry when the new entry is incomplete", () => {
	const previousEntry = loadFixture("2026-09-13-complete.json");
	const nextEntry = loadFixture("2026-09-13-complete.json");
	nextEntry.readings[1].source.verified = false;

	const result = mergeValidatedReading(previousEntry, nextEntry);

	assert.equal(result.updated, false);
	assert.deepEqual(result.entry, previousEntry);
	assert.ok(result.errors.some((error) => error.includes("source")));
});

test("replaces the previous entry only with a complete verified entry", () => {
	const previousEntry = loadFixture("2026-09-10-without-second-reading.json");
	const nextEntry = loadFixture("2026-09-13-complete.json");

	const result = mergeValidatedReading(previousEntry, nextEntry);

	assert.equal(result.updated, true);
	assert.deepEqual(result.entry, nextEntry);
});

test("marks a preserved entry as stale without losing its source", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	const staleEntry = markReadingStale(entry, new Error("Fuente temporalmente no disponible"), "2026-09-13T12:00:00.000Z");

	assert.equal(staleEntry.source.syncStatus, "stale");
	assert.equal(staleEntry.source.lastSyncAttemptAt, "2026-09-13T12:00:00.000Z");
	assert.equal(staleEntry.source.provider, entry.source.provider);
	assert.ok(staleEntry.readings.every((reading) => reading.source.syncStatus === "stale"));
	assert.equal(entry.source.syncStatus, undefined);
});

test("clears stale sync metadata after a successful fetch", () => {
	const entry = markReadingStale(loadFixture("2026-09-13-complete.json"), new Error("fallo"));
	const freshEntry = markReadingFresh(entry, "2026-09-13T13:00:00.000Z");

	assert.equal(freshEntry.source.syncStatus, "fresh");
	assert.equal(freshEntry.source.fetchedAt, "2026-09-13T13:00:00.000Z");
	assert.equal(freshEntry.source.lastSyncError, undefined);
	assert.ok(freshEntry.readings.every((reading) => reading.source.syncStatus === "fresh"));
});

test("updates metadata provenance together with the reading provenance", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.celebrations = [{
		name: "XXIV Domingo del Tiempo Ordinario",
		rank: "other",
		isPrimary: true,
		saints: [{
			name: "Santo de prueba editorial",
			source: { provider: "Fuente editorial", url: "https://example.com/saint", verified: true },
		}],
		source: { provider: "Fuente editorial", url: "https://example.com/day", verified: true },
	}];
	const freshEntry = markReadingFresh(entry, "2026-09-13T13:00:00.000Z");

	assert.equal(freshEntry.celebrations[0].source.syncStatus, "fresh");
	assert.equal(freshEntry.celebrations[0].source.fetchedAt, "2026-09-13T13:00:00.000Z");
	assert.equal(freshEntry.celebrations[0].saints[0].source.syncStatus, "fresh");
	assert.equal(freshEntry.celebrations[0].saints[0].source.fetchedAt, "2026-09-13T13:00:00.000Z");
	const staleEntry = markReadingStale(entry, new Error("fuente temporalmente no disponible"), "2026-09-13T14:00:00.000Z");
	assert.equal(staleEntry.celebrations[0].saints[0].source.syncStatus, "stale");
	assert.equal(staleEntry.celebrations[0].saints[0].source.provider, "Fuente editorial");
});

test("records every sync attempt with a bounded error and public source", () => {
	const attempts = recordSyncAttempt({}, "2026-09-13", {
		status: "unavailable",
		attemptedAt: "2026-09-15T12:00:00.000Z",
		source: { provider: "Fuente primaria", url: "https://example.com/day" },
		error: "x".repeat(1000),
	});
	assert.equal(attempts["2026-09-13"].status, "unavailable");
	assert.equal(attempts["2026-09-13"].source.provider, "Fuente primaria");
	assert.equal(attempts["2026-09-13"].attemptedAt, "2026-09-15T12:00:00.000Z");
	assert.equal(attempts["2026-09-13"].error.length, 240);
});
