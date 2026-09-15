import assert from "node:assert/strict";
import test from "node:test";
import { getSaintInformationSource } from "../src/lib/readings/secondarySources.js";

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
