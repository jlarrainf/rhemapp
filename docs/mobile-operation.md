# Operación móvil, PWA y avisos Android

La primera fase móvil es una PWA responsive sin push. La segunda es una app Android nativa con Kotlin y Jetpack Compose, disponible desde Android 10 (API 29).

## Soporte y privacidad

| Fase | Soporte | Permisos | Estado |
|---|---|---|---|
| PWA | Navegadores compatibles con manifest y service worker | Ninguno | Web usable sin notificaciones |
| Android | Android 10+ (API 29+) | `POST_NOTIFICATIONS` desde API 33 | Proyecto en `android/` |

La PWA no registra tokens, no solicita permisos de notificación y el service worker no cachea `/api/` ni rutas privadas. El cliente Android usa solamente los contratos HTTP autenticados; nunca recibe una service key.

## Variables server-side

- `PUSH_TOKEN_ENCRYPTION_KEY`: 64 caracteres hexadecimales (32 bytes), para AES-256-GCM.
- `PUSH_PROVIDER_URL`: endpoint HTTPS del adaptador push (HTTP solo en desarrollo controlado).
- `PUSH_PROVIDER_TOKEN`: credencial opcional del adaptador, nunca pública.
- `NOTIFICATIONS_SCHEDULER_SECRET`: secreto para `x-scheduler-secret` o Bearer del scheduler.

## Inicio de sesión con Google en Android

La app nativa muestra `Continuar con Google` y usa Credential Manager para obtener un ID token con nonce. El cliente genera un nonce aleatorio, envía su SHA-256 hexadecimal a Google y conserva el nonce original para el intercambio server-side. Si un proveedor de Credential Manager devuelve `NoCredentialException` por incompatibilidad al procesar el flujo de botón, la app reintenta con `GetGoogleIdOption` sin filtrar cuentas. El token y el nonce original se envían a `POST /api/auth/mobile/google`; el servidor llama `signInWithIdToken` de Supabase y devuelve el mismo contrato de sesión que el acceso por contraseña. La app solo guarda los tokens de sesión de Rhemapp cifrados.

Para habilitarlo por entorno:

1. Habilita Google en **Authentication → Providers → Google** de Supabase usando el Web Client ID y Client Secret del entorno.
2. En Google Cloud registra la aplicación Android con package `com.rhemapp.mobile` y la huella SHA-1 de la firma usada. En el proyecto Rhemapp ya quedó creado `Rhemapp Android Debug` para la firma debug. Mantén también el Web Client ID como audiencia del ID token.
3. Al compilar Android, usa `GOOGLE_WEB_CLIENT_ID=<web-client-id>` o `-PgoogleWebClientId=<web-client-id>`. Si existe `android/app/google-services.json`, el cliente puede tomar el `default_web_client_id` generado automáticamente.

El Client Secret de Google y las claves administrativas de Supabase son server-side; nunca se incluyen en el APK, `BuildConfig`, variables `NEXT_PUBLIC_*` ni logs.

El proveedor recibe un `POST` con `{ token, payload, idempotencyKey }` y debe responder `2xx` con `{ "messageId": "..." }`. `404`/`410` revoca el dispositivo; `429` y `5xx` quedan como fallos reintentables. El token crudo solo existe durante la llamada server-side y se cifra en reposo; la API nunca lo devuelve ni lo registra.

## Calendario y entrega

La PWA y Android consumen el contrato público `GET /api/calendar?month=YYYY-MM&calendar=chile`; no calculan celebraciones, colores ni reglas dominicales localmente. La pantalla web `/calendario` y la pantalla de calendario Android muestran resúmenes y abren el mismo enlace explícito `/daily?date=YYYY-MM-DD`. El service worker precarga `/calendario` como shell público, pero no cachea `/api/` ni rutas privadas; si no hay conexión solo se muestra una versión de página previamente visitada.

El scheduler se ejecuta cada minuto. Compara `local_time` en la zona IANA del perfil y entrega a todos los dispositivos Android activos del usuario con la misma preferencia. El contenido se resuelve con `America/Santiago` y modo `today`, respetando el corte dominical del sábado a las 15:00; el enlace siempre contiene `date=YYYY-MM-DD`.

La clave única por dispositivo y lectura (`device-id:chile:YYYY-MM-DD`) evita duplicados entre cron y reintentos. El RPC toma un bloqueo y permite como máximo tres intentos. Cambiar la zona se aplica en la próxima ejecución y no deja timers del navegador.

## Retención, rollback y despliegue

Las preferencias viven mientras exista la cuenta. Los dispositivos revocados deben purgarse dentro de 30 días y las entregas técnicas dentro de 90 días mediante una tarea operativa controlada; esta entrega no activa un cron implícito ni elimina datos automáticamente. El borrado de la cuenta elimina las filas relacionadas por cascada.

Para rollback, desactiva el scheduler o retira `NOTIFICATIONS_SCHEDULER_SECRET`; la lectura manual y la PWA continúan disponibles. No retires claves ni tablas durante un rollback.

## Cómo probarlo

```bash
npm run test:mobile
npm run lint
npm run build
npx supabase db lint --local
```

Para probar el scheduler en un entorno de pruebas configurado:

```bash
curl -X POST "http://localhost:3000/api/notifications/dispatch?at=2026-09-14T11:00:00.000Z" -H "x-scheduler-secret: <secreto-de-prueba>"
```

Abre `android/` en Android Studio o ejecuta `gradlew.bat :app:assembleDebug` con JDK 17–21. Para push real añade `android/app/google-services.json` sin commitearlo, configura las variables server-side y conecta un proyecto Firebase/FCM. Sin dispositivo o emulador, el APK se puede compilar pero no ejecutar manualmente.
