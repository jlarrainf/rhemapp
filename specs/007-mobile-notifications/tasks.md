# Tareas — Spec 007

## Fase 0 — Plataforma y soporte

- [ ] T1 — Definir entrega escalonada: PWA primero y Android después.
  - RF: RF-1, RF-2
  - Hecho cuando: la PWA sin push y la fase Android con push quedan separadas en alcance, dependencias y matriz de soporte.
- [ ] T2 — Definir hora predeterminada, zona horaria y frecuencia.
  - RF: RF-4, RF-5, RF-9
  - Hecho cuando: 08:00 diario, activación explícita, zona local IANA y contenido diario están documentados.
- [ ] T3 — Definir modelo de dispositivos, privacidad y deduplicación.
  - RF: RF-3, RF-6, RF-8
  - Hecho cuando: Android 10+, múltiples dispositivos con preferencia común, restricciones, retención y reintentos están aprobados.

## Fase 1 — Paridad móvil

- [x] T4 — Auditar y corregir layout responsive de las rutas existentes y jerarquía del header.
  - RF: RF-1
  - Hecho cuando: Daily, Random, Rosario y navegación funcionan en viewport móvil; el logo conduce al inicio, solo se muestran las tres rutas principales en escritorio y las opciones secundarias están agrupadas bajo Perfil y más con cierre accesible.
  - Estado actual: COMPLETADA. `Navbar` y `ProfileMenu` implementan la jerarquía aprobada; el test de auth UI cubre los enlaces, el logo, el agrupamiento y el cierre con Escape/fuera del menú.
  - Archivos: `src/components/Navbar.jsx`, `src/components/ProfileMenu.jsx`, `src/components/AuthActions.jsx`, `scripts/test-auth-ui.mjs`.
  - Evidencia: `npm run test:auth` (55/55), `npm run lint`, `npm run build` y verificación manual en `http://127.0.0.1:3001/daily`.
  - Cómo probarlo: abrir `/daily`, confirmar las tres rutas visibles, abrir `Perfil`, comprobar sus opciones y pulsar Escape; el foco vuelve al botón `Perfil`.
- [ ] T5 — Completar manifest, iconos y metadata de instalación.
  - RF: RF-2
  - Hecho cuando: PWA instalable muestra identidad y tema correctos.
- [ ] T6 — Verificar que los contratos de auth, lecturas, guardados y compartir funcionan en móvil.
  - RF: RF-1, RF-7
  - Hecho cuando: existe smoke test de los flujos aprobados.

- [ ] T6A — Preparar la base de la app Android nativa con Kotlin y Jetpack Compose.
  - RF: RF-1, RF-7
  - Hecho cuando: el cliente Android 10+ puede autenticarse, consumir un contrato de lectura y abrir un deep link sin duplicar reglas de dominio.

## Fase 2 — App Android, preferencias y push

- [ ] T7 — Crear migraciones de preferencias, dispositivos y entregas.
  - RF: RF-3, RF-4, RF-8
  - Hecho cuando: índices de dedupe y políticas de acceso están verificadas.
- [ ] T8 — Implementar configuración de hora, zona y activación.
  - RF: RF-4, RF-6
  - Hecho cuando: el usuario puede guardar, cambiar y desactivar preferencias.
- [ ] T9 — Implementar registro y revocación de dispositivos.
  - RF: RF-3, RF-6, RF-8
  - Hecho cuando: tokens inválidos se revocan sin exponerlos.
- [ ] T10 — Implementar scheduler y resolución de lectura.
  - RF: RF-5, RF-9
  - Hecho cuando: se calcula una entrega correcta según zona y lectura vigente.
- [ ] T11 — Implementar deduplicación, reintentos y registro de entrega.
  - RF: RF-5, RF-8
  - Hecho cuando: un reintento no duplica el aviso y queda trazabilidad técnica.
- [ ] T12 — Implementar deep link desde la notificación.
  - RF: RF-7, RF-9
  - Hecho cuando: app abierta o cerrada llega a la lectura correcta.

## Fase final — Verificación

- [ ] T13 — Ejecutar matriz de navegadores, PWA, Android y permisos.
  - RF: RF-1 a RF-9
  - Hecho cuando: las limitaciones de soporte están documentadas y no bloquean lectura manual.
- [ ] T14 — Completar `validation.md`.
  - RF: RF-1 a RF-9
  - Hecho cuando: pasan tests, lint, build y scheduler de prueba.
