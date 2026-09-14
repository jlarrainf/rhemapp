# Plan técnico — Spec 005

Estado: Implemented — clarificaciones resueltas; validación local documentada

## Alcance técnico

Crear un flujo de moderación con estados y auditoría. La cola de sugerencias no debe escribir directamente en los JSON ni en la fuente publicada; un servicio editorial validado debe producir el cambio final.

## Arquitectura y módulos

- `src/lib/suggestions/`: validación, deduplicación y transición de estados.
- `src/lib/editorial/`: publicación, versionado y rollback.
- `src/app/api/suggestions/`: envío y consulta propia.
- `src/app/api/editorial/`: cola y acciones protegidas.
- `src/app/admin/suggestions/`: interfaz para editor/admin.
- Tablas `reading_suggestions`, `suggestion_events`, `published_reading_versions` y `audit_logs`.

Estas tablas usarán Supabase PostgreSQL con RLS. La cola editorial se protegerá por rol trusted en datos de aplicación, no por `user_metadata` editable, y las acciones de publicación se ejecutarán server-side.

Las sugerencias podrán representar nuevas lecturas o correcciones de datos existentes, pero nunca escribirán directamente el calendario. Inicialmente solo la cuenta propietaria tendrá rol editorial; no habrá notificaciones de estado en el MVP. Las sugerencias rechazadas/eliminadas conservarán auditoría anonimizada durante 12 meses y después se purgarán.

## Modelo de datos

```text
reading_suggestions(id, author_user_id, date, reading_type, reference,
  source_url, body, status, created_at, updated_at)
suggestion_events(id, suggestion_id, actor_user_id, from_status, to_status,
  comment, created_at)
published_reading_versions(id, reading_key, payload_json, published_by,
  source_suggestion_id, created_at, superseded_at)
```

Las transiciones permitidas deben estar en una máquina de estados server-side. La versión publicada debe ser inmutable y reemplazable mediante una nueva versión.

## Contratos

- `POST /api/suggestions` para usuarios autenticados.
- `GET /api/suggestions` devuelve solo las propias.
- `GET /api/editorial/suggestions` requiere editor/admin.
- `POST /api/editorial/suggestions/:id/review` cambia estado con comentario.
- `POST /api/editorial/suggestions/:id/publish` requiere aprobación y recibe una entrada litúrgica genérica completa (`payload`) validada contra Spec 001. Si el editor no envía `payload`, el servicio puede derivar una corrección segura desde la entrada vigente solo para una fecha/tipo ya existente.
- `POST /api/editorial/versions/:id/rollback` crea una nueva versión inmutable a partir de la versión anterior y registra la reversión.

La clave de publicación es `chile:YYYY-MM-DD` y `payload_json` contiene la entrada diaria completa, no solo la lectura modificada. La versión activa es la fila con `superseded_at IS NULL`; el JSON local sigue siendo el respaldo cuando no existe una versión editorial activa.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Máquina de estados explícita | Evita saltos inválidos y hace auditable el flujo | Campo de estado modificado libremente |
| Versiones publicadas inmutables | Permite rollback y trazabilidad | Sobrescribir la lectura actual |
| Sin uploads en MVP | Reduce superficie de seguridad y moderación | Recibir documentos desde el comienzo |
| Rate limit server-side | Reduce spam sin confiar en UI | Ocultar el formulario a usuarios nuevos |

### Máquina de estados

Las transiciones válidas son:

- `pending` → `in_review`, `approved`, `rejected`, `needs_changes`.
- `in_review` → `approved`, `rejected`, `needs_changes`.
- `needs_changes` → `in_review`.
- `approved` → `published` únicamente mediante publicación validada.
- `rejected` y `published` son estados finales.

Toda transición editorial exige comentario, usa una comparación optimista del estado actual y registra un evento. El autor no puede revisar ni aprobar su propia sugerencia.

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| Validación y creación | RF-1, RF-2, RF-9 |
| Consulta propia | RF-3 |
| Cola y roles | RF-4, RF-7 |
| Estados y eventos | RF-5, RF-8 |
| Publicación versionada | RF-6, RF-8 |

## Estrategia de tests

- Unitarios para validación y transiciones permitidas.
- Integración para aislamiento de usuario y roles.
- Tests de doble revisión/publicación concurrente.
- Tests de rollback y fuente incompleta.
- Verificación manual de la cola con editor y usuario normal.

## Riesgos, migración y rollback

- Riesgo: publicar texto no verificado. Mitigación: bloqueo por fuente/verificación y aprobación explícita.
- Riesgo: dos editores publican versiones distintas. Mitigación: control de versión y transacción.
- Rollback: seleccionar una versión anterior, registrar la operación y volver a ejecutar validación.
