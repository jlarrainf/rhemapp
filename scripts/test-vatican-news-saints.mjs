import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
	buildSupplementalSaints,
	getVaticanNewsDailyUrl,
	haveSameSaintNames,
	parseVaticanNewsSaintNames,
} from "../src/lib/readings/vaticanNewsSaints.js";

const fixturePath = path.join(process.cwd(), "specs", "009-liturgical-calendar", "fixtures", "vatican-news-santos.html");
const fixture = fs.readFileSync(fixturePath, "utf8");

test("extracts only ordered names from the dated Vatican News saint sections", () => {
	assert.deepEqual(parseVaticanNewsSaintNames(fixture, "2026-09-16"), [
		"Eufemia",
		"Víctor III",
		"Cornelio",
		"Cipriano",
	]);
});

test("builds verified provenance without copying descriptive content", () => {
	const saints = buildSupplementalSaints("2026-09-16", ["Eufemia", "Cipriano"], "2026-09-16T05:15:00.000Z");

	assert.deepEqual(saints, [
		{
			name: "Eufemia",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-16",
				fetchedAt: "2026-09-16T05:15:00.000Z",
			},
		},
		{
			name: "Cipriano",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-16",
				fetchedAt: "2026-09-16T05:15:00.000Z",
			},
		},
	]);
});

test("uses the date-specific representation of the public saint calendar", () => {
	assert.equal(getVaticanNewsDailyUrl("2026-09-16"), "https://www.vaticannews.va/es/santos/09/16.html");
});

test("rejects a source date that does not match the requested Chilean date", () => {
	const wrongDate = fixture.replace("16 septiembre", "15 septiembre");
	assert.throws(() => parseVaticanNewsSaintNames(wrongDate, "2026-09-16"), /date mismatch/);
});

test("rejects missing sections and ambiguous descriptors instead of publishing guesses", () => {
	assert.throws(() => parseVaticanNewsSaintNames(fixture.replaceAll("section--isStatic", "section--unknown"), "2026-09-16"), /sections were not found/);
	const ambiguous = fixture.replace("mártir de Calcedonia", "protectora de Calcedonia");
	assert.throws(() => parseVaticanNewsSaintNames(ambiguous, "2026-09-16"), /Ambiguous/);
});

test("rejects duplicate names and recognizes an unchanged capture", () => {
	const duplicate = fixture.replace("b. Víctor III, papa", "s. Eufemia, mártir");
	assert.throws(() => parseVaticanNewsSaintNames(duplicate, "2026-09-16"), /duplicate saint names/);
	const capture = buildSupplementalSaints("2026-09-16", ["Eufemia", "Cipriano"], "2026-09-16T05:15:00.000Z");
	assert.equal(haveSameSaintNames(capture, buildSupplementalSaints("2026-09-16", ["Eufemia", "Cipriano"], "2026-09-16T06:15:00.000Z")), true);
});
