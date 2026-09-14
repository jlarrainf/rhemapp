# Validación — Spec 007

Estado: Validación parcial — 2026-09-14

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | T4: `npm run test:auth`, `npm run lint`, verificación manual del header en `/daily` | PASS (T4) | El logo conduce al inicio; escritorio muestra Versículos aleatorios, Lectura del día y Misterios del Rosario; las opciones secundarias quedan bajo Perfil y más. La paridad móvil completa de RF-1 aún no está cerrada. |
| RF-2 | T4: verificación manual del menú y `npm run build` | PASS (T4) | La navegación mantiene la jerarquía aprobada y el menú ofrece cierre con Escape, clic fuera y foco visible. La matriz PWA completa aún está pendiente. |
| RF-3 | Pendiente | Pendiente | |
| RF-4 | Pendiente | Pendiente | |
| RF-5 | Pendiente | Pendiente | |
| RF-6 | Pendiente | Pendiente | |
| RF-7 | Pendiente | Pendiente | |
| RF-8 | Pendiente | Pendiente | |
| RF-9 | Pendiente | Pendiente | |

## Veredicto

`SPEC NO CUMPLIDA` — T4 está implementada y validada dentro de su alcance; T1–T3, T5–T14 y la validación completa de RF-1/RF-2 siguen pendientes.

## Evidencia reproducible de T4

- `npm run test:auth` → 55 pruebas aprobadas.
- `npm run lint` → sin advertencias ni errores.
- `npm run build` → compilación de producción aprobada.
- `git diff --check` → sin errores de whitespace.
- Verificación manual: abrir `http://127.0.0.1:3001/daily`, comprobar las tres rutas principales, abrir `Perfil`, revisar `Mi biblioteca`, `Sugerencias`, `Mi perfil`, tema y sesión; pulsar Escape y confirmar que el foco vuelve al botón `Perfil`.
- La verificación responsive móvil completa queda pendiente de la matriz de T13; la jerarquía equivalente del menú móvil está implementada en `Navbar.jsx`.
