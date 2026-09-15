import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { normalizeLiturgicalMetadata, toPublicPublishedEntry, validateLiturgicalMetadata } from "../src/lib/readings/liturgicalMetadata.js";
import { validateReadingEntry } from "../src/lib/readings/validateReading.js";

const root = process.cwd();
const metadata = JSON.parse(fs.readFileSync(path.join(root, "specs", "009-liturgical-calendar", "fixtures", "liturgical-metadata.json"), "utf8"));
const completeReading = JSON.parse(fs.readFileSync(path.join(root, "specs", "001-liturgical-readings", "fixtures", "2026-09-13-complete.json"), "utf8"));

function withMetadata(value) {
	return { ...completeReading, ...JSON.parse(JSON.stringify(value)) };
}

test("accepts verified primary celebration, season and color metadata", () => {
	const entry = withMetadata(metadata.complete);
	assert.deepEqual(validateLiturgicalMetadata(entry), { valid: true, errors: [] });
	assert.equal(validateReadingEntry(entry).valid, true);
	assert.equal(normalizeLiturgicalMetadata(entry)[0].isPrimary, true);
});

test("preserves the primary/optional editorial order and saint source", () => {
	const celebrations = normalizeLiturgicalMetadata(withMetadata(metadata.optional));
	assert.equal(celebrations[0].isPrimary, true);
	assert.equal(celebrations[1].rank, "optional-memorial");
	assert.equal(celebrations[0].saints[0].source.verified, true);
});

test("accepts valid readings when optional metadata is absent", () => {
	const entry = withMetadata(metadata.incomplete);
	entry.celebration = "";
	assert.equal(validateReadingEntry(entry).valid, true);
	assert.deepEqual(normalizeLiturgicalMetadata(entry), []);
});

test("rejects an unverified celebration source", () => {
	const result = validateReadingEntry(withMetadata(metadata.conflict));
	assert.equal(result.valid, false);
	assert.ok(result.errors.some((error) => error.includes("celebrations[0].source")));
});

test("rejects duplicate celebrations, duplicate saints and a misplaced primary", () => {
	const entry = withMetadata(metadata.optional);
	entry.celebrations[1] = JSON.parse(JSON.stringify(entry.celebrations[0]));
	entry.celebrations[0].isPrimary = false;
	entry.celebrations[0].saints.push({ ...entry.celebrations[0].saints[0] });
	const result = validateLiturgicalMetadata(entry);
	assert.equal(result.valid, false);
	assert.ok(result.errors.some((error) => error.includes("no puede repetir nombres")));
	assert.ok(result.errors.some((error) => error.includes("no puede repetir santos")));
	assert.ok(result.errors.some((error) => error.includes("primer lugar editorial")));
});

test("derives only a verified legacy celebration and never turns a date into a feast", () => {
	const legacy = { ...metadata.legacy };
	assert.equal(normalizeLiturgicalMetadata(legacy)[0].rank, "solemnity");
	assert.deepEqual(normalizeLiturgicalMetadata({ ...legacy, celebration: "1 de noviembre" }), []);
});

test("does not expose internal synchronization errors in the public entry", () => {
	const entry = withMetadata({
		...metadata.complete,
		source: {
			...completeReading.source,
			lastSyncError: "stack trace interno",
			lastSyncAttemptAt: "2026-09-15T12:00:00.000Z",
		},
	});
	const publicEntry = toPublicPublishedEntry(entry);
	assert.equal(publicEntry.source.lastSyncError, undefined);
	assert.equal(publicEntry.source.lastSyncAttemptAt, undefined);
	assert.equal(publicEntry.source.verified, true);
});
