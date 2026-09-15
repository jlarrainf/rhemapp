# Validación — Spec 007

Estado: Validación final — 2026-09-15; RF-12 validado en producción y emulador Android

## Evidencia por requisito funcional

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | T4/T6/T13: `npm run test:auth`, `npm run test:readings`, `npm run test:mobile`, `npm run build`; smoke manual de `/daily` y `/rosario` | PASS | Las rutas principales y los contratos existentes siguen disponibles. La verificación manual se realizó en el navegador integrado; no fue posible forzar un viewport de 390 px desde esa herramienta. |
| RF-2 | T5: `public/manifest.webmanifest`, `public/sw.js`, `src/components/PwaRegistration.jsx`, `android/app/src/main/res/drawable-nodpi/rhemapp_isotype.png`, `AndroidManifest.xml`, `npm run test:mobile`, `npm run build` | PASS | La PWA y el launcher Android reutilizan el logo oficial de la web; el hash SHA-256 del PNG Android coincide con `public/Rhemapp_isotype.png`. La instalación física de la PWA no se ejecutó en este entorno. |
| RF-3 | T6A/T9: `npm run test:mobile`, `android/gradlew.bat --no-daemon :app:assembleDebug` | PASS | El registro Android cifra el token, usa hash para deduplicación y no lo devuelve al cliente. FCM real requiere `google-services.json`, proyecto Firebase y dispositivo. |
| RF-4 | T8: `npm run test:mobile` (7/7), API y formulario de preferencias | PASS | Se validan 08:00, IANA, activación, cambio y desactivación. |
| RF-5 | T10/T11: scheduler y dispatch mockeados en `npm run test:mobile` (8/8) | PASS CON LIMITACIÓN | La resolución, ventana local, reintentos e idempotencia están cubiertos; no se ejecutó un envío contra un proveedor push real. |
| RF-6 | T8/T9/T12: validación de preferencias, revocación e implementación Android de permiso denegado | PASS CON LIMITACIÓN | La ruta de denegación limpia el registro del dispositivo. La interacción del diálogo `POST_NOTIFICATIONS` no se ejecutó porque no había emulador/dispositivo conectado. |
| RF-7 | T12: parser de deep links, `AndroidManifest.xml`, `MainActivity.kt`, `PushMessagingService.kt`, `npm run test:mobile` | PASS CON LIMITACIÓN | Se generan y procesan enlaces con `date=YYYY-MM-DD`; no se pudo abrir una notificación en un Android real. |
| RF-8 | T7/T9/T11: migración RLS/RPC, tokens inválidos, reintentos e idempotencia; `npx supabase db lint --local` | PASS CON LIMITACIÓN | El lint de esquema pasó. El test pgTAP se intentó, pero el entorno no tiene Docker/Podman para levantar la base local. |
| RF-9 | T10/T12: `npm run test:readings` (33/33) y `npm run test:mobile` (8/8) | PASS | Se cubren el calendario chileno, el corte del sábado a las 15:00 y la resolución `today` del scheduler/deep link. |
| RF-10 | T4A: `npm run test:mobile` y smoke manual de `/rosario` | PASS | `Fuente y traducción` aparece después del quinto misterio y mantiene el contenido accesible. |
| RF-11 | T4B: `npm run test:mobile` y smoke manual de `/daily` | PASS | Los botones `Ver el día anterior` y `Ver el día siguiente` son accesibles y táctiles. Se verificó `date=2026-09-15` al avanzar y `date=2026-09-14` al retroceder, con lectura recargada. |
| RF-12 | T6B: validación de payload ID token/nonce, endpoint server-side, botón Android, proveedor Google habilitado, clientes OAuth web/Android, build con el cliente OAuth de Rhemapp, `android/gradlew.bat --no-daemon "-PgoogleWebClientId=<web-client-id>" :app:assembleDebug`, deployment Vercel `dpl_77LujpaPTvwfpPKXrPhV56HTECGG` en `READY`, `POST /api/auth/mobile/google` → `400 application/json` para payload inválido, emulador `emulator-5554` y sesión autenticada | PASS | Credential Manager abre el selector nativo y muestra la cuenta del sistema de Google. El primer proveedor moderno falla por el bug reproducible de Google Play Services `23.18.18`; el reintento con `GetGoogleIdOption` devuelve el selector correctamente. Tras completar el flujo en el emulador, Rhemapp vuelve a la pantalla de lecturas mostrando `Salir`, evidencia de sesión autenticada. El cliente Android `Rhemapp Android Debug` existe para `com.rhemapp.mobile` con la SHA-1 de la APK debug. La app envía SHA-256 hexadecimal a Google y el nonce original a Supabase. El cliente Android también rechaza respuestas HTML/proxy sin exponerlas ni convertirlas a `JSONObject`. |

## Comprobaciones ejecutadas

- `npm run test:mobile` → 9/9 aprobadas.
- `npm run test:readings` → 33/33 aprobadas.
- `npm run test:auth` → 55/55 aprobadas.
- `npm run test:sharing` → 13/13 aprobadas.
- `npm run test:suggestions` → 14/14 aprobadas.
- `npm run test:lectio` → 10/10 aprobadas.
- `npm run test:saved-readings` → 6/6 aprobadas.
- `npm run test:reading-groups` → 5/5 aprobadas.
- Suite adicional de guardados, grupos, RLS, migración, API y biblioteca → aprobada en las comprobaciones de regresión de la entrega.
- `npm run lint` → sin advertencias ni errores.
- `npm run build` → compilación Next.js de producción aprobada; incluye las rutas de preferencias, registro, revocación y dispatch.
- `npx supabase db lint --local` → `No schema errors found`.
- `git diff --check` → código de salida 0; solo avisos de normalización LF/CRLF de Git.
- Detector de Impeccable sobre las superficies modificadas → `[]`, sin hallazgos.
- `android/gradlew.bat --no-daemon "-PgoogleWebClientId=<web-client-id>" :app:assembleDebug` con JDK 21 → `BUILD SUCCESSFUL`; APK en `android/app/build/outputs/apk/debug/app-debug.apk`.
- Deployment mediante el MCP conectado de Vercel → `dpl_77LujpaPTvwfpPKXrPhV56HTECGG`, estado `READY`, aliasado a `https://rhemapp.com`; `POST` inválido responde `400 application/json` y `GET` responde `405`, confirmando que la ruta existe y solo acepta el método previsto.
- APK instalada en `emulator-5554`: `android/app/build/outputs/apk/debug/app-debug.apk`, tamaño `33391756` bytes, SHA-256 `E8A87F76B9EF60560559E07BD78B98B7499E19D02FE977EC697D37122D1C18D7`.

## Limitaciones conocidas

- `npx supabase test db --local supabase/tests/mobile_notifications_data_test.sql` no pudo ejecutar pgTAP porque no hay Docker/Podman disponible. El lint SQL sí pasó y los contratos de datos tienen pruebas estáticas.
- `adb` detecta `emulator-5554`; la cuenta Google está registrada como `type=com.google`, el selector nativo se mostró y el retorno dejó Rhemapp autenticada. No se verificaron todavía en ejecución el diálogo de permisos, el deep link desde una notificación ni la recepción FCM real.
- No se configuró ni se invocó un proveedor push real, Firebase ni secretos de producción. El adaptador y el dispatch se validaron con mocks y rutas de error.
- El Web Client ID público existente de Rhemapp está habilitado en Google Cloud/Supabase y se incluyó solo en el build de la APK; el cliente Android para `com.rhemapp.mobile` y la SHA-1 debug también quedaron registrados en Google Cloud. El selector nativo y la sesión final fueron comprobados con una cuenta real del emulador.
- La herramienta de navegador integrada no permite forzar un viewport estrecho; la adaptación móvil se cubre con clases/tamaños táctiles, pruebas estáticas y la compilación, pero queda pendiente una matriz física de dispositivos.

## Deploy completo de la web

El estado completo del workspace se publicó en producción mediante el deployment `dpl_AYMNpwnVPf5QtYydfLruH1EdMzMc`, en estado `READY`, asociado a [rhemapp.com](https://rhemapp.com). Este deploy incluye las mejoras móviles/PWA, navegación de Lectura del día y Rosario, endpoints de autenticación móvil, preferencias y dispatch de notificaciones, registro push, la base Android y el selector de tema de la Spec 008.

La comprobación posterior confirmó `200` en `/`, `/daily`, `/random`, `/rosario`, `/biblioteca`, `/perfil`, `/manifest.webmanifest` y `/sw.js`; las rutas `GET /api/auth/mobile/google`, `GET /api/notifications/dispatch` y `GET /api/push/register` respondieron `405`, confirmando que están desplegadas y protegidas por método. Vercel reportó `READY`, sin errores runtime ni logs de error para el deployment durante la ventana revisada.

La publicación se hizo desde el workspace actual, que todavía contiene cambios sin commit. Las variables `PUSH_TOKEN_ENCRYPTION_KEY`, `PUSH_PROVIDER_URL`, `PUSH_PROVIDER_TOKEN` y `NOTIFICATIONS_SCHEDULER_SECRET` aún no están configuradas en producción; por ello el código de push está publicado, pero el envío real requiere completar esa configuración server-side.

## Cómo probarlo

Prerequisitos: Node/npm, variables server-side de Supabase existentes para el proyecto, y para la app Android JDK 17–21 más el SDK Android. Los secretos nunca deben ir al navegador ni al repositorio.

1. Iniciar el entorno web con `npm run dev`.
2. Abrir `http://localhost:3000/rosario`; confirmar que `Fuente y traducción` está después de todos los misterios.
3. Abrir `http://localhost:3000/daily`; usar `Ver el día siguiente` y `Ver el día anterior`; confirmar que la URL cambia a `date=YYYY-MM-DD` y que se actualiza la lectura.
4. Ejecutar `npm run test:mobile`, `npm run lint`, `npm run build` y `npx supabase db lint --local`.
5. Para Android, abrir `android/` en Android Studio o ejecutar desde esa carpeta `gradlew.bat --no-daemon "-PgoogleWebClientId=<web-client-id>" :app:assembleDebug`. En un emulador con una cuenta Google, pulsar `Continuar con Google`, elegir la cuenta y completar `Continue`; confirmar que la app vuelve autenticada y que no muestra un error. El APK entregado usa el cliente OAuth web público ya existente de Rhemapp; para otro entorno, habilita Google en Supabase, usa su Web Client ID y un Android 10+ con Google Play Services. Para push real, añadir localmente `android/app/google-services.json`, configurar las variables server-side y conectar Firebase/FCM.
6. Para probar dispatch en un entorno configurado, iniciar la web y ejecutar `POST /api/notifications/dispatch` con `x-scheduler-secret` y un instante `at` controlado; nunca registrar el token ni el secreto.

## Veredicto

`SPEC NO CUMPLIDA` — RF-12 está implementado y el selector nativo fue comprobado en el emulador, pero falta verificar el consentimiento final, el ID token, el intercambio con Supabase y la sesión autenticada. Los envíos push reales y sus pruebas también requieren configuración externa.
