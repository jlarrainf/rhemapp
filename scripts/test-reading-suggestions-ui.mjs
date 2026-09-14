import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const form = await readFile(new URL("../src/components/SuggestionForm.jsx", import.meta.url), "utf8");
const userPage = await readFile(new URL("../src/app/sugerencias/page.js", import.meta.url), "utf8");
const userClient = await readFile(new URL("../src/app/sugerencias/SuggestionsClient.jsx", import.meta.url), "utf8");
const editorial = await readFile(new URL("../src/app/admin/sugerencias/EditorialSuggestionsClient.jsx", import.meta.url), "utf8");

test("el formulario de usuario tiene campos accesibles y estados en español", () => {
	assert.match(form, /aria-labelledby/);
	assert.match(form, /name="date"/);
	assert.match(form, /name="readingType"/);
	assert.match(form, /name="reference"/);
	assert.match(form, /name="sourceUrl"/);
	assert.match(form, /name="body"/);
	assert.match(form, /role="alert"/);
	assert.match(form, /role="status"/);
	assert.match(userPage, /Inicia sesión para enviar sugerencias/);
});

test("el usuario solo recibe sus estados y el editor tiene acciones separadas", () => {
	assert.match(userClient, /Mis sugerencias/);
	assert.match(userClient, /En revisión/);
	assert.match(userClient, /Necesita cambios/);
	assert.match(editorial, /Comentario editorial/);
	assert.match(editorial, /Aprobar/);
	assert.match(editorial, /Pedir cambios/);
	assert.match(editorial, /Rechazar/);
	assert.match(editorial, /Publicar versión validada/);
	assert.match(editorial, /Revertir última versión/);
});
