import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const loginForm = await readFile(new URL("../src/app/login/LoginForm.jsx", import.meta.url), "utf8");
const logoutRoute = await readFile(new URL("../src/app/api/auth/logout/route.js", import.meta.url), "utf8");
const authActions = await readFile(new URL("../src/components/AuthActions.jsx", import.meta.url), "utf8");
const navbar = await readFile(new URL("../src/components/Navbar.jsx", import.meta.url), "utf8");
const profileMenu = await readFile(new URL("../src/components/ProfileMenu.jsx", import.meta.url), "utf8");

test("login UI exposes accessible Spanish states and auth methods", () => {
	for (const text of [
		"Continuar con Google",
		"Correo electrónico",
		"Contraseña",
		"Iniciar sesión",
		"Crear una cuenta",
		"role=\"alert\"",
		"role=\"status\"",
	]) {
		assert.match(loginForm, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
	}
	assert.match(loginForm, /signInWithOAuth/);
	assert.match(loginForm, /\/api\/auth\/login/);
	assert.match(loginForm, /signUp/);
});

test("logout is a server-side POST and has a Spanish failure state", () => {
	assert.match(logoutRoute, /export async function POST/);
	assert.match(logoutRoute, /supabase\.auth\.signOut/);
	assert.match(logoutRoute, /No se pudo cerrar sesión/);
});

test("navigation offers login and logout without exposing raw auth errors", () => {
	assert.match(authActions, /\/api\/auth\/session/);
	assert.match(authActions, /Cerrar sesión/);
	assert.match(authActions, /Iniciar sesión/);
	assert.match(authActions, /AUTH_UI_MESSAGES\.logout/);
	assert.doesNotMatch(authActions, /error\.message/);
});

test("header prioritizes the three reading routes and groups secondary options", () => {
	for (const label of ["Versículos aleatorios", "Lectura del día", "Misterios del Rosario"]) {
		assert.match(navbar, new RegExp(label));
	}
	assert.match(navbar, /aria-label="Ir al inicio de Rhemapp"/);
	assert.doesNotMatch(navbar, /<NavLink href="\/"/);
	assert.doesNotMatch(navbar, /<MobileNavLink href="\/"/);
	for (const label of ["Mi biblioteca", "Sugerencias", "Mi perfil", "Perfil y más"]) {
		assert.match(navbar + profileMenu, new RegExp(label));
	}
	assert.match(profileMenu, /aria-expanded=\{isOpen\}/);
	assert.match(profileMenu, /event\.key === "Escape"/);
	assert.match(profileMenu, /document\.addEventListener\("pointerdown"/);
});
