import fs from "node:fs";
import path from "node:path";
import { validateDailyDataset } from "../src/lib/readings/validateDailyDataset.js";

const args = Object.fromEntries(
	process.argv.slice(2).flatMap((argument, index, values) => {
		if (!argument.startsWith("--")) return [];
		return [[argument.slice(2), values[index + 1] || true]];
	})
);

const year = String(args.year || "2026");
const start = args.start || (year === "2026" ? "2026-09-10" : `${year}-01-01`);
const end = args.end || (year === "2026" ? "2026-12-31" : `${year}-12-31`);
const filePath = path.join(process.cwd(), "public", "data", "daily-readings", `${year}.json`);
const expectedReferences = {
	"2026-09-10": "Lucas 6:27-36",
	"2026-09-12": "Lucas 6:43-49",
	"2026-09-13": "Mateo 18:21-35",
	"2026-09-15": "Lucas 7:11-17",
	"2026-09-26": "Lucas 9:43-45",
	"2026-10-04": "Mateo 21:33-46",
	"2026-10-12": "Lucas 11:29-32",
	"2026-10-15": "Lucas 11:47-54",
	"2026-10-27": "Lucas 13:18-21",
	"2026-11-01": "Mateo 4:25-5:12",
	"2026-11-02": "Juan 11:17-27",
	"2026-11-24": "Lucas 21:5-9",
};

if (!fs.existsSync(filePath)) throw new Error(`No existe ${filePath}`);
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
const result = validateDailyDataset(data, { year, start, end, expectedReferences });

if (!result.valid) {
	console.error(result.errors.join("\n"));
	process.exit(1);
}

const genericEntryCount = data.entries.filter((entry) => Array.isArray(entry.readings)).length;
const legacyEntryCount = data.entries.length - genericEntryCount;
console.log(`OK: ${result.entryCount} entradas válidas en ${filePath} (${genericEntryCount} genéricas, ${legacyEntryCount} de compatibilidad legacy)`);
