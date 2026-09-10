import fs from "node:fs";
import path from "node:path";

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
const entries = Array.isArray(data.entries) ? data.entries : [];
const byDate = new Map();
const errors = [];

for (const entry of entries) {
	if (byDate.has(entry.date)) errors.push(`Fecha duplicada: ${entry.date}`);
	byDate.set(entry.date, entry);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) errors.push(`Fecha inválida: ${entry.date}`);
	if (entry.calendar !== "chile") errors.push(`${entry.date}: el calendario debe ser chile`);
	if (String(entry.liturgicalYear) !== year) errors.push(`${entry.date}: año litúrgico incorrecto`);
	if (!entry.gospel?.reference) errors.push(`${entry.date}: falta gospel.reference`);
	if (!entry.gospel?.passageId) errors.push(`${entry.date}: falta gospel.passageId`);
	if (!entry.gospel?.excerpt) errors.push(`${entry.date}: falta gospel.excerpt`);
	if (!entry.gospel?.excerptReference) errors.push(`${entry.date}: falta gospel.excerptReference`);
	if (!Array.isArray(entry.gospel?.ranges) || entry.gospel.ranges.length === 0) errors.push(`${entry.date}: faltan rangos estructurados`);
	if (!entry.source?.url || !entry.source?.ordoUrl) errors.push(`${entry.date}: falta la trazabilidad de la fuente`);
	if (!entry.source?.verified) errors.push(`${entry.date}: la cita no está marcada como verificada`);
	if (expectedReferences[entry.date] && entry.gospel.reference !== expectedReferences[entry.date]) {
		errors.push(`${entry.date}: se esperaba ${expectedReferences[entry.date]} y se encontró ${entry.gospel.reference}`);
	}
	if (expectedReferences[entry.date] && entry.date !== "2026-09-10" && entry.date !== "2026-09-13" && entry.source?.ordoValidated !== true) {
		errors.push(`${entry.date}: la selección debe estar validada contra el Ordo chileno`);
	}
	if (/[…]|\.\.\./.test(entry.gospel.excerpt)) errors.push(`${entry.date}: la frase parece truncada`);
}

for (let cursor = new Date(`${start}T12:00:00Z`); cursor <= new Date(`${end}T12:00:00Z`); cursor.setUTCDate(cursor.getUTCDate() + 1)) {
	const date = cursor.toISOString().slice(0, 10);
	if (!byDate.has(date)) errors.push(`Falta lectura para ${date}`);
}

if (errors.length) {
	console.error(errors.join("\n"));
	process.exit(1);
}

console.log(`OK: ${entries.length} entradas válidas en ${filePath}`);
