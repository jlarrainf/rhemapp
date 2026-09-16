import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
	ReadingUnavailableError,
	getDailyReading,
	getPublishedReading,
} from "../src/lib/dailyReading.js";
import { getPublishedReadingWithOverrides } from "../src/lib/editorial/publishedReadings.js";
import { formatSaintName } from "../src/lib/readings/saintNames.js";

const dailyClient = fs.readFileSync(
	path.join(process.cwd(), "src", "app", "daily", "DailyVerseClient.jsx"),
	"utf8",
);
const translationNotice = fs.readFileSync(
	path.join(process.cwd(), "src", "components", "BibleTranslationNotice.jsx"),
	"utf8",
);

test("publishes a generic entry for an explicit date", () => {
	const result = getPublishedReading({ dateKey: "2026-09-10", mode: "date" });

	assert.equal(result.dateKey, "2026-09-10");
	assert.equal(result.mode, "date");
	assert.deepEqual(
		result.readings.map((reading) => reading.type),
		["first-reading", "psalm", "gospel"],
	);
});

test("exposes the reviewed Vatican News names without descriptive fields", () => {
	const result = getPublishedReading({ dateKey: "2026-09-15", mode: "date" });
	assert.deepEqual(result.supplementalSaints.map((saint) => saint.name), [
		"Santísima Virgen de los Dolores",
		"Nicomedes",
		"Catalina de Génova",
	]);
	assert.equal(result.supplementalSaints[0].description, undefined);
});

test("resolves the published Sunday entry through the generic domain", () => {
	const result = getPublishedReading({
		mode: "sunday",
		now: new Date("2026-09-13T15:00:00Z"),
	});

	assert.equal(result.dateKey, "2026-09-13");
	assert.equal(result.mode, "sunday");
	assert.equal(result.readings.at(-1).type, "gospel");
});

test("rejects an empty explicit date before resolving today", () => {
	assert.throws(
		() => getPublishedReading({ dateKey: "", mode: "date" }),
		(error) => error.status === 400 && error.message.includes("vacía"),
	);
});

test("reports a missing calendar year as unavailable content", () => {
	assert.throws(
		() => getPublishedReading({ dateKey: "2027-01-01", mode: "date" }),
		(error) => error instanceof ReadingUnavailableError && error.status === 404,
	);
});

test("keeps a verified legacy entry readable while generic migration is pending", async () => {
	const result = await getPublishedReadingWithOverrides({ dateKey: "2026-10-02", mode: "date" });
	assert.equal(result.dateKey, "2026-10-02");
	assert.equal(result.mode, "date");
	assert.equal(result.gospel.reference, "Mateo 18:1-5,10");
});

test("keeps the compatible daily contract while exposing readings", () => {
	const result = getDailyReading({ date: new Date("2026-09-10T12:00:00Z") });

	assert.equal(result.dateKey, "2026-09-10");
	assert.equal(result.readings[0].type, "first-reading");
	assert.equal(result.gospel.reference, "Lucas 6:27-36");
});

test("does not render a reading title when it duplicates the excerpt", () => {
	assert.match(dailyClient, /const showDistinctTitle = Boolean\(title && title !== excerpt\)/);
	assert.match(dailyClient, /showDistinctTitle && \(/);
});

test("keeps translation attribution available without a prominent notice", () => {
	assert.match(translationNotice, /<details className=/);
	assert.match(translationNotice, /Fuente y traducción/);
	assert.match(translationNotice, /API\.Bible/);
	assert.match(translationNotice, /CC0/);
	assert.doesNotMatch(translationNotice, /rounded-lg border/);
});

test("renders verified secondary saint information as an attributed safe external link", () => {
	assert.match(dailyClient, /informationSource/);
	assert.match(dailyClient, /Más información sobre \{displayName\} en/);
	assert.ok(dailyClient.indexOf("informationSources.length > 0") > dailyClient.indexOf("Fuentes y verificación"));
	assert.match(dailyClient, /target="_blank"/);
	assert.match(dailyClient, /rel="noopener noreferrer"/);
	assert.match(dailyClient, /focus-visible:ring-2/);
});

test("keeps visible saint sections as simple names-only lists", () => {
	const saintsStart = dailyClient.indexOf("{saints.length > 0");
	const supplementalStart = dailyClient.indexOf("{supplementalSaints.length > 0");
	const sourcesStart = dailyClient.indexOf("Fuentes y verificación");
	const saintsRender = dailyClient.slice(saintsStart, supplementalStart);
	assert.match(saintsRender, /list-disc space-y-1 pl-5/);
	assert.doesNotMatch(saintsRender, /informationSources|Más información|border-t|flex flex-wrap/);

	const supplementalRender = dailyClient.slice(supplementalStart, sourcesStart);
	assert.ok(sourcesStart > supplementalStart);
	assert.match(supplementalRender, /list-disc space-y-1 pl-5/);
	assert.doesNotMatch(supplementalRender, /informationSource|description|excerpt|biograf|border-t|flex flex-wrap/i);
});

test("renders the Vatican News daily name capture as names only", () => {
	assert.match(dailyClient, /supplementalSaints/);
	assert.match(dailyClient, /Otros santos y santas del día/);
	assert.match(dailyClient, /supplementalSaints\.map/);
	const supplementalStart = dailyClient.indexOf("{supplementalSaints.length > 0");
	const supplementalRender = dailyClient.slice(supplementalStart, supplementalStart + 700);
	assert.match(supplementalRender, /formatSaintName\(saint\.name\)/);
	assert.doesNotMatch(supplementalRender, /informationSource|description|excerpt|biograf/i);
});

test("collapses the complete context and keeps provenance after the main content", () => {
	const contextStart = dailyClient.indexOf("Contexto litúrgico");
	const sourcesStart = dailyClient.indexOf("Fuentes y verificación");
	const contextRender = dailyClient.slice(contextStart, sourcesStart);

	assert.ok(contextStart >= 0);
	assert.ok(sourcesStart > contextStart);
	assert.match(dailyClient, /<details className="group">/);
	assert.match(contextRender, /Fiestas y santos del día/);
	assert.match(contextRender, /Otras fiestas y celebraciones/);
	assert.doesNotMatch(contextRender, /Vatican News|informationSource|Proveedor|Fuente/);
	assert.match(contextRender, /!hasContextData &&/);
});

test("does not report missing context when a supplemental source is available", () => {
	assert.match(dailyClient, /supplementalSaints\.length > 0/);
	assert.match(dailyClient, /\) : !hasContextData && \(/);
	assert.match(dailyClient, /El contexto litúrgico no está disponible en las fuentes consultadas/);
});

test("adds the appropriate saint treatment without rewriting protected titles", () => {
	assert.equal(formatSaintName("Eufemia"), "Santa Eufemia");
	assert.equal(formatSaintName("Víctor III"), "San Víctor III");
	assert.equal(formatSaintName("Nicomedes"), "San Nicomedes");
	assert.equal(formatSaintName("Catalina de Génova"), "Santa Catalina de Génova");
	assert.equal(formatSaintName("Santos Cosme y Damián"), "San Cosme y San Damián");
	assert.equal(formatSaintName("Nuestra Señora del Pilar"), "Nuestra Señora del Pilar");
	assert.equal(formatSaintName("Santa Teresa de Jesús"), "Santa Teresa de Jesús");
});
