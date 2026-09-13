import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { migrateLegacyEntry } from "../src/lib/readings/migrateLegacyReading.js";
import { validateReadingEntry } from "../src/lib/readings/validateReading.js";

const root = process.cwd();
const fixturePath = path.join(root, "specs", "001-liturgical-readings", "fixtures", "2026-09-10-legacy-migrated.json");

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toLegacyEntry(entry) {
	const legacyEntry = { ...entry };
	delete legacyEntry.readings;
	return legacyEntry;
}

test("migrates a legacy gospel into a generic gospel reading", () => {
	const expectedFixture = readJson(fixturePath);
	const legacyEntry = toLegacyEntry(expectedFixture);
	const migratedEntry = migrateLegacyEntry(legacyEntry);

	assert.deepEqual(migratedEntry, expectedFixture);
	assert.deepEqual(migratedEntry.gospel, legacyEntry.gospel);
	assert.deepEqual(migratedEntry.readings[0].ranges, legacyEntry.gospel.ranges);
	assert.equal(migratedEntry.readings[0].reference, legacyEntry.gospel.reference);
	assert.equal(migratedEntry.readings[0].passageId, legacyEntry.gospel.passageId);
	assert.deepEqual(migratedEntry.readings[0].source, legacyEntry.source);
});

test("does not make an incomplete legacy entry publishable", () => {
	const legacyEntry = toLegacyEntry(readJson(fixturePath));
	const result = validateReadingEntry(migrateLegacyEntry(legacyEntry));

	assert.equal(result.valid, false);
	assert.ok(result.errors.some((error) => error.includes("first-reading")));
	assert.ok(result.errors.some((error) => error.includes("psalm")));
});
