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
	assert.match(dailyClient, /Más información sobre \{saint\.name\} en/);
	assert.match(dailyClient, /target="_blank"/);
	assert.match(dailyClient, /rel="noopener noreferrer"/);
	assert.match(dailyClient, /focus-visible:ring-2/);
});

test("renders the Vatican News daily name capture as names only", () => {
	assert.match(dailyClient, /supplementalSaints/);
	assert.match(dailyClient, /También mencionados por Vatican News/);
	assert.match(dailyClient, /supplementalSaints\.map/);
	const supplementalStart = dailyClient.indexOf("{supplementalSaints.length > 0");
	const supplementalRender = dailyClient.slice(supplementalStart, supplementalStart + 700);
	assert.match(supplementalRender, /\{saint\.name\}/);
	assert.doesNotMatch(supplementalRender, /informationSource|description|excerpt|biograf/i);
});
