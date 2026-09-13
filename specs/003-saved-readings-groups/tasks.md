# Tareas — Spec 003

## Fase 0 — Decisiones y persistencia

- [ ] T1 — Confirmar tipos guardables, snapshot y grupo predeterminado.
  - RF: RF-1, RF-8
  - Hecho cuando: `clarifications.md` no tiene decisiones bloqueantes.
- [ ] T2 — Definir canonical keys y fixtures de contenido guardable.
  - RF: RF-1, RF-2
  - Hecho cuando: dos representaciones de la misma lectura producen la misma clave.
- [ ] T3 — Crear migraciones de guardados, grupos y tabla de unión.
  - RF: RF-1, RF-3, RF-4
  - Hecho cuando: las restricciones únicas y las relaciones están verificadas.
- [ ] T4 — Crear políticas de acceso por usuario.
  - RF: RF-7
  - Hecho cuando: usuarios distintos no pueden leer ni mutar datos ajenos.

## Fase 1 — API

- [ ] T5 — Implementar creación/listado idempotente de guardados.
  - RF: RF-1, RF-2
  - Hecho cuando: repetir la misma petición devuelve un solo guardado.
- [ ] T6 — Implementar CRUD de grupos.
  - RF: RF-3, RF-6
  - Hecho cuando: nombres inválidos y grupos ajenos son rechazados.
- [ ] T7 — Implementar agregar/quitar membresías.
  - RF: RF-4, RF-5
  - Hecho cuando: una lectura puede pertenecer a varios grupos sin duplicar un vínculo.

## Fase 2 — UI

- [ ] T8 — Crear botón de guardar y estado guardado/no guardado.
  - RF: RF-1, RF-2
  - Hecho cuando: el estado se actualiza sin doble guardado.
- [ ] T9 — Crear selector y formulario de grupos.
  - RF: RF-3, RF-4, RF-5
  - Hecho cuando: se pueden seleccionar varios grupos y crear uno nuevo.
- [ ] T10 — Crear vista de biblioteca y estados vacíos/error.
  - RF: RF-1, RF-6, RF-8
  - Hecho cuando: el usuario puede revisar sus guardados y entiende lecturas no disponibles.

## Fase final — Verificación

- [ ] T11 — Ejecutar pruebas de aislamiento, unicidad e idempotencia.
  - RF: RF-1, RF-2, RF-4, RF-7
  - Hecho cuando: pasan las pruebas con dos usuarios y solicitudes repetidas.
- [ ] T12 — Completar `validation.md` con evidencia.
  - RF: RF-1 a RF-8
  - Hecho cuando: pasan lint, build y no queda RF sin evidencia.
