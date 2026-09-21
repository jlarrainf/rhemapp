# Clarificaciones — Spec 009

Estado: Resolved for T52 — decisiones de alcance registradas el 2026-09-14 y ampliaciones aprobadas hasta el 2026-09-16; regla editorial del incidente resuelta el 2026-09-21; T53–T56 pendientes de implementación y verificación

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

## Ampliación aprobada: consulta diaria de Vatican News

- **Decisión:** la captura de `santos.html` se actualizará automáticamente una vez al día mediante el workflow server-side/CI del repositorio. No se hará una consulta desde el navegador ni durante el render de Daily.
- **Fecha canónica:** el job resolverá la fecha de trabajo con `America/Santiago`, aunque GitHub Actions programe el workflow en UTC. Una ejecución retrasada o repetida seguirá siendo segura e idempotente.
- **Extracción:** el parser aceptará únicamente la sección y los elementos de nombre que cumplan el contrato esperado de Vatican News. Validará que la página muestre la fecha solicitada, que existan nombres no vacíos, que no haya duplicados y que no se hayan capturado titulares, cargos, reseñas o párrafos biográficos.
- **Acceso a la fuente:** la portada `santos.html` funciona como selector y carga la página diaria de la misma fuente con la ruta `/es/santos/MM/DD.html`. El job podrá consultar esa representación fechada para evitar depender de JavaScript del navegador, pero la provenance pública seguirá identificando la página solicitada `santos.html`; si esta relación cambia, la captura se rechaza hasta revisar el parser.
- **Publicación:** solo después de una extracción válida se actualizará la entrada local correspondiente con `provider`, URL fija de `santos.html`, `verified: true`, atribución, `reviewedForDate` y `fetchedAt`. El JSON versionado será la fuente que leerán la web, PWA y Android.
- **Fallo seguro:** si la fuente no responde, la fecha no coincide, el HTML cambia o el job no puede publicar, no se reemplazará la entrada válida ni se reutilizarán nombres de otra fecha. Las lecturas y los santos del Ordo seguirán disponibles; el fallo quedará registrado en la ejecución del workflow.
- **Despliegue:** el job hará commit solo si cambió la captura y usará el flujo existente de `main` para que Vercel publique la nueva versión. No se necesitan nuevas variables de entorno ni secretos para consultar la URL pública.
- **Revisión humana:** la revisión humana se realiza sobre la spec, el parser, sus fixtures y las validaciones antes de habilitar el job; las capturas diarias que pasan el contrato determinista no requieren una aprobación manual repetitiva.

## Incidente operativo: regresión del formato de Vatican News — 2026-09-21

### Hallazgo reproducible

- Los runs `35503401236` (2026-09-20) y `35590502665` (2026-09-21) fallaron únicamente en `Actualizar nombres de santos de Vatican News`, después de que `Actualizar calendario 2026` terminara correctamente.
- El 2026-09-20 el parser rechazó `ss. Andrea Kim Taego˘n, sacerdote, y Pablo Chông Hasang y Compañeros, mártires coreanos` con `Ambiguous Vatican News saint name in heading 0`.
- El 2026-09-21 rechazó `s. Mateo, apóstol y evangelista` con `Ambiguous Vatican News saint descriptor at index 0`.
- La reproducción local en modo `--dry-run` devuelve ambos errores y no muta `public/data/daily-readings/2026.json`.
- El 2026-09-19 (`35435040835`) fue exitoso; la diferencia temporal confirma una regresión de compatibilidad con el formato publicado, no una falla general de credenciales o de instalación.

### Causa e impacto

El parser asumía que cada encabezado tendría un solo nombre y descriptores pertenecientes a un vocabulario cerrado. La fuente ahora publica encabezados con nombres compuestos, separadores coordinados, descriptores nuevos y caracteres Unicode válidos. El modo fail-closed evita publicar una inferencia incorrecta, pero el workflow ejecuta el paso opcional en serie: al fallar, salta validación y commit, por lo que tampoco publica cambios primarios válidos de esa ejecución.

### Decisiones de remediación aprobadas

- La captura secundaria seguirá siendo fail-closed por fecha: una captura ambigua no se publica, no borra la anterior y no reutiliza nombres de otro día.
- La sincronización primaria, su validación y su commit deben quedar aislados del resultado de Vatican News. Un fallo secundario debe dejar una advertencia visible y una salida operacional `partial` o equivalente, pero no convertir en fallido el camino de publicación primaria.
- El parser debe aceptar únicamente formatos demostrados por fixtures de fuente: descriptores ampliados, encabezados con varios nombres y Unicode válido. No se aceptará texto por descarte ni se normalizarán nombres de forma que cambie lo publicado por la fuente.
- La extracción debe conservar solo nombres explícitos y ordenados. Cada nombre o grupo explícito separado por la estructura editorial se publica como una entrada; `Pablo Chông Hasang y Compañeros` se conserva como un grupo único porque los compañeros no están individualmente nombrados.
- Los encabezados que representan una celebración litúrgica y no un nombre individual (`Fiesta de todos los santos`, `Conmemoración de todos los fieles difuntos`, `Presentación de la B. virgen María`) se omiten. Si una fecha no contiene nombres individuales después de omitirlos, la captura es válida con lista vacía y no se publica texto de celebración en `supplementalSaints`.
- Los alias parentéticos forman parte del nombre explícito y se conservan, siempre que los paréntesis estén balanceados.
- La corrección no requiere rotar `BIBLE_API_KEY`, cambiar Vercel ni modificar el contrato público de lecturas.

### Secuencia aprobable

1. Convertir los encabezados observados en fixtures mínimos con expectativas explícitas, usando la regla editorial aprobada para nombres y grupos.
2. Ajustar el contrato del parser, su normalización Unicode y sus pruebas, manteniendo rechazo seguro para casos no reconocidos.
3. Separar en GitHub Actions el resultado opcional de Vatican News del camino de validación/commit de la sincronización primaria.
4. Ejecutar pruebas locales y un `workflow_dispatch` controlado; comprobar que un fallo secundario conserva la captura anterior, que los cambios primarios válidos sí se publican y que el run deja una advertencia accionable.
5. Actualizar la documentación operativa y la validación RF por RF antes de cerrar el incidente.

## Refinamiento aprobado: contexto litúrgico colapsable y disponibilidad por fuente

- **Contenido principal:** el contexto litúrgico de Daily reunirá la fiesta o celebración principal, las celebraciones opcionales, el tiempo/color y las listas disponibles de santos y santas. No se agregará una tarjeta ni una superficie nueva.
- **Presentación:** todo el contexto se envolverá en un disclosure nativo “Contexto litúrgico”, cerrado por defecto. Su resumen será visible y tendrá foco de teclado; al abrirlo se conservará HTML semántico y listas verticales simples.
- **Tratamientos:** los nombres visibles de santos se mostrarán con “San” o “Santa” según el tratamiento editorial aplicable. Los nombres marianos o los nombres que ya traen un título equivalente conservarán ese título, y el dato de origen no se reescribirá.
- **Fuentes:** `Fuente y verificación` se moverá a una sección independiente posterior al contexto. La lista principal no mencionará proveedores, URLs, atribución ni enlaces; las fuentes primarias, secundarias y enlaces RF-14 quedarán dentro del disclosure posterior.
- **Disponibilidad:** la captura suplementaria válida de Vatican News cuenta como contexto disponible aunque todavía falte la celebración estructurada del Ordo. El mensaje de ausencia solo se permite cuando no hay celebración, santo, captura suplementaria, tiempo ni color verificables en las fuentes revisadas.
- **Accesibilidad y responsive:** el contexto estará cerrado inicialmente, será operable por teclado, tendrá un resumen identificable y conservará legibilidad en móvil; la sección de fuentes posterior mantendrá su foco y enlaces accesibles.

## Refinamiento aprobado: lista integrada de fiestas y santos

- **Una sola lista visible:** Daily reunirá en una única lista las fiestas/celebraciones del Ordo y todos los santos disponibles, incluidos los nombres de la captura de Vatican News. La separación por fuente se conserva únicamente en los datos y en la sección posterior de provenance.
- **Orden estable:** la lista mostrará primero las celebraciones en el orden editorial publicado, después los santos asociados del Ordo y finalmente los nombres suplementarios de Vatican News, conservando el orden de cada fuente. Los nombres repetidos de forma exacta se mostrarán una sola vez para evitar duplicación visual.
- **Encabezado:** no se mostrarán “Santos y santas del día”, “Otros santos y santas del día” ni encabezados equivalentes basados en la existencia de una fuente anterior. El resumen del disclosure seguirá siendo “Fiestas y santos del día” y la lista tendrá ese mismo significado unificado.
- **Metadatos de celebración:** el rango de una fiesta o celebración seguirá visible como información secundaria junto a su nombre cuando exista; no se mostrará información de fuente dentro de la lista.
- **Fecha solo suplementaria:** cuando solo exista `supplementalSaints`, sus nombres aparecerán directamente en la lista unificada, sin la palabra “otros” y sin cambiar el mensaje de disponibilidad agregada.

## Refinamiento aprobado: coherencia visual del contexto

- **Dirección visual:** se conservará la estética existente de Daily y de `VerseCard`: superficie clara, radio moderado, borde sutil, sombra suave, texto azul marino y acento dorado. No se creará una tarjeta con un lenguaje visual distinto.
- **Jerarquía:** el resumen del disclosure seguirá siendo el elemento principal; al abrirlo, la lista tendrá un espaciado más compacto y el rango de una celebración será un dato secundario, no un encabezado adicional.
- **Lista:** los marcadores usarán el acento dorado de la interfaz en lugar del bullet negro por defecto, manteniendo HTML semántico de lista y contraste suficiente.
- **Responsive:** las etiquetas de temporada/color podrán envolver en pantallas estrechas y la lista no dependerá de anchos fijos ni generará desplazamiento horizontal.
