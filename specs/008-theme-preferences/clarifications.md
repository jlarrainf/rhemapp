# Clarificaciones — Spec 008

## Revisión QA inicial

| Hallazgo | Impacto | Resolución aprobada |
| --- | --- | --- |
| El control actual alterna solo entre dos temas efectivos. | No permite distinguir “seguir el dispositivo” de “claro”. | Reemplazarlo por un selector explícito de tres opciones. |
| El tema efectivo puede ser oscuro aunque la preferencia deseada sea el dispositivo. | El control no comunica qué está seleccionado. | El valor seleccionado será la preferencia (`system`, `light`, `dark`), no el resultado visual momentáneo. |
| La preferencia actual solo vive en `localStorage`. | No se conserva entre navegadores o dispositivos autenticados. | Guardar también `theme_preference` en `public.profiles`, con validación y propiedad server-side. |
| La inicialización usa la clave heredada `theme`. | Usuarios existentes pueden perder su elección o sufrir un destello. | Leer `themePreference` primero; migrar `theme=light|dark` a la nueva clave y usar `system` como fallback. |
| El selector debe existir en escritorio y móvil. | Una sola variante dejaría una experiencia inconsistente. | Compartir el mismo control y el mismo contexto en ambas ubicaciones. |

## Decisiones

1. Los valores de dominio son exactamente `system`, `light` y `dark`. La interfaz muestra “Según el dispositivo”, “Claro” y “Oscuro”.
2. La preferencia por defecto es `system`; se resuelve con `prefers-color-scheme` y escucha sus cambios mientras esté seleccionada.
3. Para una persona autenticada, la respuesta de `GET /api/profile` es la fuente remota al cargar la sesión, salvo que la persona haya hecho una selección local durante esa carga; en ese caso se conserva su acción explícita y se sincroniza.
4. Para una persona visitante, la persistencia se limita a `localStorage` del navegador.
5. Si una actualización remota falla, la UI conserva el tema elegido localmente y anuncia “No se pudo guardar la preferencia de tema. Se mantuvo en este dispositivo.” La interfaz no muestra el error técnico.
6. La columna `profiles.theme_preference` será `NOT NULL`, tendrá valor por defecto `system` y una restricción que limite los tres valores.
7. No se agrega un campo duplicado a la página “Mi perfil”; el punto de entrada aprobado es “Perfil y más”.
8. El valor remoto no válido o ausente se interpreta como `system` para mantener una experiencia segura y compatible.

## Preguntas resueltas

- ¿Qué ocurre si el sistema cambia mientras está seleccionado “Según el dispositivo”? Se actualiza el tema efectivo, pero la opción seleccionada permanece “Según el dispositivo”.
- ¿Qué ocurre si el sistema cambia con “Claro” u “Oscuro”? No cambia la apariencia seleccionada.
- ¿Qué ocurre si no hay sesión? Se usa y conserva la preferencia local, sin crear ni modificar un perfil.
- ¿Qué ocurre con la implementación previa? `theme=light|dark` se migra automáticamente; una clave inválida se ignora.

No quedan decisiones pendientes para implementar.
