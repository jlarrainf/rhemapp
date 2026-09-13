# Spec 004 — Compartir lecturas

Estado: Planned — clarificaciones resueltas; pendiente implementación
Prioridad: P1

## Contexto y objetivo

Compartir facilita que una lectura de Rhemapp llegue a otra persona mediante un enlace o las herramientas nativas del teléfono, sin exponer la cuenta del usuario ni convertir información privada en pública por accidente.

## Usuarios y actores

- Visitante que comparte una lectura pública.
- Usuario autenticado que comparte contenido guardado.
- Persona que abre un enlace compartido.
- Servicio de portapapeles o Web Share API.

## Historias de usuario

- H1: Como visitante, quiero compartir una lectura diaria mediante un enlace.
- H2: Como usuario, quiero usar el diálogo nativo de compartir del teléfono cuando exista.
- H3: Como persona receptora, quiero abrir el enlace y ver la lectura sin iniciar sesión.
- H4: Como usuario, quiero revocar un enlace asociado a contenido privado.

## Requisitos funcionales

- RF-1: CUANDO una persona pulsa compartir una lectura pública, EL SISTEMA genera un enlace canónico que identifica fecha, modo y tipo de lectura, incluyendo lecturas litúrgicas, versículos aleatorios y pasajes completos públicos, sin datos privados.
- RF-2: CUANDO el navegador soporta Web Share, EL SISTEMA ofrece el diálogo nativo; SI no, permite copiar el enlace al portapapeles.
- RF-3: CUANDO una persona abre un enlace público válido, EL SISTEMA muestra la lectura y su fuente sin exigir sesión.
- RF-4: SI el enlace es inválido, revocado o apunta a contenido no disponible, ENTONCES EL SISTEMA muestra un estado claro sin revelar información interna.
- RF-5: CUANDO un usuario autenticado comparte contenido privado o personalizado, EL SISTEMA usa un token público opaco y no expone usuario, grupo ni notas; abrir el enlace no exige autenticación.
- RF-6: CUANDO el propietario revoca un share privado, EL SISTEMA deja de mostrar su contenido.
- RF-7: EL SISTEMA genera metadata social coherente para una URL compartible.
- RF-8: CUANDO un usuario elimina su cuenta o revoca un enlace privado, EL SISTEMA deja de mostrar el contenido asociado; los enlaces públicos canónicos siguen sujetos a la publicación vigente.

## Requisitos no funcionales

- Los tokens no son secuenciales ni predecibles.
- El endpoint público tiene límites contra abuso.
- El contenido compartido conserva atribución y licencia.
- La interfaz funciona sin bloquearse si el portapapeles está denegado.

## Casos límite

- Web Share no disponible.
- Portapapeles denegado.
- Token manipulado o reutilizado.
- Lectura borrada o reemplazada después de compartir.
- Share revocado mientras alguien lo está viendo.
- Previsualizador social sin JavaScript.

## Fuera de alcance

- Compartir grupos completos.
- Comentarios sociales o seguidores.
- Analítica individual identificable de quien abre el link.
- Subir imágenes de tarjetas generadas.

## Criterios de finalización

- El enlace público funciona en desktop y móvil.
- Existe fallback de copiar enlace.
- Los links privados son revocables y no filtran datos.
- Metadata y atribución son correctas.
- Existen tests de token inválido, revocado, autorización y rate limit.

## Dudas abiertas
