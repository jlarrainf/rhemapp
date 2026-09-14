import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const shareButton = await readFile(new URL("../src/components/ShareReadingButton.jsx", import.meta.url), "utf8");
const sharedView = await readFile(new URL("../src/components/SharedReadingView.jsx", import.meta.url), "utf8");
const dailyClient = await readFile(new URL("../src/app/daily/DailyVerseClient.jsx", import.meta.url), "utf8");
const randomClient = await readFile(new URL("../src/app/random/RandomVerseClient.jsx", import.meta.url), "utf8");
const libraryClient = await readFile(new URL("../src/app/biblioteca/LibraryClient.jsx", import.meta.url), "utf8");

test("share UI offers Web Share and clipboard fallback with Spanish status", () => {
	assert.match(shareButton, /navigator\.share/);
	assert.match(shareButton, /navigator\.clipboard/);
	assert.match(shareButton, /Compartido correctamente/);
	assert.match(shareButton, /Enlace copiado al portapapeles/);
	assert.match(shareButton, /No se pudo copiar automáticamente/);
	assert.match(shareButton, /aria-label="Enlace para compartir"/);
});

test("public and private controls are wired to the reading surfaces", () => {
	assert.match(dailyClient, /shareContent/);
	assert.match(randomClient, /shareContent/);
	assert.match(libraryClient, /privateResource/);
	assert.match(shareButton, /\/api\/shares/);
	assert.match(shareButton, /Revocar enlace/);
});

test("shared page renders attribution and a safe unavailable state without client JavaScript", () => {
	assert.match(sharedView, /Fuente:/);
	assert.match(sharedView, /Este enlace ya no está disponible/);
	assert.match(sharedView, /No se muestran detalles privados/);
	assert.match(sharedView, /target="_blank"/);
});
