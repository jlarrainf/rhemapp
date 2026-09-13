# Clarificaciones — Spec 004

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- Las lecturas públicas pueden usar un deep link determinista, mientras que el contenido privado necesita un token persistido.
- No está definido si el share debe tener expiración ni si requiere cuenta.
- La metadata social debe respetar licencias y no incluir texto bíblico no autorizado.

## Decisiones aprobadas

- Se podrán compartir lecturas litúrgicas, versículos aleatorios y pasajes completos públicos.
- Crear un enlace para contenido privado o personalizado requiere autenticación; abrir cualquier enlace compartido no requiere autenticación.
- Los enlaces privados permanecen activos hasta ser revocados por el propietario o hasta que se elimine su cuenta. Los enlaces públicos dependen de que el contenido siga publicado.
- El contenido privado nunca expone grupos, notas, usuario ni identificadores internos.

## Impacto

- Plan: se separan shares canónicos públicos de shares privados revocables, sin expiración automática inicial.
- Tareas: el rate limit, la autorización de creación y la revocación quedan definidos antes del endpoint público.
