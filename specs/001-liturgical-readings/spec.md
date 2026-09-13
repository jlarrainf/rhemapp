# Spec 001 — Lecturas litúrgicas y Daily completo

Estado: Implemented and validated — T1–T17 completadas
Prioridad: P0

## Contexto y objetivo

La sección Daily actualmente muestra solo un extracto del Evangelio del día y obtiene la fecha vigente desde el calendario chileno. Esta spec convierte el dominio en una celebración con todas las lecturas disponibles, permite consultar fechas explícitas y añade una vista del domingo sin perder la trazabilidad de las fuentes.

## Usuarios y actores

- Visitante no autenticado.
- Editor o mantenedor de contenido litúrgico.
- Proceso de sincronización de lecturas.
- API externa de texto bíblico.

## Historias de usuario

- H1: Como visitante, quiero ver todas las lecturas del día en el orden litúrgico para leer la celebración completa.
- H2: Como visitante, quiero elegir una fecha en un calendario para consultar sus lecturas.
- H3: Como visitante, quiero cambiar entre la lectura diaria y la lectura dominical.
- H4: Como visitante, quiero abrir el pasaje completo de cada lectura cuando esté disponible.
- H5: Como mantenedor, quiero validar las lecturas y sus fuentes antes de publicarlas.

## Requisitos funcionales

- RF-1: CUANDO un visitante abre Daily sin fecha ni modo, EL SISTEMA muestra la celebración correspondiente a la fecha actual en `America/Santiago`.
- RF-2: CUANDO un visitante selecciona una fecha válida, EL SISTEMA actualiza la URL con `YYYY-MM-DD` y muestra la celebración de esa fecha sin desplazarla por la zona horaria del dispositivo.
- RF-3: CUANDO existe una celebración publicada, EL SISTEMA muestra sus lecturas en este orden: primera lectura, salmo, segunda lectura si existe y Evangelio.
- RF-4: SI una celebración no tiene segunda lectura, ENTONCES EL SISTEMA no muestra una tarjeta vacía ni inventa contenido.
- RF-5: CUANDO una lectura tiene `passageId` y rangos válidos, EL SISTEMA permite abrir el pasaje completo conservando la referencia y la atribución correspondiente.
- RF-6: CUANDO el visitante activa el modo domingo, EL SISTEMA resuelve una única celebración dominical mediante una regla centralizada de calendario.
- RF-7: CUANDO el reloj de `America/Santiago` pasa de sábado 14:59:59 a sábado 15:00:00, EL SISTEMA cambia el destino del modo domingo según la nueva celebración dominical.
- RF-8: SI falta una lectura obligatoria, una referencia, un identificador, un rango o una fuente verificada, ENTONCES la entrada no se publica como completa y el sistema registra un error accionable.
- RF-9: EL SISTEMA conserva la compatibilidad temporal del endpoint existente mientras migran sus consumidores al contrato genérico de lecturas.
- RF-10: CUANDO la sincronización obtiene datos nuevos, EL SISTEMA guarda la fuente, el momento de obtención y el estado de verificación sin sobrescribir datos válidos con datos incompletos; SI la fuente no está disponible, conserva la última versión verificada, marca el estado operativo y registra un error accionable.
- RF-11: MIENTRAS se utilice la traducción configurada como solución provisional, EL SISTEMA muestra un aviso visible pero discreto y la atribución correspondiente de la fuente bíblica cuando aplique.

## Requisitos no funcionales

- Las reglas de fecha y domingo deben ser funciones puras y testeables.
- La interfaz debe ser responsive, accesible por teclado y compatible con tema claro/oscuro.
- Las cadenas visibles, errores y estados de carga deben estar en español.
- Las API no deben exponer claves ni datos internos.
- Las rutas públicas deben conservar metadata y canonicales coherentes.
- El aviso de traducción provisional debe aparecer de forma consistente en las vistas que muestran texto bíblico, sin ocultar ni reemplazar el contenido.
- La validación debe ejecutarse en CI antes de publicar cambios de contenido.

## Casos límite

- Fecha sin archivo de año o fuera del rango publicado.
- Fecha inválida, futura o con parámetros manipulados.
- Sábado exactamente a las 14:59:59 y a las 15:00:00 en Chile.
- Cambio de horario oficial de Chile.
- Celebración con salmo o segunda lectura ausente.
- Datos duplicados o con campos corruptos.
- API.Bible no disponible, sin clave o con rangos discontinuos.
- Usuario con dispositivo en otra zona horaria.
- Navegador sin soporte para el calendario avanzado.

## Fuera de alcance

- Inicio de sesión y cuentas.
- Guardado, grupos y notas privadas.
- Enlaces públicos de compartir.
- Sugerencias editoriales desde usuarios.
- Generación con IA.
- Aplicación nativa y notificaciones push.

## Criterios de finalización

- Todas las entradas publicadas usan el modelo genérico y pasan `npm run validate:daily`.
- Existen tests para fecha actual, fecha seleccionada y las dos fronteras del sábado 15:00.
- La página muestra correctamente primera lectura, salmo, segunda lectura opcional y Evangelio.
- El pasaje completo funciona para los rangos soportados.
- `npm run lint` y `npm run build` pasan.
- La validación final recorre RF-1 a RF-11 con evidencia.

## Decisiones confirmadas

- El modo domingo muestra el próximo domingo de lunes a viernes, el domingo anterior el sábado antes de las 15:00, el próximo domingo desde el sábado a las 15:00 y el domingo actual durante el domingo.
- Se mantiene temporalmente la traducción configurada actualmente en API.Bible: Bible ID `b32b9d1b64b4ef29-01`, identificada por sus metadatos como `The Holy Bible in Simple Spanish` (`spabes`), idioma español y dominio público CC0.
- El Bible ID configurado no es Reina-Valera 1960. La selección futura de una traducción católica o de Reina-Valera 1960 requiere otro Bible ID autorizado y una nueva revisión editorial y de licencia.
- Se pueden consultar fechas desde `2025-01-01` en adelante, incluidas fechas futuras, siempre que tengan una lectura publicada.
- Una fecha seleccionada permanece fija aunque cambie el día; solo el modo “Hoy” sigue automáticamente la fecha actual de Chile.
- La fuente editorial de selección y verificación será el calendario chileno basado en Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile.
- Una fecha futura solo muestra contenido cuando todas sus lecturas están completas y verificadas; de lo contrario muestra “Lectura aún no disponible”.
- Mientras la traducción sea provisional, `b32b9d1b64b4ef29-01` se usará para primera lectura, salmo, segunda lectura y Evangelio, sujeto a las verificaciones de contenido de cada publicación.
- Si la fuente editorial externa no está disponible, se conserva y se muestra la última lectura verificada, sin publicar datos incompletos; el sistema marca la información como posiblemente desactualizada y registra el error para revisión administrativa.
- Mientras se use la traducción configurada provisionalmente, se mostrará un aviso discreto y la atribución correspondiente de API.Bible y de la fuente bíblica cuando aplique.

## Resultado de verificación de T1

- El Bible ID `b32b9d1b64b4ef29-01` fue consultado mediante el endpoint configurado de API.Bible (`https://rest.api.bible`) y sus metadatos devuelven `The Holy Bible in Simple Spanish`, abreviación `spabes`, idioma español y copyright `PUBLIC DOMAIN (not copyrighted). CC0`.
- El panel de la aplicación muestra `LEGACY DEFAULT PLAN` a `$0 / month`. El uso comercial aparece habilitado sólo en planes Pro; por ello la monetización queda fuera del alcance actual y será un gate explícito antes de cualquier uso comercial.
- API.Bible exige revisar la licencia/copyright de cada Bible ID, conservar la integridad del texto, atribuir la fuente según corresponda, mantener la página de copyright y actualizar el contenido cacheado dentro de 30 días como máximo. Estas reglas quedan incorporadas al plan de implementación.
- La credencial se guarda localmente en `.env.local`, que está ignorado por Git, y sólo se usa desde código servidor o scripts de sincronización. Nunca debe trasladarse a `NEXT_PUBLIC_*`, al navegador, a la documentación ni a la salida de logs.

## Dudas abiertas no bloqueantes

- La elección de una traducción católica definitiva para una futura fase editorial sigue pendiente. No bloquea la implementación mientras se conserve la traducción actualmente configurada y se respeten sus metadatos y condiciones de uso.
