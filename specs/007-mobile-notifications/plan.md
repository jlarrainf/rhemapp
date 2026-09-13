# Plan técnico — Spec 007

Estado: Planned — clarificaciones resueltas; pendiente implementación

## Alcance técnico

La entrega se dividirá en dos fases: primero paridad responsive/PWA instalable sin push; después una app Android nativa con Kotlin y Jetpack Compose que consumirá los mismos contratos y agregará notificaciones. La lógica de lecturas, autenticación, guardados y grupos se consume mediante contratos compartidos; no se copia en cada cliente. Android 10 (API 29) será la versión mínima.

## Arquitectura y módulos

- Mejorar `public/manifest.webmanifest`, iconos, metadata y service worker/PWA según soporte elegido.
- `src/lib/mobile/` para contratos de deep link, plataforma y preferencias.
- `src/app/api/notification-preferences/` para hora, zona, estado y dispositivos.
- `src/app/api/push/register` y `src/app/api/push/unregister`, usados por Android en la segunda fase.
- Scheduler protegido que resuelve cada usuario Android por su zona horaria y la lectura diaria vigente.
- Tablas `notification_preferences`, `push_devices` y `notification_deliveries`.
- Aplicación Android posterior con cliente API compartido, no con acceso directo a la base de datos.

Las preferencias, dispositivos y entregas se persistirán en Supabase con RLS. La aplicación nativa solo usará el cliente autorizado y contratos API; nunca credenciales privilegiadas ni acceso directo con service key.

## Modelo de datos

```text
notification_preferences(user_id, enabled, local_time, timezone,
  sunday_mode, updated_at)
push_devices(id, user_id, platform, token_hash, last_seen_at, revoked_at)
notification_deliveries(id, device_id, reading_key, scheduled_for,
  status, provider_message_id, created_at)
```

Restricciones sugeridas:

- Una preferencia por usuario.
- Token o identidad de dispositivo única por usuario/Android.
- Todos los dispositivos activos de un usuario usarán la misma `local_time` y `timezone` del perfil.
- Dedupe por dispositivo, `reading_key` y periodo de envío.
- Nunca guardar tokens en logs.

## Contratos

- `GET/PATCH /api/notification-preferences`.
- `POST /api/push/register` y `POST /api/push/unregister`.
- `POST /api/notifications/dispatch` solo para scheduler autenticado.
- Deep links con fecha/mode/reading validados por la ruta Daily.
- La PWA no registra dispositivos push ni solicita permisos de notificación en la primera fase.
- Cambiar `timezone` recalcula inmediatamente las entregas pendientes del usuario.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| PWA primero | Ya existe manifest y permite validar UX con menor costo | Empezar por dos apps nativas antes de estabilizar APIs |
| Push solo en Android posterior | Reduce alcance inicial y permite estabilizar contratos | Implementar push PWA y Android simultáneamente |
| Zona horaria IANA por usuario | Maneja viajes y horario de verano | Guardar solo offset, como `-03:00` |
| Scheduler server-side | La lectura y el cambio dominical son datos del servidor | Depender solo de timers locales del navegador |
| Registro de entregas idempotente | Evita duplicados y permite diagnosticar | Reintentos sin identidad de entrega |
| Cliente nativo contra API | Mantiene una sola frontera de autorización | Dar acceso directo a la base de datos |
| Android nativo Kotlin/Compose | Ajusta el alcance a Android y facilita push/deep links | Añadir una capa multiplataforma sin requerimiento iOS |

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| Responsive/PWA | RF-1, RF-2 |
| Preferencias y dispositivos | RF-3, RF-4, RF-6 |
| Scheduler y entregas | RF-5, RF-8, RF-9 |
| Deep links | RF-7, RF-9 |

## Estrategia de tests

- Tests responsive y manuales en viewport móvil.
- Unitarios para zona horaria, hora local y resolución de lectura.
- Integración para permisos, registro/revocación y aislamiento de dispositivos.
- Tests de deduplicación, reintentos, tokens inválidos y scheduler.
- Tests para múltiples dispositivos con una preferencia común, cambio inmediato de zona horaria y compatibilidad Android 10+.
- Pruebas de instalación y paridad en PWA; después smoke tests y push en Android.

## Riesgos, migración y rollback

- Riesgo: comportamiento desigual de push entre navegadores y plataformas. Mitigación: matriz de soporte y fallback sin notificación.
- Riesgo: duplicados por cron/reintento. Mitigación: clave idempotente y registro de entregas.
- Rollback: desactivar dispatch, mantener preferencias y conservar acceso manual a Daily.
