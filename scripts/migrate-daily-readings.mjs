import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourcePath = path.join(root, "public", "data", "verses.json");
const targetDir = path.join(root, "public", "data", "daily-readings");
const targetPath = path.join(targetDir, "2025.json");

const source = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const legacyEntries = Array.isArray(source.dailyVerses) ? source.dailyVerses : [];

const entries = legacyEntries
	.filter((item) => item?.date && item?.reference && item?.verse)
	.map((item) => ({
		date: `2025-${item.date}`,
		calendar: "chile",
		liturgicalYear: "2025",
		celebration: "",
		gospel: {
			reference: item.reference,
			passageId: item.verseId,
			title: item.verse,
			excerpt: item.verse,
			excerptReference: item.reference,
		},
		source: {
			provider: "Rhemapp legacy 2025",
			url: "",
			verified: false,
		},
	}));

fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(
	targetPath,
	`${JSON.stringify({
		calendar: "chile",
		year: 2025,
		liturgicalYear: "2025",
		entries,
	}, null, 2)}\n`,
	"utf8"
);

console.log(`Migradas ${entries.length} lecturas históricas a ${targetPath}`);

