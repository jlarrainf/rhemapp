import fs from "node:fs";
import path from "node:path";
import { validateDailyDataset } from "../src/lib/readings/validateDailyDataset.js";
import {
	VATICAN_NEWS_PROVIDER,
	buildSupplementalSaints,
	getChileDateKey,
	getVaticanNewsDailyUrl,
	haveSameSaintNames,
	parseVaticanNewsSaintNames,
} from "../src/lib/readings/vaticanNewsSaints.js";

const ROOT = process.cwd();
const DAILY_DIR = path.join(ROOT, "public", "data", "daily-readings");
const MAX_RESPONSE_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 30_000;

function parseArgs(argv) {
	const args = {};
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (!argument.startsWith("--")) continue;
		const [key, inlineValue] = argument.slice(2).split("=", 2);
		if (inlineValue !== undefined) {
			args[key] = inlineValue;
			continue;
		}
		const nextArgument = argv[index + 1];
		if (nextArgument && !nextArgument.startsWith("--")) {
			args[key] = nextArgument;
			index += 1;
		} else {
			args[key] = true;
		}
	}
	return args;
}

function replaceJsonAtomically(filePath, content) {
	const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
	fs.writeFileSync(temporaryPath, content, "utf8");

	try {
		if (process.platform !== "win32" || !fs.existsSync(filePath)) {
			fs.renameSync(temporaryPath, filePath);
			return;
		}

		const backupPath = `${filePath}.bak-${process.pid}-${Date.now()}`;
		fs.renameSync(filePath, backupPath);
		try {
			fs.renameSync(temporaryPath, filePath);
			fs.rmSync(backupPath, { force: true });
		} catch (error) {
			if (!fs.existsSync(filePath) && fs.existsSync(backupPath)) fs.renameSync(backupPath, filePath);
			throw error;
		}
	} catch (error) {
		if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
		throw error;
	}
}

async function fetchVaticanNewsPage(dateKey) {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(getVaticanNewsDailyUrl(dateKey), {
			headers: {
				accept: "text/html,application/xhtml+xml",
				"user-agent": "Rhemapp daily saints sync; contact via repository",
			},
			signal: controller.signal,
		});
		if (!response.ok) throw new Error(`Vatican News returned HTTP ${response.status}`);
		if (response.url && new URL(response.url).origin !== "https://www.vaticannews.va") {
			throw new Error("Vatican News redirected to an unexpected origin");
		}

		const contentLength = Number(response.headers.get("content-length") || 0);
		if (contentLength > MAX_RESPONSE_BYTES) throw new Error("Vatican News response is too large");
		const bytes = await response.arrayBuffer();
		if (bytes.byteLength > MAX_RESPONSE_BYTES) throw new Error("Vatican News response is too large");
		return new TextDecoder().decode(bytes);
	} finally {
		clearTimeout(timeout);
	}
}

function readDataset(dateKey) {
	const year = dateKey.slice(0, 4);
	const filePath = path.join(DAILY_DIR, `${year}.json`);
	if (!fs.existsSync(filePath)) throw new Error(`No existe el calendario publicado para ${year}`);
	return { filePath, year, data: JSON.parse(fs.readFileSync(filePath, "utf8")) };
}

function updateEntry(data, dateKey, supplementalSaints) {
	const entryIndex = data.entries?.findIndex((entry) => entry.date === dateKey) ?? -1;
	if (entryIndex < 0) throw new Error(`No existe una entrada publicada para ${dateKey}`);

	const previousEntry = data.entries[entryIndex];
	const nextEntry = haveSameSaintNames(previousEntry.supplementalSaints, supplementalSaints)
		&& previousEntry.supplementalSaints.every((saint) => saint?.source?.reviewedForDate === dateKey)
		? previousEntry
		: { ...previousEntry, supplementalSaints };
	const entries = [...data.entries];
	entries[entryIndex] = nextEntry;
	return { ...data, entries };
}

async function main() {
	const args = parseArgs(process.argv.slice(2));
	const dateKey = args.date || getChileDateKey();
	const dryRun = Boolean(args["dry-run"]);
	const { filePath, year, data } = readDataset(dateKey);
	const fetchedAt = new Date().toISOString();
	const html = await fetchVaticanNewsPage(dateKey);
	const names = parseVaticanNewsSaintNames(html, dateKey);
	const supplementalSaints = buildSupplementalSaints(dateKey, names, fetchedAt);
	const candidate = updateEntry(data, dateKey, supplementalSaints);
	const validation = validateDailyDataset(candidate, { year });
	if (!validation.valid) {
		throw new Error(`La captura no pasó la validación: ${validation.errors.join(" | ")}`);
	}

	const previousDocument = JSON.stringify(data);
	const nextDocument = `${JSON.stringify(candidate, null, 2)}\n`;
	const changed = previousDocument !== JSON.stringify(candidate);
	console.log(`${dateKey}: ${names.join(", ")} (${VATICAN_NEWS_PROVIDER})`);

	if (dryRun) {
		console.log(changed ? `Simulación: se actualizaría ${filePath}` : "Simulación: sin cambios; la captura ya está actualizada");
		return;
	}
	if (!changed) {
		console.log("Sin cambios: la captura diaria ya está publicada");
		return;
	}

	replaceJsonAtomically(filePath, nextDocument);
	console.log(`Captura guardada atómicamente en ${filePath}`);
}

try {
	await main();
} catch (error) {
	console.error(`La sincronización diaria de santos falló: ${error?.message || "error desconocido"}`);
	process.exitCode = 1;
}
