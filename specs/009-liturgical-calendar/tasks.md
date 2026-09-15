# Tareas — Spec 009

## Fase 0 — Preparación editorial y contrato

- [ ] T1 — Confirmar el esquema de celebraciones, rangos, santos, colores, fuentes y compatibilidad legacy.
  - RF: RF-2, RF-3, RF-7, RF-8, RF-9
  - Hecho cuando: el esquema, la enumeración de rangos, la jerarquía de fuentes y la regla de publicación ante metadata incompleta están documentados y revisados.

- [ ] T2 — Preparar fixtures reales y casos inválidos de calendario.
  - RF: RF-2, RF-3, RF-7, RF-8
  - Hecho cuando: existen fixtures para celebración principal, opcional, santo, conflicto, fuente caída, metadata incompleta y entrada legacy.

## Fase 1 — Dominio y datos

- [ ] T3 — Implementar la normalización y validación de metadata litúrgica.
  - RF: RF-2, RF-3, RF-7, RF-8, RF-9
  - Hecho cuando: el validator rechaza campos no verificados, duplicados, rangos inválidos y fuentes ausentes, y acepta metadata opcional ausente sin ocultar lecturas válidas.

- [ ] T4 — Ampliar el sincronizador y la conservación segura de versiones.
  - RF: RF-7, RF-8
  - Hecho cuando: una sincronización válida incorpora metadata, una respuesta parcial conserva la versión previa y cada intento deja estado, fuente y timestamp.

- [ ] T5 — Centralizar el resumen mensual y el contrato de fecha.
  - RF: RF-1, RF-4, RF-5, RF-6, RF-10, RF-12
  - Hecho cuando: una única función produce resúmenes ISO mensuales y sus pruebas cubren zona horaria, medianoche y corte dominical.

## Fase 2 — API y experiencia pública

- [ ] T6 — Enriquecer `/api/readings` y crear `/api/calendar`.
  - RF: RF-1, RF-4, RF-5, RF-7, RF-8, RF-12
  - Hecho cuando: ambos contratos validan entradas, devuelven errores españoles accionables y no exponen campos internos ni metadata no publicada.

- [ ] T7 — Integrar celebración y santos en Daily.
  - RF: RF-1, RF-2, RF-3, RF-9, RF-10, RF-11
  - Hecho cuando: Daily muestra información compacta, distingue opciones, conserva la Lectura del día y mantiene sus estados de error y atribución.

- [ ] T8 — Crear la vista mensual accesible del calendario.
  - RF: RF-4, RF-5, RF-6, RF-11, RF-12
  - Hecho cuando: la vista navega meses, muestra resúmenes, permite teclado y enlaza cada día disponible a `/daily?date=YYYY-MM-DD`.

## Fase 3 — Integración móvil y operación

- [ ] T9 — Consumir el contrato desde PWA/Android y revisar deep links.
  - RF: RF-5, RF-12
  - Hecho cuando: los clientes comparten la resolución de fecha, abren Daily con fecha explícita y no duplican reglas del calendario.

- [ ] T10 — Documentar fuentes, licencia, sincronización, estados stale y rollback.
  - RF: RF-7, RF-8, RF-11
  - Hecho cuando: la documentación operativa contiene proveedor, atribución, frecuencia de actualización, conservación de última versión y procedimiento de desactivación.

## Fase final — Verificación

- [ ] T11 — Ejecutar pruebas, lint, build y verificación manual.
  - RF: RF-1 a RF-12
  - Hecho cuando: pasan `npm run validate:daily`, la suite específica, `npm run lint`, `npm run build`, la matriz responsive/accesible y cada RF tiene evidencia en `validation.md`.
