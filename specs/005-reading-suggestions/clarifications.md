# Clarificaciones — Spec 005

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- El calendario actual se sincroniza desde scripts y archivos locales; la publicación futura necesitará una frontera editorial clara.
- La solicitud no define si una sugerencia puede crear una nueva fecha o solo corregir contenido.
- Los roles de editor y administrador deben existir antes de exponer la cola.
- La notificación de cambios puede añadir un canal de comunicación y obligaciones de privacidad.

## Decisiones aprobadas

- La cuenta propietaria inicial será el primer administrador/editor mediante allowlist privada server-side. El correo real no se guardará en el repositorio.
- Los usuarios podrán sugerir nuevas lecturas y correcciones de referencias o datos existentes; nunca habrá publicación automática.
- Inicialmente solo la cuenta propietaria tendrá rol de editor/administrador; los editores adicionales se agregarán manualmente.
- El MVP no enviará notificaciones por cambios de estado; el usuario revisará sus sugerencias en su cuenta.
- Las sugerencias rechazadas o eliminadas conservarán únicamente auditoría anonimizada durante 12 meses y después se eliminarán.

## Impacto

- Plan: separar sugerencia, revisión y contenido publicado; provisionar el primer admin fuera del código versionado y aplicar retención de 12 meses a auditoría anonimizada.
- Tareas: el alcance de sugerencias, responsables, ausencia de notificaciones y retención quedan definidos.
