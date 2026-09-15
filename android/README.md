# Rhemapp Android

Cliente nativo Kotlin/Jetpack Compose para Android 10 (API 29) o superior.

## Ejecutar

1. Abre esta carpeta en Android Studio.
2. Configura `rhemappApiBaseUrl` en `gradle.properties` o usa el valor predeterminado `https://rhemapp.com`.
3. Sincroniza Gradle y ejecuta `app` en un emulador o dispositivo Android 10+.
4. Para habilitar **Continuar con Google**, configura el proveedor Google en Supabase y proporciona el Web Client ID al build mediante `GOOGLE_WEB_CLIENT_ID` o `-PgoogleWebClientId=<web-client-id>`. Si colocas el `google-services.json` en `app/`, el proyecto puede usar el `default_web_client_id` generado por el plugin.
5. Para avisos reales, coloca el `google-services.json` del proyecto Firebase en `app/` y configura en el servidor `PUSH_TOKEN_ENCRYPTION_KEY`, `PUSH_PROVIDER_URL`, `PUSH_PROVIDER_TOKEN` y `NOTIFICATIONS_SCHEDULER_SECRET`.

La app conserva únicamente tokens de sesión cifrados con `EncryptedSharedPreferences`; la contraseña no se guarda. El token FCM se envía solo a `/api/push/register`, que lo cifra server-side y devuelve un identificador opaco.

Los enlaces `https://rhemapp.com/daily?date=YYYY-MM-DD` y `rhemapp://daily?date=YYYY-MM-DD` abren la lectura fechada. La PWA web no solicita permisos ni registra push.

El acceso Google usa Credential Manager para obtener un ID token con nonce. La app envía el SHA-256 hexadecimal del nonce a Google y el nonce original junto al ID token a `/api/auth/mobile/google`; el servidor lo valida con Supabase y la app conserva solamente los tokens de sesión de Rhemapp en almacenamiento cifrado. No se guardan tokens de Google.

Para la configuración de Google Cloud y Supabase, consulta [`docs/authentication-operation.md`](../docs/authentication-operation.md). El Web Client ID no es un secreto; el Client Secret de Google queda únicamente en Supabase.
