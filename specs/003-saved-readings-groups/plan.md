# Plan técnico — Spec 003

Estado: Planned — clarificaciones resueltas; pendiente implementación

## Alcance técnico

Agregar persistencia de contenido guardado y una relación muchos-a-muchos entre guardados y grupos, protegida por el usuario autenticado. El dominio debe aceptar la lectura genérica de Spec 001 y quedar preparado para otros tipos de contenido si se aprueban.

## Arquitectura y módulos

- `src/lib/savedReadings/`: claves canónicas, normalización e idempotencia.
- `src/lib/readingGroups/`: validación de nombres y membresías.
- `src/app/api/saved-readings/` y `src/app/api/reading-groups/`.
- Componentes de botón guardar, selector de grupos, lista y estados vacíos.
- Migraciones y políticas por usuario.

Las tablas de aplicación de Supabase estarán en un esquema expuesto solo con RLS habilitado. Las operaciones desde la web usarán la clave publishable y la sesión del usuario; nunca una service key en el cliente.

## Modelo de datos

```text
saved_items(id, user_id, content_type, canonical_key, title, reference,
  snapshot_json, created_at, updated_at)
reading_groups(id, user_id, name, normalized_name, is_default, created_at)
saved_item_groups(saved_item_id, group_id, created_at)
```

Restricciones sugeridas:

- `unique(user_id, content_type, canonical_key)` en `saved_items`.
- `unique(saved_item_id, group_id)` en la unión.
- `unique(user_id, normalized_name)` en grupos.
- El grupo `is_default` “Mis lecturas” no podrá eliminarse, podrá renombrarse y se conservará aunque no tenga membresías. Todo nuevo guardado tendrá inicialmente una membresía con ese grupo.
- Toda consulta filtra por `user_id` antes de resolver el recurso.
- Las políticas RLS aplican el mismo aislamiento y las mutaciones incluyen `USING` y `WITH CHECK`.

## Contratos

- `GET/POST /api/saved-readings`.
- `DELETE /api/saved-readings/:id`.
- `GET/POST /api/reading-groups`.
- `PATCH/DELETE /api/reading-groups/:id`.
- `POST/DELETE /api/saved-readings/:id/groups/:groupId`.
- Las mutaciones devuelven estado idempotente y errores `401`, `403`, `404` o `422` según corresponda.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Unión explícita muchos-a-muchos | Cumple múltiples grupos sin duplicar contenido | Guardar una lista de nombres dentro del registro |
| Clave canónica más snapshot | Permite detectar duplicados y conservar contexto | Guardar solo texto libre |
| Grupo por usuario | Evita nombres y relaciones globales no solicitadas | Grupos públicos desde el inicio |
| Restricciones en datos más validación API | Protege concurrencia y clientes futuros | Confiar solo en UI |

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| `saved_items` | RF-1, RF-2, RF-8 |
| Grupos y unión | RF-3, RF-4, RF-5, RF-6 |
| Políticas y autorización | RF-7 |
| Componentes y estados | RF-1 a RF-6 |

## Estrategia de tests

- Unitarios para canonical keys, normalización y validación de nombres.
- Integración para duplicados, membresías múltiples y borrado de grupo.
- Tests de aislamiento entre usuario A y usuario B.
- Test concurrente o repetido para idempotencia.
- Verificación manual desde móvil y desktop.

## Riesgos, migración y rollback

- Riesgo: snapshot desactualizado. Mitigación: mostrar referencia y estado de disponibilidad, no afirmar que es una versión vigente si no lo es.
- Riesgo: duplicados por carreras. Mitigación: índices únicos y upsert/transacción.
- Rollback: desactivar botones y conservar tablas sin eliminar datos hasta revisar la migración.
