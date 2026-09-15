# Validación — Spec 008

Estado: Validada para revisión humana.

## Evidencia RF por RF

| RF | Evidencia | Resultado |
| --- | --- | --- |
| RF-1 | `npm run test:theme` (8 pruebas) y snapshots manuales del menú en escritorio y móvil | PASA |
| RF-2 | Pruebas de `resolveEffectiveTheme`; `ThemeContext` escucha `prefers-color-scheme`; en el viewport de prueba el sistema oscuro produjo `Tema actual: oscuro` | PASA |
| RF-3 | Selección manual de “Claro” y “Oscuro” con el sistema en oscuro: los estilos computados cambiaron respectivamente a fondo claro y oscuro, con `data-theme-preference` y radio coincidentes | PASA |
| RF-4 | Carga sin preferencia válida y menú abierto: “Según el dispositivo” marcado aunque el tema efectivo fuese oscuro | PASA |
| RF-5 | `npm run test:auth` (55 pruebas), validación de perfil, migración aplicada en Supabase y esquema remoto con `theme_preference NOT NULL DEFAULT 'system'` y constraint de tres valores | PASA; no se ejecutó un smoke PATCH autenticado con una cuenta de prueba |
| RF-6 | Carga visitante recibió 401 en `/api/profile`; selección local se aplicó inmediatamente y sobrevivió a la recarga local | PASA |
| RF-7 | Pruebas de migración de `theme=light|dark`, fallback de valores inválidos, mensaje de error seguro y bootstrap compatible | PASA |
| RF-8 | Radios nativos con `fieldset`, leyenda accesible, foco visible, objetivos de 52–68 px y control compartido en desktop/mobile | PASA |

## Comandos reproducibles

Prerequisitos: Node/npm del proyecto, dependencias instaladas y variables no secretas del entorno local configuradas en `.env.local` cuando se quiera levantar la aplicación. No se imprimen secretos.

```bash
npm run test:theme
# 8 tests passed

npm run test:auth
# 55 tests passed

npm run lint
# ✔ No ESLint warnings or errors

npm run build
# exit code 0; Next.js generated all routes successfully
```

La migración se creó con `npx supabase@latest migration new add_theme_preferences` y se aplicó al proyecto Supabase de producción configurado para Rhemapp. La inspección remota confirmó la columna, el default, el constraint y RLS habilitado en `public.profiles`. El advisor de seguridad no reportó un hallazgo nuevo por esta migración; permanecen avisos preexistentes de tablas internas con RLS sin políticas y protección de contraseñas filtradas deshabilitada.

## Verificación manual UI

1. Ejecutar `npm run dev`.
2. Abrir `http://localhost:3000/random`.
3. En escritorio, abrir “Perfil”, comprobar las opciones “Según el dispositivo”, “Claro” y “Oscuro”, seleccionar claro/oscuro y volver a “Según el dispositivo”.
4. En móvil, usar un viewport de 390×844, abrir “Menú principal” y repetir la comprobación; el control muestra las mismas tres opciones y conserva el radio seleccionado.
5. Comprobar que cuando el dispositivo está en oscuro, “Según el dispositivo” permanece marcado y el texto indica “Tema actual: oscuro”.
6. Revisar consola: una carga limpia del bundle no presentó errores de hidratación ni errores de consola relacionados con la feature.

El CLI `agent-browser` no estaba instalado en este entorno; la verificación se ejecutó con la automatización de navegador integrada, incluyendo DOM snapshot, screenshot, interacción con radios, viewport responsive y lectura de logs.

## Corrección de precedencia y deploy

Se añadió `@custom-variant dark (&:where(.dark, .dark *));` en `src/app/globals.css` para que Tailwind CSS 4 use la clase explícita del documento como fuente de verdad. Así, “Claro” elimina los estilos `dark:*` aunque el sistema operativo esté en oscuro, y “Oscuro” los aplica aunque el sistema esté en claro.

La corrección quedó incluida en el deployment completo `dpl_AYMNpwnVPf5QtYydfLruH1EdMzMc`, en estado `READY`, y asociada a [rhemapp.com](https://rhemapp.com). Se verificaron con HTTP 200 las rutas `/`, `/daily`, `/random`, `/rosario`, `/biblioteca`, `/perfil`, `/manifest.webmanifest` y `/sw.js`; además, en el sitio publicado se comprobó manualmente el ciclo `Claro → Oscuro → Según el dispositivo` con el dispositivo en oscuro, incluyendo persistencia tras abrir nuevamente la página. Este deployment conserva también las mejoras móviles/PWA, Android, navegación y notificaciones que estaban presentes en el workspace.

La publicación se hizo desde el workspace actual, cuyo metadato de Vercel conserva como base Git `6f77cb0` con `gitDirty=1`; no se creó commit ni se hizo push en esta entrega. La implementación está activa en producción, pero los cambios sin commit pueden volver a quedar fuera si posteriormente se publica solo desde `main` sin integrarlos en Git.

## Limitaciones y operación

- No se usó una cuenta de prueba para ejecutar el PATCH autenticado de extremo a extremo; el límite está explicitado en RF-5. El contrato, la validación server-side, la autorización existente y la migración remota sí fueron comprobados.
- No se agregaron variables de entorno ni secretos. La columna es aditiva y los perfiles existentes reciben `system`.
- Para desplegar la feature se debe publicar el código que contiene esta migración ya aplicada; si se revierte la UI, no se debe eliminar la columna sin una migración inversa revisada.

## Veredicto

SPEC CUMPLIDA — implementación, persistencia de datos, pruebas automáticas y verificación UI completadas; queda recomendado un smoke autenticado con una cuenta de prueba antes de la aceptación operativa final.
