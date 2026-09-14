# Operación móvil, PWA y avisos Android

Esta guía cubre la Spec 007. La primera entrega móvil es una PWA responsive sin push; los avisos, el registro de dispositivos y el scheduler pertenecen al cliente Android nativo.

## Fases y soporte

| Fase | Entrega | Soporte | Permisos | Estado |
|---|---|---|---|---|
| 1 | PWA instalable | Navegadores compatibles con manifest y service worker | Ninguno | Activa en la web |
| 2 | Android nativo | Android 10+ (API 29+) | `POST_NOTIFICATIONS` en API 33+ | Cliente en `android/` |

La PWA no registra tokens push y su service worker no cachea `/api/` ni páginas privadas. Si el navegador no admite PWA, Daily, Random, Rosario, guardados, compartir y Lectio siguen disponibles como web normal.

## Variables de entorno server-side

| Variable | Uso |
|---|---|
| `PUSH_TOKEN_ENCRYPTION_KEY` | 64 caracteres hexadecimales (32 bytes) para cifrar tokens FCM con AES-256-GCM. |
| `PUSH_PROVIDER_URL` | Endpoint HTTPS del adaptador de proveedor push. En desarrollo puede ser HTTP. |
| `PUSH_PROVIDER_TOKEN` | Credencial server-side opcional enviada como Bearer al adaptador. |
| `NOTIFICATIONS_SCHEDULER_SECRET` | Secreto para `x-scheduler-secret` o `Authorization: Bearer` del scheduler. |

Genera la clave de tokens fuera del repositorio. Nunca la pongas en una variable `NEXT_PUBLIC_`, en el cliente Android ni en logs.

## Adaptador push

Rhemapp envía al `PUSH_PROVIDER_URL` un `POST` JSON con esta forma:

```json
{
  "token": "<token FCM>",
  "payload": {
    "title": "Lectura del día",
    "body": "<celebración verificada>",
    "url": "https://rhemapp.com/daily?date=YYYY-MM-DD",
    "data": { "path": "/daily", "date": "YYYY-MM-DD", "mode": "today" }
  },
  "idempotencyKey": "<device-id>:chile:<date>"
}
```

El adaptador debe traducir ese contrato al proveedor elegido (por ejemplo FCM HTTP v1), conservar el `Idempotency-Key`, responder `2xx` con `{ "messageId": "..." }` cuando envíe el aviso y responder `404` o `410` para tokens inválidos. Rhemapp revoca un token inválido y marca la entrega; los errores transitorios quedan disponibles para hasta tres intentos.

## Scheduler y calendario

El scheduler se ejecuta cada minuto. Para cada preferencia habilitada compara la hora local con la zona IANA guardada. La fecha de la lectura siempre se resuelve con el calendario chileno y `America/Santiago`, mediante la regla dominical centralizada; el aviso nunca usa el modo de lectura dominical anticipada. El enlace contiene una fecha explícita para que un toque posterior siga abriendo la lectura avisada.

El cambio de zona horaria se aplica en la siguiente ejecución: no hay timers de navegador ni una cola futura que conservar. La entrega se crea de forma just-in-time, por dispositivo y por `chile:YYYY-MM-DD`; el RPC de Supabase la reclama con bloqueo para que un reintento concurrente no envíe dos avisos.

## Retención y acceso

- `notification_preferences` conserva solo la configuración actual.
- `push_devices` conserva el token cifrado, su hash para deduplicación, última actividad y revocación; la API nunca devuelve el token.
- `notification_deliveries` conserva estado técnico, intentos, fecha, error codificado y `provider_message_id`.
- El cliente autenticado no tiene lectura directa de tokens ni entregas; el scheduler usa `SUPABASE_SERVICE_ROLE_KEY` server-side.
- Las sesiones del cliente Android se conservan cifradas en el dispositivo y se renuevan mediante `POST /api/auth/mobile/refresh`; la contraseña no se almacena.
- Antes de publicar se deben definir una política de retención operativa para entregas y un job de purga acorde con la política de privacidad.

## Prueba reproducible

```bash
npm run test:mobile
npm run lint
npm run build
npx supabase db lint --local
```

Para probar el dispatch en un entorno configurado, usa la hora exacta en formato ISO solo desde un entorno de pruebas:

```bash
curl -X POST "http://localhost:3000/api/notifications/dispatch?at=2026-09-14T11:00:00.000Z" \
  -H "x-scheduler-secret: <secreto-de-prueba>"
```

La respuesta incluye conteos de procesadas, enviadas, omitidas, fallidas y revocadas; no incluye tokens ni contenido privado.
