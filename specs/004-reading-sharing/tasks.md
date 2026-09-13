# Tareas — Spec 004

## Fase 0 — Contrato

- [ ] T1 — Confirmar contenido compartible, expiración y requisito de cuenta.
  - RF: RF-1, RF-5, RF-6
  - Hecho cuando: las políticas públicas y privadas están aprobadas.
- [ ] T2 — Definir URL canónica y payload mínimo compartido.
  - RF: RF-1, RF-3, RF-7
  - Hecho cuando: fixtures de URL pública y privada no contienen datos privados.

## Fase 1 — Enlaces

- [ ] T3 — Implementar constructor/validador de URLs públicas.
  - RF: RF-1, RF-3
  - Hecho cuando: fechas, modos y tipos inválidos son rechazados.
- [ ] T4 — Crear tabla y política de tokens privados.
  - RF: RF-5, RF-6
  - Hecho cuando: el token es opaco, se almacena como hash y tiene propietario.
- [ ] T5 — Implementar crear, resolver y revocar shares privados.
  - RF: RF-4, RF-5, RF-6
  - Hecho cuando: solo el propietario revoca y un token revocado no muestra datos.
- [ ] T6 — Añadir rate limit y errores públicos seguros.
  - RF: RF-4, RF-5
  - Hecho cuando: abuso y tokens manipulados no filtran detalles internos.

## Fase 2 — UI y metadata

- [ ] T7 — Implementar botón Web Share y fallback de portapapeles.
  - RF: RF-2
  - Hecho cuando: ambos caminos muestran confirmación en español.
- [ ] T8 — Crear página y metadata de lectura compartida.
  - RF: RF-3, RF-7
  - Hecho cuando: un preview social y un navegador sin JS reciben contenido válido.

## Fase final — Verificación

- [ ] T9 — Probar privacidad, revocación y responsive.
  - RF: RF-3, RF-4, RF-5, RF-6
  - Hecho cuando: usuario A no puede ver contenido privado de usuario B.
- [ ] T10 — Completar `validation.md`.
  - RF: RF-1 a RF-7
  - Hecho cuando: pasan tests, lint, build y no queda RF sin evidencia.
