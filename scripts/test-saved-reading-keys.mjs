import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
	createCanonicalKey,
	createSavedReadingIdentity,
	SavedReadingKeyError,
} from "../src/lib/savedReadings/canonicalKeys.js";

const fixturesDirectory = path.join(process.cwd(), "specs", "003-saved-readings-groups", "fixtures");

function loadFixture(fileName) {
	return JSON.parse(fs.readFileSync(path.join(fixturesDirectory, fileName), "utf8"));
}

test("generic and legacy liturgical Gospel representations share one key", () => {
	assert.equal(
		createCanonicalKey(loadFixture("daily-gospel-generic.json")),
		createCanonicalKey(loadFixture("daily-gospel-legacy.json")),
	);
});

test("random verse keys use the stable verse identifier instead of presentation text", () => {
	assert.equal(
		createCanonicalKey(loadFixture("random-verse-by-verse-id.json")),
		createCanonicalKey(loadFixture("random-verse-by-passage-id.json")),
	);

	const changedSnapshot = {
		...loadFixture("random-verse-by-verse-id.json"),
		verse: "Texto de presentación actualizado",
		reference: "Salmo 23:1",
	};
	assert.equal(
		createCanonicalKey(changedSnapshot),
		"random-verse:PSA.23.1",
	);
});

test("direct and structured Bible passage representations share one key", () => {
	assert.equal(
		createCanonicalKey(loadFixture("bible-passage-direct.json")),
		createCanonicalKey(loadFixture("bible-passage-structured.json")),
	);
});

test("structured ranges are ordered and duplicate ranges do not change identity", () => {
	const first = createCanonicalKey({
		contentType: "bible-passage",
		passageId: "MAT.18",
		ranges: [
			{ chapter: 18, start: 30, end: 35 },
			{ chapter: 18, start: 21, end: 25 },
			{ chapter: 18, start: 21, end: 25 },
		],
	});
	const second = createCanonicalKey({
		contentType: "bible-passage",
		passageId: "mat.18",
		ranges: [
			{ chapter: 18, start: 21, end: 25 },
			{ chapter: 18, start: 30, end: 35 },
		],
	});

	assert.equal(first, second);
});

test("identity exposes the normalized content type for database writes", () => {
	assert.deepEqual(
		createSavedReadingIdentity(loadFixture("random-verse-by-passage-id.json")),
		{ contentType: "random-verse", canonicalKey: "random-verse:PSA.23.1" },
	);
});

test("invalid or ambiguous content is rejected before persistence", () => {
	assert.throws(
		() => createCanonicalKey({ contentType: "random-verse", verseId: "PSA.23" }),
		(error) => error instanceof SavedReadingKeyError && error.status === 422,
	);
	assert.throws(
		() => createCanonicalKey({
			contentType: "bible-passage",
			passageId: "MAT.18.21-35",
			ranges: [{ chapter: 18, start: 22, end: 35 }],
		}),
		(error) => error instanceof SavedReadingKeyError && /no coinciden/.test(error.message),
	);
});
