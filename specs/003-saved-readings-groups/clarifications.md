# Clarificaciones — Spec 003

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- La solicitud habla de “lecturas”, pero Rhemapp también tiene versículos aleatorios y pasajes completos.
- No está decidido si un guardado debe reflejar cambios editoriales o preservar el contenido visto por el usuario.
- La experiencia de grupo predeterminado afecta eliminación, onboarding y migración.

## Decisiones aprobadas

- Se podrán guardar lecturas litúrgicas, versículos aleatorios y pasajes completos.
- Una lectura podrá pertenecer a más de un grupo.
- Se creará un grupo predeterminado “Mis lecturas”.
- Cada guardado conservará la referencia canónica y un snapshot de título, referencia y extracto al momento de guardarlo.
- “Mis lecturas” no podrá eliminarse, podrá renombrarse, permanecerá aunque esté vacío y recibirá inicialmente cada nuevo guardado junto con los grupos adicionales elegidos.

## Impacto

- Plan: se separará una identidad canónica de lectura de un snapshot de presentación, y el grupo predeterminado tendrá protección contra eliminación.
- Tareas: ya se puede fijar el alcance de contenido, snapshot y comportamiento del grupo predeterminado.
