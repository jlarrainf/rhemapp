import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { validateReadingEntry } from "../src/lib/readings/validateReading.js";

const fixturesDirectory = path.join(process.cwd(), "specs", "001-liturgical-readings", "fixtures");

function loadFixture(fileName) {
	return JSON.parse(fs.readFileSync(path.join(fixturesDirectory, fileName), "utf8"));
}

function clone(value) {
	return JSON.parse(JSON.stringify(value));
}

function assertInvalid(entry, message) {
	const result = validateReadingEntry(entry);
	assert.equal(result.valid, false, message);
	assert.ok(result.errors.length > 0, "An invalid entry must report at least one error");
}

test("accepts a celebration with four readings in liturgical order", () => {
	const result = validateReadingEntry(loadFixture("2026-09-13-complete.json"));
	assert.deepEqual(result, { valid: true, errors: [] });
});

test("accepts a celebration without a second reading", () => {
	const result = validateReadingEntry(loadFixture("2026-09-10-without-second-reading.json"));
	assert.deepEqual(result, { valid: true, errors: [] });
});

test("rejects an unknown reading type", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.readings[0].type = "reflection";
	assertInvalid(entry, "Unknown reading types must be rejected");
});

test("rejects an order that does not match the reading type", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.readings[0].order = 2;
	assertInvalid(entry, "Mismatched liturgical orders must be rejected");
});

test("rejects an invalid reference", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.readings[0].reference = "Primera lectura sin cita";
	assertInvalid(entry, "References without a book and range must be rejected");
});

test("rejects an invalid range", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.readings[0].ranges = [{ chapter: 27, start: 30, end: 7 }];
	assertInvalid(entry, "Ranges whose end precedes their start must be rejected");
});

test("rejects an unverified source", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.readings[0].source.verified = false;
	assertInvalid(entry, "Unverified sources must be rejected");
});

test("rejects a missing required reading", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	entry.readings = entry.readings.filter((reading) => reading.type !== "gospel");
	assertInvalid(entry, "A missing Gospel must be rejected");
});

test("does not mutate the validated entry", () => {
	const entry = loadFixture("2026-09-13-complete.json");
	const original = clone(entry);
	validateReadingEntry(entry);
	assert.deepEqual(entry, original);
});
