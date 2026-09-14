# Clarificaciones — Spec 003

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- La solicitud habla de “lecturas”, pero Rhemapp también tiene versículos aleatorios y pasajes completos.
- No está decidido si un guardado debe reflejar cambios editoriales o preservar el contenido visto por el usuario.
- La experiencia de grupo predeterminado afecta eliminación, onboarding y migración.
- El botón actual queda deshabilitado después de guardar y no ofrece una ruta rápida para quitar u organizar una lectura; se necesita un patrón de interacción equivalente al marcador de Instagram sin incorporar colaboración.

## Decisiones aprobadas

- Se podrán guardar lecturas litúrgicas, versículos aleatorios y pasajes completos.
- Una lectura podrá pertenecer a más de un grupo.
- Se creará un grupo predeterminado “Mis lecturas”.
- Cada guardado conservará la referencia canónica y un snapshot de título, referencia y extracto al momento de guardarlo.
- “Mis lecturas” no podrá eliminarse, podrá renombrarse, permanecerá aunque esté vacío y recibirá inicialmente cada nuevo guardado junto con los grupos adicionales elegidos.
- “Mis lecturas” representa la bandeja base privada: todos los guardados activos deben permanecer asociados a ella; solo las colecciones adicionales se pueden agregar o quitar desde el organizador. El borrado del guardado elimina la relación base por cascada.
- El marcador tendrá dos acciones: pulsación normal para guardar/quitar y pulsación prolongada para abrir el organizador. Para teclado, escritorio y dispositivos sin gesto prolongado existirá un control visible “Organizar”.

## Impacto

- Plan: se separará una identidad canónica de lectura de un snapshot de presentación, y el grupo predeterminado tendrá protección contra eliminación.
- Tareas: ya se puede fijar el alcance de contenido, snapshot y comportamiento del grupo predeterminado.
- Tareas: la UI debe administrar foco y estados de carga/error del organizador; no se añaden colecciones colaborativas, notas ni cambios al contrato de contenido guardado.
