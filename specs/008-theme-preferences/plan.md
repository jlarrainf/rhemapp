# Plan — Spec 008

## Alcance técnico

La feature reutilizará el `ThemeProvider`, el menú de perfil existente y el endpoint protegido de perfil. La lógica de dominio de los tres valores se separará en `src/lib/theme/preferences.js` para que pueda probarse sin navegador.

## Arquitectura y contratos

### Preferencia de tema

```js
{
  themePreference: "system|light|dark"
}
```

`themePreference` será el nombre público del campo. El almacenamiento de Supabase usará `theme_preference`. El valor por defecto será `system`.

### Cliente

- `ThemeContext` expondrá `themePreference`, `setThemePreference`, `isDarkMode`, `isReady` y un error de persistencia seguro.
- La inicialización inline del layout aplicará el valor local o heredado antes de hidratar React.
- El contexto resolverá el tema efectivo con la media query y escuchará cambios del sistema solo en modo `system`.
- La selección se aplicará de forma optimista y se persistirá localmente; la sincronización remota ocurrirá si la sesión está autenticada.

### Servidor y datos

- La validación de perfil aceptará únicamente `system`, `light` y `dark`.
- `GET /api/profile` devolverá `themePreference`.
- `PATCH /api/profile` aceptará `themePreference`, aplicará la validación existente y actualizará solo el perfil cuyo `user_id` coincide con la sesión.
- Una migración nueva agregará la columna, el default, el constraint y el privilegio de actualización para la columna.

### Interfaz

- `ThemePreferenceControl` reemplazará al botón de alternancia.
- Se usarán radios nativos dentro de un `fieldset` con tres etiquetas y objetivos táctiles de al menos 40 px.
- El control compartido se renderizará en el menú desktop y en el menú móvil.
- El estado “Tema actual: claro/oscuro” explicará el resultado cuando se use “Según el dispositivo”; el radio seleccionado seguirá representando la preferencia.

## Decisiones y alternativas descartadas

- Se mantiene el endpoint de perfil en lugar de crear un endpoint de tema: evita duplicar autenticación, autorización y cabeceras de privacidad.
- Se usa una columna `text` con `CHECK` en lugar de un enum de Postgres: permite evolucionar el contrato con una migración explícita sin acoplar el cliente a un tipo generado.
- Se conserva `localStorage` para la aplicación inmediata y visitantes: evita bloquear el primer render por una llamada remota.
- No se conserva el botón de dos estados como atajo: su semántica basada en el tema efectivo es la causa del problema reportado.

## Migración, rollback y operación

- Crear la migración con `npx supabase@latest migration new add_theme_preferences` y aplicarla mediante el flujo de Supabase.
- La migración es aditiva y asigna `system` a perfiles existentes.
- Un rollback operativo, si fuera necesario, consiste en retirar el selector y dejar de leer el campo; la eliminación de la columna requiere una migración posterior aprobada y no forma parte de esta entrega.
- No se agregan variables de entorno, secretos, roles ni cron jobs.

## Estrategia de pruebas

- Prueba de dominio para valores válidos, default, migración heredada y resolución con preferencia del sistema.
- Prueba de perfil para validación, salida pública, contrato de API y grant de la migración.
- Prueba estática de UI para radios, etiquetas en español, paridad desktop/mobile y listeners de sistema.
- Lint y build de Next.js.
- Verificación manual en escritorio y móvil con el selector abierto y comprobación del estado seleccionado independiente del tema efectivo.

## Trazabilidad

| RF | Diseño / implementación | Evidencia |
| --- | --- | --- |
| RF-1, RF-8 | `ThemePreferenceControl`, menú de perfil y Navbar | `test:theme`, verificación manual |
| RF-2, RF-3, RF-4, RF-7 | `src/lib/theme/preferences.js`, `ThemeContext`, bootstrap del layout | `test:theme`, build |
| RF-5 | perfil, API y migración | `test:auth`, `test:theme`, verificación Supabase |
| RF-6 | `ThemeContext` y almacenamiento local | `test:theme`, verificación manual |
