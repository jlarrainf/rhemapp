# Especificaciones de Rhemapp

Esta carpeta contiene las especificaciones vivas del producto y su orden de implementación. El roadmap está en estado de planificación: no autoriza por sí solo a implementar funcionalidades.

## Método

Rhemapp usa un flujo spec-anchored:

```text
Constitución → Spec → Clarificación → Plan → Tareas → Implementación → Validación → Cambio
```

La intención del producto permanece junto al código. Cuando cambia el comportamiento, primero se actualiza la spec; luego se revisan clarificaciones, plan, tareas, código y tests. La implementación se hace una tarea a la vez, con revisión humana antes y después.

## Orden y dependencias

| Orden | Spec | Prioridad | Dependencias | Estado |
|---|---|---:|---|---|
| 1 | [001 — Lecturas litúrgicas y Daily](./001-liturgical-readings/spec.md) | P0 | Ninguna | Accepted |
| 2 | [002 — Usuarios y autenticación](./002-authentication/spec.md) | P0 | 001 para proteger el dominio de usuario | Implementing |
| 3 | [003 — Guardados y grupos](./003-saved-readings-groups/spec.md) | P1 | 001, 002 | Planned |
| 4 | [004 — Compartir lecturas](./004-reading-sharing/spec.md) | P1 | 001; 003 para contenido privado | Planned |
| 5 | [005 — Sugerencias y revisión editorial](./005-reading-suggestions/spec.md) | P1 | 001, 002 | Planned |
| 6 | [006 — Lectio divina asistida](./006-lectio-divina/spec.md) | P2 | 001, 002 | Planned |
| 7 | [007 — Mobile, PWA y notificaciones](./007-mobile-notifications/spec.md) | P2 | APIs estables de 001–006 | Planned |

P0 significa que evita rehacer la base del producto. P1 representa el núcleo de cuenta y comunidad. P2 representa funcionalidades diferenciadoras con mayor costo, operación o riesgo.

## Artefactos de cada spec

Cada directorio debe contener:

- `spec.md`: qué se construye y por qué; no describe archivos ni decisiones de stack.
- `clarifications.md`: ambigüedades detectadas por QA y decisiones aprobadas.
- `plan.md`: cómo encaja la solución en la arquitectura actual.
- `tasks.md`: tareas pequeñas y ordenadas, cada una con RF y `Hecho cuando:`.
- `validation.md`: evidencia RF por RF después de implementar.

## Estados

```text
Draft → Clarifying → Planned → Implementing → Validating → Accepted
```

Una spec con dudas abiertas no está lista para implementación. Una spec validada puede volver a `Clarifying` cuando aparece un nuevo requisito o cambia el comportamiento.

## Reglas rápidas para agentes

1. Leer `AGENTS.md`, `docs/constitution.md` y la spec activa.
2. No escribir código durante la fase de spec, clarificación o plan.
3. No resolver silenciosamente una duda marcada como `[NEEDS CLARIFICATION]`.
4. Implementar solo una tarea explícita y detenerse al terminarla.
5. Marcar tareas únicamente con tests y verificación ejecutados.
6. Validar cada RF antes de declarar la spec cumplida.

Las plantillas están en [`templates/`](./templates/) y los prompts de fase en [`prompts.md`](./prompts.md).
