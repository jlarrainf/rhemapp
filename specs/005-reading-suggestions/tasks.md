# Tareas — Spec 005

## Fase 0 — Política editorial

- [x] T1 — Confirmar qué se puede sugerir, responsables, estados y notificaciones.
  - RF: RF-1, RF-5, RF-6, RF-8
  - Hecho cuando: `clarifications.md` registra decisiones sin bloqueantes.
- [x] T2 — Definir máquina de estados y payload validado.
  - RF: RF-1, RF-2, RF-5
  - Hecho cuando: existen transiciones válidas e inválidas documentadas en `plan.md` y el esquema fija los estados permitidos.
- [x] T3 — Crear migraciones de sugerencias, eventos y versiones publicadas.
  - RF: RF-1, RF-6, RF-8
  - Hecho cuando: tablas, índices y rollback de migración pasan.

## Fase 1 — Envío y revisión

- [x] T4 — Implementar validación y creación de sugerencias.
  - RF: RF-1, RF-2, RF-9
  - Hecho cuando: datos inválidos, duplicados y payloads grandes son rechazados.
- [x] T5 — Implementar consulta aislada de sugerencias propias.
  - RF: RF-3
  - Hecho cuando: un usuario no puede consultar sugerencias de otro.
- [x] T6 — Implementar cola protegida por rol.
  - RF: RF-4, RF-7
  - Hecho cuando: solo editor/admin puede ver la cola.
- [x] T7 — Implementar revisión y eventos de auditoría.
  - RF: RF-5, RF-8
  - Hecho cuando: cada cambio requiere comentario y registra actor/fecha.

## Fase 2 — Publicación

- [x] T8 — Implementar publicación versionada y validación de contenido.
  - RF: RF-6, RF-8
  - Hecho cuando: solo una sugerencia aprobada puede publicar una nueva versión.
- [x] T9 — Implementar rollback de una versión publicada.
  - RF: RF-6, RF-8
  - Hecho cuando: una versión anterior puede restaurarse con auditoría.
- [x] T10 — Crear formularios y cola editorial accesibles.
  - RF: RF-1, RF-3, RF-4, RF-5
  - Hecho cuando: usuario y editor tienen estados claros en español.

## Fase final — Verificación

- [x] T11 — Probar abuso, concurrencia y permisos.
  - RF: RF-2, RF-7, RF-9
  - Hecho cuando: las pruebas cubren usuarios, roles y revisiones simultáneas.
- [x] T12 — Completar `validation.md`.
  - RF: RF-1 a RF-10
  - Hecho cuando: pasan tests, lint, build y se documenta cada RF.
