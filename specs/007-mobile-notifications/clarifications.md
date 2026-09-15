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
- **Atribución del Rosario:** la sección accesible de fuente y traducción se ubica después de la lista completa de misterios.
- **Navegación de Daily:** los controles anterior/siguiente recorren fechas contiguas mediante `date=YYYY-MM-DD`; al navegar se abandona el modo implícito de hoy, no se activa la vista dominical anticipada y la fecha mínima publicada permanece protegida.
- **Google en Android:** el acceso usa el selector nativo de Credential Manager para obtener un ID token; Rhemapp lo envía a un endpoint server-side que llama `signInWithIdToken` de Supabase y devuelve el contrato de sesión móvil existente. La app no guarda tokens de Google. El proyecto requiere el proveedor Google habilitado en Supabase y un Web Client ID por entorno; cancelar, proveedor no configurado o token inválido dejan la sesión sin autenticar y muestran un mensaje accionable en español.

## Impacto

- Plan: construir primero paridad móvil como PWA y contratos API; después crear la app Android y el push. No se crearán credenciales de tiendas nativas durante la fase PWA.
- Tareas: plataforma, hora, periodicidad, zona horaria, activación, contenido del aviso, tecnología Android, dispositivos, compatibilidad mínima y jerarquía responsive del header quedan definidos.
- Tareas: RF-10 y RF-11 agregan el orden final de atribución del Rosario y la navegación explícita por fecha de Daily.
- Tareas: RF-12 agrega el acceso nativo con Google en Android, la validación server-side del ID token y la configuración de OAuth por entorno.
