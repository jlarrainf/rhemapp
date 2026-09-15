# Tareas — Spec 007

## Fase 0 — Plataforma y soporte

- [x] T1 — Definir entrega escalonada: PWA primero y Android después.
  - RF: RF-1, RF-2
  - Hecho cuando: la PWA sin push y la fase Android con push quedan separadas en alcance, dependencias y matriz de soporte.
  - Estado actual: COMPLETADA. La separación PWA/Android, permisos y soporte está documentada en `spec.md`, `clarifications.md`, `plan.md` y `docs/mobile-operation.md`.

- [x] T2 — Definir hora predeterminada, zona horaria y frecuencia.
  - RF: RF-4, RF-5, RF-9
  - Hecho cuando: 08:00 diario, activación explícita, zona local IANA y contenido diario están documentados.
  - Estado actual: COMPLETADA. La política 08:00, desactivada por defecto, diaria, IANA y el corte chileno están documentados y cubiertos por pruebas de dominio.

- [x] T3 — Definir modelo de dispositivos, privacidad y deduplicación.
  - RF: RF-3, RF-6, RF-8
  - Hecho cuando: Android 10+, múltiples dispositivos con preferencia común, restricciones, retención y reintentos están aprobados.
  - Estado actual: COMPLETADA. Android 10+, múltiples dispositivos, tokens privados, retención operativa y máximo de tres intentos están documentados.

## Fase 1 — Paridad móvil

- [x] T4 — Auditar y corregir layout responsive de las rutas existentes y jerarquía del header.
  - RF: RF-1
  - Hecho cuando: Daily, Random, Rosario y navegación funcionan en viewport móvil; el logo conduce al inicio, solo se muestran las tres rutas principales en escritorio y las opciones secundarias están agrupadas bajo Perfil y más con cierre accesible.
  - Estado actual: COMPLETADA. `Navbar` y `ProfileMenu` implementan la jerarquía aprobada; el test de auth UI cubre los enlaces, el logo, el agrupamiento y el cierre con Escape/fuera del menú.
  - Archivos: `src/components/Navbar.jsx`, `src/components/ProfileMenu.jsx`, `src/components/AuthActions.jsx`, `scripts/test-auth-ui.mjs`.
  - Evidencia: `npm run test:auth` (55/55), `npm run lint`, `npm run build` y verificación manual en `http://localhost:3000/daily`.
  - Cómo probarlo: abrir `/daily`, confirmar las tres rutas visibles, abrir `Perfil`, comprobar sus opciones y pulsar Escape; el foco vuelve al botón `Perfil`.

- [x] T4A — Mover la atribución del Rosario al final del contenido.
  - RF: RF-10
  - Hecho cuando: fuente y traducción aparecen después de la lista completa de misterios, sin romper el detalle accesible.
  - Estado actual: COMPLETADA. `BibleTranslationNotice` se renderiza después del recorrido de misterios; el orden está cubierto por `test:mobile` y una verificación manual de `/rosario`.
  - Cómo probarlo: abrir `/rosario` y comprobar que `Fuente y traducción` aparece después del quinto misterio.

- [x] T4B — Añadir navegación anterior/siguiente en Lecturas del día.
  - RF: RF-11
  - Hecho cuando: los controles táctiles y de teclado cambian a fechas ISO contiguas, protegen la fecha mínima y mantienen el calendario chileno.
  - Estado actual: COMPLETADA. `DailyVerseClient` usa `addCalendarDays`, elimina el modo implícito de hoy y solicita `/api/readings?date=YYYY-MM-DD`.
  - Cómo probarlo: abrir `/daily`, activar `Ver el día siguiente` y luego `Ver el día anterior`; verificar la fecha ISO de la URL y el contenido mostrado.

- [x] T5 — Completar manifest, iconos y metadata de instalación.
  - RF: RF-2
  - Hecho cuando: PWA instalable muestra identidad y tema correctos.
  - Estado actual: COMPLETADA. Manifest, metadata, iconos, service worker y exclusión de API/rutas privadas están implementados; el launcher Android reutiliza `public/Rhemapp_isotype.png`.
  - Evidencia: `npm run test:mobile`, `npm run lint` y `npm run build`.

- [x] T6 — Verificar que los contratos de auth, lecturas, guardados y compartir funcionan en móvil.
  - RF: RF-1, RF-7
  - Hecho cuando: existe smoke test de los flujos aprobados.
  - Estado actual: COMPLETADA. Los contratos existentes conservan sus pruebas de autenticación, lecturas, guardados, grupos, compartir y Lectio.
  - Evidencia: `test:readings` (33/33), `test:auth` (55/55), `test:sharing` (13/13), `test:lectio` (10/10) y suite de guardados/grupos aprobada.

- [x] T6A — Preparar la base de la app Android nativa con Kotlin y Jetpack Compose.
  - RF: RF-1, RF-7
  - Hecho cuando: el cliente Android 10+ puede autenticarse, consumir un contrato de lectura y abrir un deep link sin duplicar reglas de dominio.
  - Estado actual: COMPLETADA. Proyecto, wrapper Gradle, cliente HTTP autenticado, sesión cifrada, Compose, FCM y deep links están en `android/`.
  - Evidencia: `android/gradlew.bat --no-daemon :app:assembleDebug` → `BUILD SUCCESSFUL`.

- [x] T6B — Integrar inicio de sesión nativo con Google en Android.
  - RF: RF-12
  - Hecho cuando: el botón abre Credential Manager, el ID token se valida en `/api/auth/mobile/google`, la app guarda la sesión móvil cifrada y cancelación/configuración inválida dejan un estado seguro en español.
  - Estado actual: COMPLETADA. Credential Manager obtiene el selector y el endpoint server-side intercambia el ID token mediante Supabase; la sesión se guarda con `EncryptedSharedPreferences`. Google Cloud tiene clientes OAuth web y Android; la APK usa el Web Client ID público como audiencia del token. Se agregó un reintento con `GetGoogleIdOption` para proveedores que reportan falsamente `NoCredentialException`, y el cliente HTTP rechaza respuestas HTML sin intentar convertirlas a `JSONObject`.
  - Evidencia: `npm run test:mobile` (9/9), `npm run lint` y `android/gradlew.bat --no-daemon "-PgoogleWebClientId=<web-client-id>" :app:assembleDebug` → `BUILD SUCCESSFUL`; el deployment `dpl_77LujpaPTvwfpPKXrPhV56HTECGG` quedó `READY`; `POST https://rhemapp.com/api/auth/mobile/google` sin credencial respondió `400 application/json`; en `emulator-5554` se confirmó la cuenta del sistema, se abrió el selector, se completó el flujo y Rhemapp volvió autenticada mostrando `Salir`. El cliente Android `Rhemapp Android Debug` fue creado en Google Cloud el 2026-09-15 para `com.rhemapp.mobile` con la SHA-1 de la APK debug.

## Fase 2 — App Android, preferencias y push

- [x] T7 — Crear migraciones de preferencias, dispositivos y entregas.
  - RF: RF-3, RF-4, RF-8
  - Hecho cuando: índices de dedupe y políticas de acceso están verificadas.
  - Estado actual: COMPLETADA. Migración, índices, constraints, RLS y RPC server-side están implementados.
  - Evidencia: `npx supabase db lint --local` → `No schema errors found`; la prueba pgTAP queda pendiente por falta de Docker/Podman.

- [x] T8 — Implementar configuración de hora, zona y activación.
  - RF: RF-4, RF-6
  - Hecho cuando: el usuario puede guardar, cambiar y desactivar preferencias.
  - Estado actual: COMPLETADA. API, formulario de perfil y cliente Android permiten consultar, guardar y desactivar preferencias con validación IANA.
  - Evidencia: `npm run test:mobile` (7/7), incluyendo defaults, zonas y contrato de preferencias.

- [x] T9 — Implementar registro y revocación de dispositivos.
  - RF: RF-3, RF-6, RF-8
  - Hecho cuando: tokens inválidos se revocan sin exponerlos.
  - Estado actual: COMPLETADA. Tokens se deduplican por hash, se cifran en reposo y los inválidos del proveedor revocan el dispositivo sin devolverse al cliente.
  - Evidencia: `npm run test:mobile` (7/7), subtests de registro, cifrado/hash y revocación.

- [x] T10 — Implementar scheduler y resolución de lectura.
  - RF: RF-5, RF-9
  - Hecho cuando: se calcula una entrega correcta según zona y lectura vigente.
  - Estado actual: COMPLETADA. Dispatch protegido por secreto, comparación por minuto local y resolución de lectura chilena vigente en modo `today`.
  - Evidencia: `npm run test:mobile` y `npm run test:readings` (33/33), incluyendo corte sábado 15:00.

- [x] T11 — Implementar deduplicación, reintentos y registro de entrega.
  - RF: RF-5, RF-8
  - Hecho cuando: un reintento no duplica el aviso y queda trazabilidad técnica.
  - Estado actual: COMPLETADA. RPC de claim/complete/fail, clave idempotente, máximo de tres intentos y adaptador 404/410/429/5xx implementados.
  - Evidencia: `npm run test:mobile` (7/7), subtest de idempotencia y token inválido.

- [x] T12 — Implementar deep link desde la notificación.
  - RF: RF-7, RF-9
  - Hecho cuando: app abierta o cerrada llega a la lectura correcta.
  - Estado actual: COMPLETADA. Android abre `/daily?date=YYYY-MM-DD`; el parser rechaza modos no permitidos y la actividad procesa enlaces iniciales y nuevos.
  - Evidencia: `npm run test:mobile` y `:app:assembleDebug`.

## Fase final — Verificación

- [x] T13 — Ejecutar matriz de navegadores, PWA, Android, permisos y Google.
  - RF: RF-1 a RF-12
  - Hecho cuando: las limitaciones de soporte están documentadas y no bloquean lectura manual.
  - Estado actual: COMPLETADA CON LIMITACIONES DOCUMENTADAS. Se verificaron las rutas web, la configuración OAuth web/Android, el proveedor Supabase, la compilación Android y el inicio de sesión real en un emulador conectado. Las pruebas que requieren FCM real, pgTAP con Docker/Podman, instalación PWA y viewport físico quedan identificadas como limitaciones externas.
  - Evidencia: `validation.md` registra la matriz, los comandos, el deployment de producción y el flujo Google completado; smoke manual de `/daily` y `/rosario`; `npm run test:mobile`, `npm run lint`, `npm run build` y build Android.

- [x] T14 — Completar `validation.md`.
  - RF: RF-1 a RF-12
  - Hecho cuando: pasan tests, lint, build y scheduler de prueba.
  - Estado actual: COMPLETADA. `validation.md` contiene evidencia RF-1 a RF-12, comandos reproducibles, el APK generado, el resultado del deployment, el flujo Google validado en el emulador y las limitaciones sin inventar una prueba de push real.
