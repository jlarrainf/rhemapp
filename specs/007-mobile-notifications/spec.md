# Spec 007 — Mobile, PWA y notificaciones

Estado: Planned — clarificaciones resueltas; pendiente implementación
Prioridad: P2

## Contexto y objetivo

Rhemapp debe poder usarse cómodamente desde un teléfono con las mismas funciones principales de la web. La primera entrega será una PWA; después se implementará una app para Android con notificaciones de la nueva lectura del día a una hora elegida por el usuario. La estrategia debe evitar duplicar reglas de dominio entre clientes.

## Usuarios y actores

- Usuario móvil autenticado.
- Navegador/PWA instalado.
- Aplicación Android posterior a la PWA.
- Servicio de notificaciones push.
- Scheduler de Rhemapp.

## Historias de usuario

- H1: Como usuario de teléfono, quiero leer, guardar, compartir y usar Lectio desde una interfaz limpia.
- H2: Como usuario, quiero elegir a qué hora recibir la lectura nueva.
- H3: Como usuario, quiero activar o desactivar avisos y controlar permisos.
- H4: Como usuario, quiero tocar el aviso y abrir directamente la lectura correspondiente.

## Requisitos funcionales

- RF-1: CUANDO un usuario abre Rhemapp desde un teléfono, EL SISTEMA ofrece una interfaz responsive/PWA con las funciones aprobadas de las Specs 001–006; las notificaciones quedan reservadas para la fase Android.
- RF-2: CUANDO un usuario instala la PWA compatible, EL SISTEMA conserva nombre, icono, tema y navegación coherentes con la web; la PWA será la primera entrega móvil y la app nativa queda fuera de esta fase.
- RF-3: CUANDO un usuario de la app Android concede permiso para notificaciones, EL SISTEMA registra el dispositivo de forma segura y permite configurar una hora local; la PWA no registra dispositivos push en esta fase.
- RF-4: CUANDO un usuario de Android guarda una hora válida, EL SISTEMA persiste la hora, la zona horaria IANA y el estado habilitado.
- RF-5: CUANDO llega la hora configurada, EL SISTEMA envía desde la app Android como máximo un aviso diario para la lectura diaria vigente y lo enlaza con Daily.
- RF-6: CUANDO el usuario de Android desactiva avisos o revoca permisos, EL SISTEMA deja de programar nuevos envíos para ese dispositivo.
- RF-7: CUANDO el usuario abre un aviso Android, EL SISTEMA navega a la lectura correcta incluso si la aplicación estaba cerrada.
- RF-8: SI el dispositivo, token, scheduler o proveedor falla, ENTONCES EL SISTEMA registra el error técnico, limpia tokens inválidos y no duplica avisos innecesariamente.
- RF-9: EL SISTEMA respeta el cambio dominical de sábado a las 15:00 en `America/Santiago` al resolver enlaces y contenido de notificación.

## Requisitos no funcionales

- La interfaz móvil debe mantener accesibilidad, legibilidad y tema claro/oscuro.
- Las reglas de lectura son compartidas por web, PWA y app Android.
- Los tokens push se consideran datos sensibles operativos y se almacenan con acceso restringido.
- La programación debe ser tolerante a cambios de zona horaria y horario de verano.
- La aplicación no debe exigir notificaciones para leer el contenido.
- La PWA no solicita ni requiere permisos de notificaciones en la primera fase.

## Casos límite

- Usuario deniega permiso.
- Navegador no soporta push o PWA.
- Hora configurada durante un cambio de horario.
- Usuario viaja a otra zona horaria.
- Varios dispositivos con horas distintas.
- Token inválido o aplicación reinstalada.
- Scheduler reintenta y podría duplicar envío.
- Lectura aún no validada al momento del aviso.
- App cerrada y deep link sin sesión vigente.

## Fuera de alcance

- Wearables, escritorio y TV.
- Notificaciones de cada sugerencia editorial.
- Chat o funciones sociales móviles nuevas.
- Publicación en tiendas en la primera subfase si no se aprueba app nativa.

## Criterios de finalización

- La PWA es instalable y usable en tamaños móviles principales.
- Las funciones web aprobadas funcionan en móvil sin duplicar lógica.
- Usuario puede configurar, cambiar y desactivar la hora.
- Un aviso abre la lectura correcta y no se duplica por reintentos.
- Existen pruebas de permisos, zona horaria, scheduler y deep links.

## Decisiones confirmadas

- Después de estabilizar la PWA se implementará una app Android; las notificaciones push pertenecen a esa fase y no a la PWA inicial.
- La hora predeterminada será 08:00, el aviso será diario y permanecerá desactivado hasta que el usuario lo active explícitamente.
- La hora se interpretará en la zona horaria local IANA del usuario, detectada automáticamente y editable.
- El aviso abrirá la lectura diaria vigente de ese día; no abrirá la lectura dominical anticipada del modo Domingo.
- La app Android se implementará de forma nativa con Kotlin y Jetpack Compose.
- Todos los dispositivos Android activos de un usuario recibirán el aviso usando la misma hora y zona horaria configuradas en su perfil.
- Un cambio de zona horaria se aplicará inmediatamente a los próximos avisos y recalculará la programación pendiente.
- La versión mínima soportada será Android 10 (API 29).
