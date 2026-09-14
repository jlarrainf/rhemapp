# Plan técnico — Spec 004

Estado: Implemented — clarificaciones resueltas; implementación verificada localmente

## Alcance técnico

Implementar sharing como una capacidad de presentación, no como una copia libre de contenido. Las lecturas públicas se resuelven con URL canónica; los contenidos privados se representan con registros revocables y tokens opacos.

## Arquitectura y módulos

- `src/lib/sharing/`: construcción, validación y clasificación de URLs.
- `src/app/share/[token]/page.js`: página pública server-rendered para shares privados.
- Metadata dinámica para enlaces públicos y privados.
- Componente de share con Web Share API y portapapeles.
- `shares(id, token_hash, owner_user_id, resource_type, resource_id, revoked_at, expires_at, created_at)`.
- Rate limit y logging de errores sin registrar tokens completos.

La tabla `shares` vivirá en Supabase con RLS: el propietario podrá crear/revocar sus registros y el resolver público solo devolverá un payload explícitamente allowlisted para tokens válidos, no revocados y, en la primera versión, sin expiración automática. Los shares privados solo se crearán autenticadamente; abrirlos será público.

## Contratos

- `POST /api/shares` crea un share privado autenticado.
- `DELETE /api/shares/:id` revoca un share propio.
- `GET /share/:token` resuelve solo contenido publicado/no revocado.
- Las URLs públicas cubren lecturas litúrgicas, versículos aleatorios y pasajes completos publicados. Un share privado usa token opaco y nunca incluye grupos, notas ni identidad.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| URL canónica para contenido público | No crea registros ni expone identidad | Token para cada lectura pública |
| Hash del token en persistencia | Si se filtra la base, el link original no queda directamente utilizable | Guardar token en claro |
| Web Share con fallback clipboard | Cubre móvil y desktop | Exigir soporte de Web Share |
| Página server-rendered | Mejora preview social y carga del enlace | Resolver todo tras hidratación |

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| Constructor de URLs públicas | RF-1, RF-3, RF-7 |
| Share privado y políticas | RF-4, RF-5, RF-6, RF-8 |
| Componente de interacción | RF-2 |
| Rate limit y seguridad | RF-4, RF-5 |

## Estrategia de tests

- Unitarios para URLs, tokenización y expiración.
- Integración para crear, abrir y revocar.
- Tests de propiedad entre usuarios.
- Manuales en navegador móvil, desktop y navegador sin Web Share.
- Verificación de metadata sin JavaScript.

## Riesgos, migración y rollback

- Riesgo: publicar accidentalmente un recurso privado. Mitigación: allowlist explícita de campos y tests de snapshot de respuesta.
- Riesgo: abuso del endpoint. Mitigación: rate limit antes del lanzamiento.
- Rollback: deshabilitar creación de shares privados sin eliminar enlaces existentes hasta definir la comunicación.
