# Rhemapp Android

Cliente nativo de Rhemapp para Android 10 o superior (API 29+) con Kotlin y Jetpack Compose.

## Abrir y ejecutar

1. Abre la carpeta `android/` desde Android Studio.
2. Espera la sincronización de Gradle y selecciona un emulador o un dispositivo con Android 10+.
3. Para apuntar a un entorno local accesible desde el dispositivo, configura la propiedad `rhemappApiBaseUrl`; por ejemplo, `http://10.0.2.2:3000` para el emulador.
4. Ejecuta la variante `debug`.

La URL predeterminada es `https://rhemapp.com`. No se guardan claves privilegiadas en el proyecto Android.

## Firebase y avisos

Los avisos usan Firebase Cloud Messaging únicamente en Android. Para habilitarlos en una instalación real:

1. Crea o selecciona el proyecto Firebase de Rhemapp y registra `com.rhemapp.mobile`.
2. Descarga `google-services.json` dentro de `android/app/`. El archivo está ignorado por Git y no sustituye las claves del proveedor server-side.
3. Configura en el servidor `PUSH_TOKEN_ENCRYPTION_KEY`, `PUSH_PROVIDER_URL`, `PUSH_PROVIDER_TOKEN` y `NOTIFICATIONS_SCHEDULER_SECRET` según [`docs/mobile-operation.md`](../docs/mobile-operation.md).
4. Programa una llamada HTTPS autenticada a `POST /api/notifications/dispatch` cada minuto.

La app solicita `POST_NOTIFICATIONS` solo al activar avisos en Android 13 o superior. La PWA no solicita ese permiso.

## Contratos consumidos

- `POST /api/auth/mobile` para obtener la sesión con correo y contraseña.
- `POST /api/auth/mobile/refresh` para renovar la sesión cifrada al abrir la app.
- `GET/PATCH /api/notification-preferences` para hora, zona IANA y activación.
- `POST /api/push/register` y `POST /api/push/unregister` para el dispositivo.
- `GET /api/readings?mode=today` o `GET /api/readings?date=YYYY-MM-DD` para Daily.

La app no accede directamente a Supabase: conserva la sesión cifrada en el dispositivo y envía el token de acceso al API autorizado.
