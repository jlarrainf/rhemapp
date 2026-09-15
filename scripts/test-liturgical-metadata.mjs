import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { normalizeLiturgicalMetadata, normalizeSupplementalSaints, toPublicPublishedEntry, validateLiturgicalMetadata } from "../src/lib/readings/liturgicalMetadata.js";
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

test("preserves the dated Vatican News name capture and publishes no descriptive text", () => {
	const entry = withMetadata(metadata.complete);
	const supplementalSaints = normalizeSupplementalSaints(entry);
	assert.deepEqual(supplementalSaints.map((saint) => saint.name), ["Nicomedes", "Catalina de Génova"]);
	assert.equal(supplementalSaints[0].source.reviewedForDate, "2026-09-13");

	const publicEntry = toPublicPublishedEntry(entry);
	assert.deepEqual(publicEntry.supplementalSaints, [
		{
			name: "Nicomedes",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-13",
			},
		},
		{
			name: "Catalina de Génova",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-13",
			},
		},
	]);
	assert.equal("description" in publicEntry.supplementalSaints[0], false);
});

test("preserves the primary/optional editorial order and saint source", () => {
	const entry = withMetadata(metadata.optional);
	const celebrations = normalizeLiturgicalMetadata(entry);
	assert.equal(celebrations[0].isPrimary, true);
	assert.equal(celebrations[1].rank, "optional-memorial");
	assert.equal(celebrations[0].saints[0].source.verified, true);
	assert.equal(celebrations[0].saints[0].name, "Santa Teresa de Jesús");
	assert.equal(celebrations[0].saints[0].description, "Descripción editorial que no debe publicarse");
	assert.equal(celebrations[0].saints[0].informationSource.provider, "Vatican News");
	const publicEntry = toPublicPublishedEntry(entry);
	assert.equal(publicEntry.celebrations[0].saints[0].description, undefined);
	assert.equal(publicEntry.celebrations[0].saints[0].source.verified, true);
	assert.deepEqual(publicEntry.celebrations[0].saints[0].informationSource, {
		provider: "Vatican News",
		url: "https://www.vaticannews.va/es/santos/10/15/s--teresa-de-jesus--virgen--doctora-de-la-iglesia--carmelita-des.html",
		verified: true,
		attribution: "Vatican News",
	});
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

test("rejects a saint repeated across celebrations instead of silently deduplicating it", () => {
	const entry = withMetadata(metadata.optional);
	entry.celebrations[1].saints = [{
		name: "Santa Teresa de Jesús",
		source: { ...entry.celebrations[0].saints[0].source },
	}];
	const result = validateLiturgicalMetadata(entry);
	assert.equal(result.valid, false);
	assert.ok(result.errors.some((error) => error.includes("no puede repetir santos")));
});

test("rejects saints without a name or explicit verified source", () => {
	const missingName = withMetadata(metadata.optional);
	missingName.celebrations[0].saints[0].name = "";
	const missingNameResult = validateLiturgicalMetadata(missingName);
	assert.equal(missingNameResult.valid, false);
	assert.ok(missingNameResult.errors.some((error) => error.includes("saints[0].name")));

	const unverified = withMetadata(metadata.optional);
	unverified.celebrations[0].saints[0].source.verified = false;
	const unverifiedResult = validateLiturgicalMetadata(unverified);
	assert.equal(unverifiedResult.valid, false);
	assert.ok(unverifiedResult.errors.some((error) => error.includes("saints[0].source")));
});

test("rejects an invalid or unverified secondary information source", () => {
	const invalidUrl = withMetadata(metadata.optional);
	invalidUrl.celebrations[0].saints[0].informationSource.url = "javascript:alert(1)";
	const invalidUrlResult = validateLiturgicalMetadata(invalidUrl);
	assert.equal(invalidUrlResult.valid, false);
	assert.ok(invalidUrlResult.errors.some((error) => error.includes("saints[0].informationSource")));

	const unverified = withMetadata(metadata.optional);
	unverified.celebrations[0].saints[0].informationSource.verified = false;
	const unverifiedResult = validateLiturgicalMetadata(unverified);
	assert.equal(unverifiedResult.valid, false);
	assert.ok(unverifiedResult.errors.some((error) => error.includes("saints[0].informationSource")));

	const missingAttribution = withMetadata(metadata.optional);
	delete missingAttribution.celebrations[0].saints[0].informationSource.attribution;
	const missingAttributionResult = validateLiturgicalMetadata(missingAttribution);
	assert.equal(missingAttributionResult.valid, false);
	assert.ok(missingAttributionResult.errors.some((error) => error.includes("informationSource.attribution")));
});

test("rejects an invalid, misdated or duplicated Vatican News name capture", () => {
	const invalidDate = withMetadata(metadata.complete);
	invalidDate.supplementalSaints[0].source.reviewedForDate = "2026-09-14";
	const invalidDateResult = validateLiturgicalMetadata(invalidDate);
	assert.equal(invalidDateResult.valid, false);
	assert.ok(invalidDateResult.errors.some((error) => error.includes("reviewedForDate")));

	const duplicate = withMetadata(metadata.complete);
	duplicate.supplementalSaints.push({ ...duplicate.supplementalSaints[0] });
	const duplicateResult = validateLiturgicalMetadata(duplicate);
	assert.equal(duplicateResult.valid, false);
	assert.ok(duplicateResult.errors.some((error) => error.includes("supplementalSaints: no puede repetir nombres")));
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
