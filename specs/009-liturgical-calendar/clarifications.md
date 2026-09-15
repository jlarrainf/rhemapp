# Clarificaciones — Spec 009

Estado: Resolved — decisiones de alcance registradas el 2026-09-14; pendiente revisión humana del documento completo

## Hallazgos de QA

- La entrada actual conserva `celebration` como texto y necesita metadata estructurada para distinguir fiestas, memorias y santos.
- Una fecha puede tener celebración principal y conmemoraciones opcionales; mostrar una sola etiqueta perdería información editorial.
- La cuadrícula mensual podría duplicar la lógica de Daily si resuelve fechas por separado.
- La ausencia de metadata opcional no debe ocultar lecturas bíblicas válidas.
- El contenido externo puede cambiar o no estar disponible durante una sincronización.
- El calendario chileno no debe inferirse desde la configuración regional del dispositivo.

## Decisiones aprobadas

- **Lugar de la información:** fiestas, santos y color se integran en Daily; la vista mensual se ofrece como una ruta secundaria enlazada desde Daily y Orar.
- **Navegación:** no se crea un enlace principal adicional llamado “Santos” o “Calendario”. La función se descubre desde “Calendario litúrgico”.
- **Celebraciones:** la primera celebración verificada es la principal; las memorias opcionales se muestran separadas y en el orden de la fuente.
- **Compatibilidad:** se conserva temporalmente el campo textual `celebration` como alias de lectura para consumidores antiguos; el nuevo código usa la colección estructurada.
- **Fuentes:** se mantiene la selección chilena basada en Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile.
- **Metadata incompleta:** si las lecturas son válidas pero falta un dato litúrgico opcional, Daily continúa disponible y comunica la ausencia sin inventar un reemplazo.
- **Calendario mensual:** la cuadrícula muestra resúmenes, no lecturas completas; la selección siempre enlaza a una fecha explícita de Daily.
- **Fechas:** la regla de sábado 15:00 solo afecta al modo dominical existente. Una fecha seleccionada explícitamente permanece fija.
- **Sin autenticación:** el calendario y sus metadatos son públicos; no se persisten preferencias ni historial como parte de esta spec.
- **No directorio de santos:** no se crea una base de biografías ni una navegación por santo en esta fase.

## Impacto

- Spec: la celebración pasa a ser una colección estructurada y la vista mensual se convierte en una lectura resumida del mismo dominio.
- Plan: `readings[]`, el resolvedor temporal y el sincronizador deben compartir una única normalización y una única fuente editorial.
- Tareas: antes de implementar se debe registrar la licencia/atribución de los campos descriptivos y actualizar la documentación de operación de contenido.
