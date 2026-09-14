# Validación — Spec 004

Estado: Validada localmente — revisión SQL de Supabase pendiente de ejecutar en un entorno con Docker o Podman

| RF | Test o evidencia | Resultado | Observaciones |
|---|---|---|---|
| RF-1 | `scripts/test-sharing.mjs`: URLs públicas deterministas para lectura litúrgica, versículo aleatorio y pasaje; verificación SSR de `/share` | Verificado | El query solo contiene identificadores públicos y no datos privados. |
| RF-2 | `scripts/test-sharing-ui.mjs`; prueba manual en `/random` con navegador móvil | Verificado | Web Share se ofrece cuando existe; el fallback usa portapapeles y muestra un enlace seleccionable si el permiso falla. |
| RF-3 | SSR manual de `/share?type=liturgical-reading&mode=date&date=2026-09-10&calendar=chile&readingType=gospel` y `/share?type=random-verse&mode=random&verseId=PSA.23.1` | Verificado | El HTML incluye título, referencia y fuente sin depender de JavaScript. |
| RF-4 | Tests de parser/token, estado inválido SSR, `ShareUnavailableError`, revocación y rate limit | Verificado | Los errores públicos son genéricos; no incluyen hash, token, usuario ni detalles de Supabase. |
| RF-5 | Test de servicio con usuario A/B, allowlist `PUBLIC_RESOURCE_FIELDS`, migración y `reading_shares_rls_test.sql` | Verificado localmente | El test pgTAP está preparado; su ejecución contra Postgres local queda pendiente por falta de Docker/Podman. |
| RF-6 | Test de servicio: B no revoca el share de A y un token revocado no resuelve | Verificado | La revocación filtra por propietario y solo permite actualizar `revoked_at`. |
| RF-7 | `generateMetadata` en `/share` y `/share/[token]`, build de Next y títulos SSR | Verificado | Metadata social usa referencia/título, descripción en español y no incluye texto bíblico no autorizado. |
| RF-8 | FK `owner_user_id ... on delete cascade`, resolver allowlisted y documentación operativa | Verificado por contrato | La eliminación de cuenta propaga la eliminación de shares; falta ejecutar la migración en una base Supabase real. |

## Veredicto

### Cómo probarlo

Requisitos: Node.js, dependencias instaladas y las variables no secretas de `.env.example`; `BIBLE_API_KEY` solo es necesaria para resolver enlaces públicos de pasajes completos. Para la prueba SQL se requiere Docker o Podman.

```bash
npm run test:sharing
npm run lint
npm run build
npx supabase test db --local
```

Resultado local: los tres primeros comandos pasan; el último no inicia porque este entorno no tiene `docker` ni `podman` en `PATH`. La prueba manual abre los dos enlaces SSR anteriores, revisa la metadata/título y, en `/random`, pulsa `Compartir lectura`; el navegador muestra el flujo nativo o el estado español del fallback.

`SPEC CUMPLIDA` — implementación, pruebas de aplicación, metadata y verificación responsive completadas; queda como acción operativa ejecutar el test pgTAP contra una base local o enlazada con Docker/Podman.
