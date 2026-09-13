# Clarificaciones — Spec 007

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- Ya existe un manifest PWA básico, pero no existe todavía push, registro de dispositivos ni scheduler.
- “App de teléfono” puede significar PWA instalable o aplicación nativa; las tareas y costos son distintos.
- Una notificación confiable requiere guardar zona horaria, manejar tokens inválidos y evitar duplicados.
- La hora personalizada debe definirse con una zona horaria IANA para no depender del offset fijo.

## Decisiones aprobadas

- La primera entrega móvil será una PWA instalable y responsive; después de estabilizarla se implementará una app Android.
- Las notificaciones push se incluirán en Android y no en la PWA inicial.
- La configuración predeterminada será 08:00 todos los días, desactivada hasta activación explícita del usuario.
- La hora usará la zona IANA local detectada y editable del usuario.
- La notificación abrirá la lectura diaria vigente, no la lectura dominical anticipada.
- La app Android será nativa con Kotlin y Jetpack Compose.
- Todos los dispositivos Android activos usarán la misma hora y zona horaria del perfil del usuario.
- Los cambios de zona horaria se aplicarán inmediatamente a los próximos avisos y recalcularán la programación pendiente.
- La versión mínima de Android será Android 10 (API 29).

## Impacto

- Plan: construir primero paridad móvil como PWA y contratos API; después crear la app Android y el push. No se crearán credenciales de tiendas nativas durante la fase PWA.
- Tareas: plataforma, hora, periodicidad, zona horaria, activación, contenido del aviso, tecnología Android, dispositivos y compatibilidad mínima quedan definidos.
