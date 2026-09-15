# Tareas — Spec 008

- [x] T1. Documentar la spec y las decisiones aprobadas para el selector de tres estados. RF: RF-1…RF-8. Hecho cuando: `spec.md`, `clarifications.md` y `plan.md` describen el alcance, las decisiones, los contratos y la estrategia de verificación.
- [x] T2. Crear la lógica de dominio de preferencias y sus pruebas unitarias. RF: RF-2, RF-3, RF-4, RF-7. Hecho cuando: los tres valores, el default, la migración heredada y la resolución efectiva se validan sin dependencias de navegador.
- [x] T3. Persistir la preferencia en perfiles y proteger el contrato de API. RF: RF-5, RF-7. Hecho cuando: la migración aplicada agrega `theme_preference`, la API valida/lee/escribe el campo y las pruebas de perfil pasan.
- [x] T4. Actualizar `ThemeProvider` y la inicialización SSR/client para aplicar y sincronizar los tres estados. RF: RF-2…RF-7. Hecho cuando: la selección es inmediata, el modo sistema reacciona a cambios del dispositivo, se recupera la preferencia remota y los fallos conservan el valor local.
- [x] T5. Reemplazar el botón por un selector accesible y responsive compartido. RF: RF-1, RF-8. Hecho cuando: desktop y móvil muestran tres radios en español, el radio seleccionado representa la preferencia y teclado/foco/error son usables.
- [x] T6. Ejecutar verificación final y completar la validación RF por RF. RF: RF-1…RF-8. Hecho cuando: pruebas relevantes, lint y build pasan; la verificación manual desktop/mobile queda registrada en `validation.md` y se emite un veredicto.
