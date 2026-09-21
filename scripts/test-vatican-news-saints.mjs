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
const fixtureSeptember20 = fs.readFileSync(path.join(process.cwd(), "specs", "009-liturgical-calendar", "fixtures", "vatican-news-santos-2026-09-20.html"), "utf8");
const fixtureSeptember21 = fs.readFileSync(path.join(process.cwd(), "specs", "009-liturgical-calendar", "fixtures", "vatican-news-santos-2026-09-21.html"), "utf8");
const fixtureNovember1 = fs.readFileSync(path.join(process.cwd(), "specs", "009-liturgical-calendar", "fixtures", "vatican-news-santos-2026-11-01.html"), "utf8");
const fixtureNovember21 = fs.readFileSync(path.join(process.cwd(), "specs", "009-liturgical-calendar", "fixtures", "vatican-news-santos-2026-11-21.html"), "utf8");

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

test("parses the 2026-09-20 compound heading without inventing companions", () => {
	assert.deepEqual(parseVaticanNewsSaintNames(fixtureSeptember20, "2026-09-20"), [
		"Andrea Kim Taego˘n",
		"Pablo Chông Hasang y Compañeros",
		"Eustaquio",
	]);
});

test("parses descriptors introduced by the live 2026-09-21 page", () => {
	assert.deepEqual(parseVaticanNewsSaintNames(fixtureSeptember21, "2026-09-21"), [
		"Mateo",
		"Pánfilo",
		"Efigenia",
	]);
});

test("accepts zero-padded day labels from the source", () => {
	const paddedDate = fixtureSeptember21.replace("21 septiembre", "01 octubre");
	assert.deepEqual(parseVaticanNewsSaintNames(paddedDate, "2026-10-01"), [
		"Mateo",
		"Pánfilo",
		"Efigenia",
	]);
});

test("omits celebration-only headings instead of publishing them as saints", () => {
	assert.deepEqual(parseVaticanNewsSaintNames(fixtureNovember1, "2026-11-01"), []);
});

test("keeps named saints when a page also contains a liturgical presentation heading", () => {
	assert.deepEqual(parseVaticanNewsSaintNames(fixtureNovember21, "2026-11-21"), [
		"María de Jesús Buen Pastor",
	]);
});

test("allows an explicit parenthetical alias and rejects unbalanced parentheses", () => {
	assert.deepEqual(parseVaticanNewsSaintNames(fixtureSeptember21.replace("s. Mateo", "ss. Simone y Judas (Tadeo)"), "2026-09-21"), [
		"Simone y Judas (Tadeo)",
		"Pánfilo",
		"Efigenia",
	]);
	const unbalanced = fixtureSeptember21.replace("s. Mateo", "ss. Simone y Judas (Tadeo");
	assert.throws(() => parseVaticanNewsSaintNames(unbalanced, "2026-09-21"), /Ambiguous/);
});

test("rejects a source date that does not match the requested Chilean date", () => {
	const wrongDate = fixture.replace("16 septiembre", "15 septiembre");
	assert.throws(() => parseVaticanNewsSaintNames(wrongDate, "2026-09-16"), /date mismatch/);
});

test("rejects missing sections and ambiguous descriptors instead of publishing guesses", () => {
	assert.throws(() => parseVaticanNewsSaintNames(fixture.replaceAll("section--isStatic", "section--unknown"), "2026-09-16"), /sections were not found/);
	const ambiguous = fixture.replace("mártir de Calcedonia", "y protectora de Calcedonia");
	assert.throws(() => parseVaticanNewsSaintNames(ambiguous, "2026-09-16"), /Ambiguous/);
	const missingPrefix = fixture.replace("s. Eufemia", "Eufemia");
	assert.throws(() => parseVaticanNewsSaintNames(missingPrefix, "2026-09-16"), /heading/);
});

test("rejects duplicate names and recognizes an unchanged capture", () => {
	const duplicate = fixture.replace("b. Víctor III, papa", "s. Eufemia, mártir");
	assert.throws(() => parseVaticanNewsSaintNames(duplicate, "2026-09-16"), /duplicate saint names/);
	const capture = buildSupplementalSaints("2026-09-16", ["Eufemia", "Cipriano"], "2026-09-16T05:15:00.000Z");
	assert.equal(haveSameSaintNames(capture, buildSupplementalSaints("2026-09-16", ["Eufemia", "Cipriano"], "2026-09-16T06:15:00.000Z")), true);
});
