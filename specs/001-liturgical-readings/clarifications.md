# Clarificaciones — Spec 001

Estado: Resolved — T1 completada; pendiente de implementación

## Hallazgos de QA

- El repositorio actual modela `entry.gospel`, pero la funcionalidad necesita una colección ordenada de lecturas opcionales.
- “Lectura del domingo” no define explícitamente qué domingo corresponde entre lunes y sábado antes del cambio.
- El cambio de sábado a las 15:00 necesita una fuente temporal única en `America/Santiago`.
- El texto completo y sus licencias deben confirmarse antes de ampliar la sincronización.
- El rango de fechas consultables no está definido.

## Decisiones aprobadas

- **Regla dominical:** de lunes a viernes se muestra el próximo domingo; el sábado antes de las 15:00 se muestra el domingo anterior; desde el sábado a las 15:00 se muestra el próximo domingo; el domingo se muestra el domingo actual.
- **Traducción provisional:** se mantiene la traducción actualmente configurada en API.Bible: Bible ID `b32b9d1b64b4ef29-01`, `The Holy Bible in Simple Spanish` (`spabes`), español, dominio público CC0. El ID configurado no es Reina-Valera 1960.
- **Fechas consultables:** se permite cualquier fecha desde `2025-01-01` en adelante que tenga una lectura publicada, incluyendo fechas futuras.
- **Fecha seleccionada:** permanece fija al pasar medianoche. Solo el modo “Hoy” se actualiza automáticamente.
- **Fuente editorial:** se confirma el calendario chileno basado en Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile.
- **Fechas futuras incompletas:** no se publica ninguna lectura de una fecha futura mientras falte una lectura o verificación; la interfaz muestra “Lectura aún no disponible”.
- **Traducción provisional:** `b32b9d1b64b4ef29-01` se aplica temporalmente a todas las clases de lectura, sujeto a la verificación editorial de cada entrada.
- **Fuente no disponible:** se conserva y se muestra la última versión verificada; no se sobrescriben datos válidos con datos incompletos, se marca la posible desactualización y se registra un error accionable para revisión administrativa.
- **Aviso de traducción:** mientras se use la traducción provisional configurada, la interfaz mostrará un aviso visible pero discreto y la atribución de API.Bible y de la fuente bíblica cuando corresponda.
- **Resultado de T1:** los metadatos consultados mediante `https://rest.api.bible` confirman la identidad, abreviación, idioma y copyright CC0 del Bible ID configurado. La consulta usó la credencial local sin incorporarla a ningún archivo rastreable, interfaz o log.
- **Plan verificado:** el panel de la aplicación muestra `LEGACY DEFAULT PLAN` a `$0 / month`; la tabla indica que el uso comercial está permitido en planes Pro. El alcance actual no incluye monetización; monetizar requerirá revisar y actualizar el plan/licencia antes de publicar ese cambio.
- **Requisito de licencia:** antes de usar o ampliar el contenido se debe registrar la traducción exacta, el copyright, el plan/licencia aplicable, el texto de atribución, las reglas de caché y cualquier requisito del titular.
- **Requisitos API.Bible verificados:** se debe revisar el metadato de copyright/licencia de cada Bible ID, conservar la integridad del texto, mostrar la atribución junto al contenido y mantener una página de copyright enlazada. El contenido cacheado debe actualizarse dentro de 30 días como máximo; cualquier uso comercial requiere el plan/licencia correspondiente.

## Impacto

- Spec: RF-6, RF-7, RF-10, RF-11 y la operación ante fallos de sincronización quedan definidos. T1 queda completada con la identidad, copyright y plan verificados del Bible ID configurado.
- Plan: el resolvedor dominical y el proveedor de contenido deben permanecer desacoplados; la sincronización debe usar una actualización segura con conservación de la última versión válida.
- Tareas: el rango, la fuente, el gating de verificación, el estado de error de sincronización, el aviso de traducción y el gate comercial están definidos; T1 puede marcarse como completada.

## Decisiones futuras no bloqueantes

- La elección de una traducción católica definitiva o de Reina-Valera 1960 queda para una futura revisión editorial. Si cambia el Bible ID, se debe repetir T1 y verificar nuevamente identidad, copyright, licencia, atribución y caché.
