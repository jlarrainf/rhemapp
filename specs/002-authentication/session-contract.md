# Contrato de sesión y usuario — Spec 002

Este contrato cubre T2 y sirve como frontera común para SSR, API y futuros clientes. No expone tokens de Supabase ni datos de proveedor.

## Sesión de visitante

```json
{
  "version": 1,
  "authenticated": false,
  "user": null,
  "role": null,
  "expiresAt": null
}
```

## Sesión autenticada

```json
{
  "version": 1,
  "authenticated": true,
  "user": {
    "id": "opaque-user-id",
    "displayName": "Nombre visible",
    "email": "persona@example.com",
    "avatarUrl": null,
    "locale": "es-CL",
    "timezone": "America/Santiago"
  },
  "role": "user",
  "expiresAt": "2026-09-13T20:00:00.000Z"
}
```

## Invariantes

- `version` es un entero estable y permite evolucionar el contrato sin interpretar respuestas de otra versión.
- `authenticated: false` siempre devuelve `user: null`, `role: null` y `expiresAt: null`.
- `role` solo puede ser `user`, `editor` o `admin`; se resolverá server-side desde `roles`, nunca desde `user_metadata`.
- `email` es de solo lectura para el perfil y no se devuelve en recursos de otras personas.
- `timezone` es una zona IANA editable; el valor inicial recomendado es `America/Santiago`.
- `avatarUrl` puede ser `null` y debe tratarse como una URL externa no confiable en la interfaz.
- La respuesta nunca incluye access tokens, refresh tokens, cookies, secretos, provider tokens ni `raw_user_meta_data`.
- Los endpoints privados usarán este contrato solo después de comprobar la sesión en servidor y las políticas RLS correspondientes.
