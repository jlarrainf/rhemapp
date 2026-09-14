# Clarificaciones — Spec 007

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- Ya existe un manifest PWA básico, pero no existe todavía push, registro de dispositivos ni scheduler.
- “App de teléfono” puede significar PWA instalable o aplicación nativa; las tareas y costos son distintos.
- Una notificación confiable requiere guardar zona horaria, manejar tokens inválidos y evitar duplicados.
- La hora personalizada debe definirse con una zona horaria IANA para no depender del offset fijo.
- La navegación actual presenta demasiadas opciones al mismo nivel y necesita una jerarquía más clara sin ocultar funciones existentes.

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
- **Jerarquía del header:** el logo de Rhemapp conduce al inicio; en escritorio solo quedan visibles Versículos aleatorios, Lectura del día y Misterios del Rosario. Biblioteca, sugerencias, perfil, autenticación y tema se agrupan en un menú de Perfil y más. En móvil, el menú hamburguesa conserva esa separación.
- **Accesibilidad del menú:** el control de perfil expone su estado con `aria-expanded`, tiene foco visible, cierra con Escape y al pulsar fuera, y permite recorrer enlaces y acciones con teclado.

## Impacto

- Plan: construir primero paridad móvil como PWA y contratos API; después crear la app Android y el push. No se crearán credenciales de tiendas nativas durante la fase PWA.
- Tareas: plataforma, hora, periodicidad, zona horaria, activación, contenido del aviso, tecnología Android, dispositivos, compatibilidad mínima y jerarquía responsive del header quedan definidos.
