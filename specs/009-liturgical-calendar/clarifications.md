# Clarificaciones — Spec 009

Estado: Resolved — decisiones de alcance registradas el 2026-09-14 y ampliaciones de santos, fuente secundaria y nombres de `santos.html` aprobadas el 2026-09-15; pendiente revisión humana del documento completo

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
- **Fuentes:** se mantiene la selección chilena basada en Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile. Vatican News se incorpora únicamente como fuente secundaria informativa enlazada.
- **Metadata incompleta:** si las lecturas son válidas pero falta un dato litúrgico opcional, Daily continúa disponible y comunica la ausencia sin inventar un reemplazo.
- **Calendario mensual:** la cuadrícula muestra resúmenes, no lecturas completas; la selección siempre enlaza a una fecha explícita de Daily.
- **Fechas:** la regla de sábado 15:00 solo afecta al modo dominical existente. Una fecha seleccionada explícitamente permanece fija.
- **Sin autenticación:** el calendario y sus metadatos son públicos; no se persisten preferencias ni historial como parte de esta spec.
- **No directorio de santos:** no se crea una base de biografías ni una navegación por santo en esta fase.

## Ampliación aprobada: santos del día

- **Contenido:** se mostrarán únicamente nombres de santos respaldados por una fuente HTTP(S) verificada. No se generarán, traducirán ni completarán nombres ausentes.
- **Superficies:** Daily tendrá una sección compacta “Santos del día” dentro del contexto litúrgico. La cuadrícula mensual mostrará los nombres como resumen breve cuando existan, sin cambiar la navegación principal del home.
- **Orden y duplicados:** la lista conservará el orden editorial de las celebraciones y sus santos. Duplicados dentro de la entrada completa se rechazarán durante la validación, no se eliminarán silenciosamente.
- **Presentación:** se mostrarán nombres, no biografías ni descripciones copiadas. Daily podrá mostrar un enlace externo atribuido por cada santo que tenga una página específica de Vatican News cotejada editorialmente; la cuadrícula mensual conservará solo nombres. Si no hay santos verificados o no existe un enlace secundario válido, no habrá placeholder ni enlace roto; se conservará la indicación discreta de metadata no disponible de RF-9.
- **Contrato compartido:** `/api/readings`, `/api/calendar`, PWA y Android recibirán la misma lista pública de nombres, sin duplicar reglas ni inferir santos en los clientes.
- **Accesibilidad y densidad:** Daily priorizará la lectura completa; el calendario limitará visualmente la altura del resumen, manteniendo una etiqueta accesible y el enlace al detalle.

## Ampliación aprobada: fuente secundaria de santos

- **Autoridad:** el Ordo de la Conferencia Episcopal de Chile conserva la autoridad para seleccionar la celebración y el nombre publicado. Vatican News solo aporta información adicional para consulta.
- **Modelo:** cada santo podrá incluir `informationSource`, separado de `source`. `source` identifica la procedencia litúrgica del nombre; `informationSource` identifica una URL secundaria de Vatican News revisada por el mantenedor.
- **Verificación:** `informationSource` exige proveedor, URL HTTP(S), `verified: true` y correspondencia exacta con el santo o la fecha. No se inferirán URLs por nombre, se usarán páginas genéricas como sustituto ni se publicará el enlace si la revisión editorial no puede demostrar la coincidencia.
- **Contenido y derechos:** Rhemapp almacenará únicamente proveedor, URL, estado de verificación y atribución. No descargará, copiará, resumirá ni renderizará biografías o descripciones de Vatican News, cuyo contenido conserva sus condiciones de uso.
- **Superficies:** Daily web/PWA mostrará “Más información en Vatican News” con nombre accesible del santo; Android recibirá y podrá abrir la misma URL desde el contexto del día. El calendario mensual no mostrará estos enlaces para preservar densidad y rendimiento.
- **Disponibilidad:** el enlace es una referencia editorial estática; una caída posterior de Vatican News no debe bloquear la lectura. El mantenedor podrá retirarlo o marcarlo no verificado en una nueva publicación.

## Impacto

- Spec: la celebración pasa a ser una colección estructurada y la vista mensual se convierte en una lectura resumida del mismo dominio.
- Plan: `readings[]`, el resolvedor temporal y el sincronizador deben compartir una única normalización y una única fuente editorial.
- Tareas: antes de implementar se debe registrar la atribución y condición de uso del enlace secundario, sin incorporar el texto descriptivo externo, y actualizar la documentación de operación de contenido.
- Impacto de la ampliación: se debe validar la lista de santos y sus fuentes secundarias en la entrada publicada, extender fixtures y pruebas de ausencia/duplicado/fuente no verificada/URL no coincidente, y actualizar la evidencia RF-13 y RF-14 antes de cerrar la implementación.

## Ampliación aprobada: nombres de `santos.html`

- **Fuente:** `https://www.vaticannews.va/es/santos.html` aporta la lista que Vatican News muestra para una fecha concreta. El Ordo continúa siendo la autoridad para la celebración y los santos litúrgicos publicados por Rhemapp.
- **Modelo:** cada entrada puede incluir `supplementalSaints[]`, con `name` y `source`. La lista representa una captura editorial fechada de Vatican News y no se mezcla silenciosamente con `celebrations[].saints[]`.
- **Contenido:** solo se conservará el nombre limpio y no ambiguo de cada elemento. Se eliminarán del campo publicado las reseñas, titulares, cargos, fechas y cualquier otro texto biográfico.
- **Verificación:** la captura debe corresponder a `entry.date`, conservar URL, proveedor, atribución y `verified: true`, y mantener el orden visible de la página. Si el nombre no puede separarse de un título biográfico con seguridad, se omite.
- **Superficie:** Daily web mostrará una lista separada “También mencionados por Vatican News” con nombres únicamente. La cuadrícula mensual, el resumen litúrgico del Ordo y los enlaces individuales de RF-14 no se sustituyen por esta lista.
- **Disponibilidad:** la lista se publica desde datos locales versionados; no se consulta ni se raspa Vatican News durante la petición del usuario. Una captura ausente o inválida no afecta las lecturas ni los santos del Ordo.
- **Captura inicial:** para el 2026-09-15 se verificaron los nombres “Santísima Virgen de los Dolores”, “Nicomedes” y “Catalina de Génova” en la página diaria; no se incorporan sus párrafos descriptivos.

## Refinamiento aprobado: presentación minimalista de santos

- **Objetivo:** la parte visible de santos debe permitir identificar los nombres de un vistazo, con la menor carga visual posible.
- **Presentación:** `Santos del día` y `También mencionados por Vatican News` seguirán siendo listas separadas para no mezclar la autoridad del Ordo con la captura secundaria, pero cada bloque mostrará únicamente una lista vertical simple de nombres.
- **Limpieza visual:** se eliminan del bloque visible de nombres las tarjetas, píldoras, separadores, distribución en varias columnas y enlaces de información. No se cambia el contenido, el orden ni la provenance.
- **Enlaces RF-14:** los enlaces específicos ya verificados no se eliminan del contrato ni de Android; en Daily web se trasladan al disclosure existente `Fuente y verificación`, para conservar la funcionalidad sin competir con la lista de nombres.
- **Accesibilidad:** cada lista mantiene un encabezado accesible y elementos `li` semánticos. El disclosure conserva foco de teclado y nombres de enlace comprensibles.
