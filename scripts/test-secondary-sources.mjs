import assert from "node:assert/strict";
import test from "node:test";
import { applySupplementalSaintsOverride, getSaintInformationSource, getSupplementalSaints, preserveLiturgicalMetadata, preserveSupplementalSaints } from "../src/lib/readings/secondarySources.js";

test("returns the reviewed Vatican News source for an exact saint/date match", () => {
	assert.deepEqual(getSaintInformationSource("2026-09-26", "Santos Cosme y Damián"), {
		provider: "Vatican News",
		url: "https://www.vaticannews.va/es/santos/09/26/ss--cosme-y-damian--martires.html",
		verified: true,
		attribution: "Vatican News",
	});
});

test("does not infer a secondary URL for an unknown date or name", () => {
	assert.equal(getSaintInformationSource("2026-10-12", "Nuestra Señora del Pilar"), null);
	assert.equal(getSaintInformationSource("2026-09-26", "Santos Cosme"), null);
});

test("returns a copy so editorial source metadata cannot be mutated globally", () => {
	const source = getSaintInformationSource("2026-10-15", "Santa Teresa de Jesús");
	source.attribution = "valor local";
	assert.equal(getSaintInformationSource("2026-10-15", "Santa Teresa de Jesús").attribution, "Vatican News");
});

test("returns the reviewed Vatican News names in page order for an exact date", () => {
	assert.deepEqual(getSupplementalSaints("2026-09-15"), [
		{
			name: "Santísima Virgen de los Dolores",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-15",
			},
		},
		{
			name: "Nicomedes",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-15",
			},
		},
		{
			name: "Catalina de Génova",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				attribution: "Vatican News",
				reviewedForDate: "2026-09-15",
			},
		},
	]);
});

test("does not infer a Vatican News name capture for an unreviewed date", () => {
	assert.deepEqual(getSupplementalSaints("2026-10-12"), []);
});

test("returns independent name capture objects", () => {
	const saints = getSupplementalSaints("2026-09-15");
	saints[0].name = "valor local";
	saints[0].source.attribution = "valor local";
	const freshSaints = getSupplementalSaints("2026-09-15");
	assert.equal(freshSaints[0].name, "Santísima Virgen de los Dolores");
	assert.equal(freshSaints[0].source.attribution, "Vatican News");
});

test("preserves a daily capture when the legacy override has no entry for the date", () => {
	const entry = {
		date: "2026-09-16",
		supplementalSaints: [{
			name: "Eufemia",
			source: {
				provider: "Vatican News",
				url: "https://www.vaticannews.va/es/santos.html",
				verified: true,
				reviewedForDate: "2026-09-16",
			},
		}],
	};
	const nextEntry = { date: "2026-09-16", readings: [{ type: "gospel" }] };
	const result = preserveSupplementalSaints(entry, nextEntry);

	assert.deepEqual(result.supplementalSaints, entry.supplementalSaints);
	assert.notStrictEqual(result.supplementalSaints, entry.supplementalSaints);
	assert.deepEqual(applySupplementalSaintsOverride(result, "2026-09-16"), result);
});

test("preserves the verified liturgical context when a reading refresh omits optional metadata", () => {
	const entry = {
		date: "2026-09-26",
		liturgicalSeason: "ordinary",
		liturgicalColor: "red",
		celebrations: [{
			name: "Santos Cosme y Damián, mártires",
			rank: "memorial",
			isPrimary: true,
			saints: [{
				name: "Santos Cosme y Damián",
				source: { provider: "Ordo", url: "https://example.com/ordo", verified: true },
			}],
			source: { provider: "Ordo", url: "https://example.com/ordo", verified: true },
		}],
	};
	const nextEntry = { date: "2026-09-26", readings: [{ type: "gospel" }] };
	const result = preserveLiturgicalMetadata(entry, nextEntry);

	assert.deepEqual(result.celebrations, entry.celebrations);
	assert.deepEqual(result.liturgicalSeason, entry.liturgicalSeason);
	assert.deepEqual(result.liturgicalColor, entry.liturgicalColor);
	assert.notStrictEqual(result.celebrations, entry.celebrations);
});
