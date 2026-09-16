# Spec 009 — Calendario litúrgico enriquecido

Estado: Refinamiento de contexto litúrgico aprobado para implementación — autorización explícita del propietario el 2026-09-16
Prioridad: P1

## Contexto y objetivo

Rhemapp ya muestra las lecturas del día y mantiene un calendario chileno con fecha explícita. Esta spec enriquece esa experiencia con la celebración litúrgica, las fiestas, los santos, el color litúrgico y una vista mensual del calendario, sin crear una segunda fuente de verdad ni convertir la información litúrgica en una sección pesada de la navegación.

## Usuarios y actores

- Visitante no autenticado.
- Usuario autenticado que consulta el calendario desde web, PWA o Android.
- Editor o mantenedor de contenido litúrgico.
- Proceso de sincronización editorial.
- Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile como fuentes editoriales primarias; Vatican News como fuente secundaria de información enlazada.

## Historias de usuario

- H1: Como visitante, quiero saber qué celebración, fiesta o santo se conmemora hoy para rezar con el contexto litúrgico correcto.
- H2: Como visitante, quiero consultar un mes del calendario litúrgico para anticipar celebraciones y elegir un día.
- H3: Como visitante, quiero seleccionar un día del calendario y abrir sus lecturas sin perder la fecha exacta.
- H4: Como visitante, quiero distinguir la celebración principal de las memorias opcionales.
- H5: Como mantenedor, quiero publicar solo información litúrgica trazable y verificada.
- H6: Como visitante, quiero acceder a información adicional sobre un santo sin que Rhemapp copie ni presente como propia una biografía externa.
- H7: Como visitante, quiero ver los nombres de los santos que Vatican News destaca para el día, sin cargar sus biografías.
- H8: Como visitante, quiero expandir el contexto litúrgico solo cuando lo necesite y encontrar allí las fiestas y los santos del día en una vista limpia.

## Requisitos funcionales

- RF-1: CUANDO un visitante abre `/daily` sin fecha explícita, EL SISTEMA muestra la celebración correspondiente a la fecha vigente en `America/Santiago` junto con las lecturas publicadas.
- RF-2: CUANDO una entrada publicada contiene información litúrgica verificada, EL SISTEMA muestra la fiesta o celebración principal, su rango, el tiempo litúrgico o color cuando estén disponibles y los santos asociados sin inventar campos faltantes.
- RF-3: CUANDO una fecha tiene celebraciones opcionales o conmemoraciones adicionales, EL SISTEMA distingue visualmente la celebración principal de las opciones y conserva el orden editorial de la fuente.
- RF-4: CUANDO un visitante abre `/calendario?month=YYYY-MM`, EL SISTEMA muestra el mes solicitado con fechas ISO, un resumen breve de la celebración y los santos verificados del día cuando estén disponibles, y el calendario `chile` en `America/Santiago`.
- RF-5: CUANDO un visitante selecciona un día del calendario, EL SISTEMA navega a `/daily?date=YYYY-MM-DD` y conserva esa fecha como selección explícita, sin sustituirla por “Hoy”.
- RF-6: MIENTRAS el visitante consulta la cuadrícula mensual, EL SISTEMA muestra solo resúmenes breves y permite abrir el detalle de un día sin cargar todas las lecturas dentro de la cuadrícula.
- RF-7: CUANDO el proceso editorial sincroniza una fecha, EL SISTEMA conserva el proveedor, la URL, el momento de obtención y el estado de verificación de la información litúrgica publicada.
- RF-8: SI la fuente externa falla, devuelve datos incompletos o presenta una celebración sin verificación, ENTONCES EL SISTEMA conserva la última versión válida o muestra la información disponible como no publicada, sin reemplazar datos verificados con contenido incompleto.
- RF-9: SI falta únicamente metadata litúrgica opcional pero las lecturas verificadas son válidas, ENTONCES EL SISTEMA permite leer las lecturas; solo comunica que el contexto litúrgico no está disponible cuando ninguna de las fuentes revisadas aporta una fiesta, celebración, santo, tiempo o color verificable para esa fecha.
- RF-10: CUANDO el reloj pasa de sábado 14:59:59 a sábado 15:00:00 en `America/Santiago`, EL SISTEMA mantiene la regla dominical existente para el modo domingo; una fecha seleccionada explícitamente no cambia por ese corte.
- RF-11: CUANDO una persona consulta el detalle de una celebración, EL SISTEMA ofrece la fuente editorial y el estado de verificación en una sección posterior mediante un disclosure accesible, sin mencionarlos dentro del contenido principal del contexto ni competir visualmente con las lecturas.
- RF-12: EL SISTEMA ofrece la misma información esencial y los mismos enlaces de fecha en web, PWA y Android mediante contratos compartidos, sin duplicar la lógica del calendario en los clientes.
- RF-13: CUANDO una entrada publicada contiene uno o más santos del día con nombre y fuente verificados, EL SISTEMA muestra sus nombres en una lista vertical simple en la sección de contexto de Daily y en el resumen mensual, conserva el orden editorial y no muestra descripciones biográficas, contenido auxiliar dentro de la lista ni placeholders cuando no existen santos verificados.
- RF-14: CUANDO un santo publicado tiene una página específica del santo o de la fecha en Vatican News cotejada editorialmente con la celebración y el nombre del Ordo, EL SISTEMA ofrece en el contexto de Daily un enlace externo claramente atribuido a Vatican News mediante el disclosure de fuentes, fuera de la lista visible de nombres; SI no existe una coincidencia exacta o la URL no está verificada, ENTONCES no muestra el enlace ni inventa o copia información adicional.
- RF-15: CUANDO el proceso diario de sincronización consulta la página `https://www.vaticannews.va/es/santos.html` para la fecha vigente en `America/Santiago`, EL SISTEMA debe validar la fecha mostrada por la fuente, extraer solo nombres inequívocos en el orden visible y publicar una captura fechada y verificada; CUANDO la captura válida existe, EL SISTEMA muestra en el Daily web una lista vertical separada y claramente atribuida con esos nombres, sin tarjetas, separadores ni enlaces dentro de la lista; SI la fuente falla, no corresponde a la fecha, cambia su estructura o un nombre no puede extraerse sin ambigüedad, ENTONCES el proceso rechaza la actualización de esa fecha, conserva la última captura válida de esa misma fecha y no bloquea las lecturas.
- RF-16: CUANDO Daily dispone de contexto litúrgico verificable, EL SISTEMA lo presenta dentro de un bloque colapsable “Contexto litúrgico”, cerrado por defecto, que incluye la fiesta o celebración del día, las celebraciones opcionales, el tiempo/color y las listas de santos y santas disponibles.
- RF-17: CUANDO Daily muestra un santo o santa en cualquiera de sus listas, EL SISTEMA presenta el nombre con el tratamiento “San” o “Santa” correspondiente antes del nombre, conserva los tratamientos marianos o títulos ya publicados que no admiten ese prefijo y no altera el nombre almacenado ni la provenance.
- RF-18: SI una fuente secundaria ya aporta una captura válida de santos para la fecha pero la fuente litúrgica principal aún no contiene una celebración, ENTONCES EL SISTEMA muestra la captura dentro del contexto y no presenta el mensaje de contexto no disponible; dicho mensaje solo aparece cuando no existe información contextual verificable en ninguna fuente revisada.

## Requisitos no funcionales

- La información publicada debe conservar proveedor, URL, licencia o condición de uso, fecha de obtención y estado de verificación cuando estén disponibles.
- La fuente editorial de selección seguirá siendo el calendario chileno basado en Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile.
- Las fechas de dominio usarán `YYYY-MM-DD` y la zona canónica seguirá siendo `America/Santiago`.
- La vista mensual será responsive, legible en móvil y accesible por teclado y lector de pantalla.
- La cuadrícula no debe depender de `new Date("YYYY-MM-DD")` para resolver el día visible.
- Los errores y estados vacíos estarán en español y no expondrán detalles técnicos ni secretos.
- El calendario debe poder servirse desde datos locales verificados cuando la fuente externa no esté disponible durante una consulta.
- La nueva metadata no debe requerir autenticación ni crear datos privados.
- Los santos se presentarán como nombres breves y ordenados; la información adicional se conservará únicamente como URL externa verificada y atribución del proveedor, nunca como una copia de la descripción o biografía.
- El contexto litúrgico será colapsable y estará cerrado inicialmente para priorizar una vista limpia; las fuentes quedarán en una sección posterior independiente, también accesible mediante disclosure.
- Los nombres de santos y santas visibles se presentarán con “San” o “Santa” cuando el nombre no incluya ya un tratamiento mariano o hagiográfico equivalente; esta presentación no modifica el dato de origen.
- Vatican News será una fuente secundaria informativa: el Ordo mantiene la autoridad para seleccionar el nombre y la celebración litúrgica. La aplicación no hará scraping durante la petición del usuario ni publicará texto externo protegido.
- Un proceso server-side/CI programado consultará la página una vez al día y actualizará únicamente el JSON público versionado después de pasar validaciones de fuente, fecha, estructura, nombres, orden y duplicados. La interfaz web solo leerá la captura local publicada.
- La actualización será idempotente y fallará de forma segura: una respuesta caída, incompleta, fechada incorrectamente o ambigua no sobrescribirá datos válidos ni trasladará nombres de otra fecha. La ejecución conservará trazabilidad en Git y el despliegue a Vercel ocurrirá mediante el flujo existente de `main`.
- Los nombres de Vatican News se incorporarán mediante una captura fechada con URL, atribución y estado de verificación. La interfaz web no mostrará descripciones, biografías, titulares ni enlaces individuales de esa captura.
- Los nombres de santos visibles en Daily se presentarán en listas verticales planas, sin tarjetas, píldoras, separadores ni enlaces incrustados; los enlaces secundarios verificados de RF-14 permanecerán accesibles únicamente desde el disclosure “Fuente y verificación”.

## Casos límite

- Fecha sin entrada publicada, fecha futura incompleta o año fuera del rango disponible.
- Día con más de una celebración, memoria opcional o santos repetidos en la fuente.
- Celebración publicada sin color, descripción, santo o rango verificable.
- Santo con nombre ausente, fuente no verificada, duplicado o una lista demasiado extensa para la celda mensual.
- Conflicto entre Eucaristía Diaria y el Ordo.
- Fuente externa caída, respuesta parcial, cambio de HTML o URL inválida.
- Página secundaria sin coincidencia exacta, redirección, cambio de URL o ausencia de página individual en Vatican News.
- Página de `santos.html` con más de un nombre, fiesta enlazada, títulos biográficos o cambios de estructura; solo se publicarán nombres extraídos y revisados sin ambigüedad.
- Job diario retrasado, duplicado o ejecutado fuera de la medianoche chilena; la fecha de trabajo se resolverá explícitamente con `America/Santiago` y la operación será idempotente.
- Job sin permisos de escritura, conflicto al publicar en `main` o despliegue posterior fallido; la captura anterior continuará sirviéndose y el fallo quedará visible en la ejecución del workflow.
- Lista de santos con enlaces secundarios verificados; el diseño debe ocultar esos enlaces del bloque visible de nombres sin perder su acceso desde el disclosure de fuentes.
- Fecha con captura de Vatican News pero sin celebración del Ordo publicada todavía; la captura secundaria cuenta como contexto disponible y suprime el mensaje de ausencia.
- Contexto litúrgico largo, cerrado por defecto, abierto con teclado o en pantalla estrecha.
- Cambio de fecha alrededor de medianoche en un dispositivo con otra zona horaria.
- Sábado exactamente a las 14:59:59 y 15:00:00 en Chile.
- Mes solicitado inválido, repetido o fuera del rango permitido.
- Cuadrícula mensual en pantalla estrecha y navegación solo con teclado.
- Usuario sin conexión que ya tiene una lectura cacheada pero no un resumen mensual actualizado.

## Fuera de alcance

- Directorio independiente de santos o biografías extensas.
- Descripciones biográficas copiadas, scraping durante el render o búsqueda independiente de santos.
- Consultas desde el navegador o sincronización automática en cada visita a `vaticannews.va`; la consulta automática queda limitada al job diario validado.
- Calendarios de otros países o selección automática por locale del navegador.
- Texto completo de la Misa, Liturgia de las Horas o devociones.
- Modificación manual de celebraciones desde la interfaz pública.
- Notificaciones de fiestas o santos.
- Reemplazar la regla dominical aprobada por una nueva interpretación.

## Criterios de finalización

- RF-1 a RF-15 tienen implementación y evidencia en `validation.md`.
- Las entradas completas, opcionales, incompletas y con conflicto de fuente tienen fixtures y validadores.
- Los casos de santos verificados, ausentes, duplicados y no verificados tienen fixtures y pruebas; los nombres aparecen en Daily y en el resumen mensual sin inventar datos.
- Los casos de enlace secundario presente, ausente, no coincidente y URL inválida tienen fixtures y pruebas; Daily muestra atribución externa sin almacenar ni renderizar biografías copiadas.
- Los casos de captura Vatican News presente, ausente, fechada incorrectamente, con nombres múltiples y con contenido ambiguo tienen fixtures y pruebas; Daily web muestra únicamente los nombres verificados y la fuente atribuida en una lista vertical simple.
- La lista visible de santos en Daily no contiene tarjetas, separadores, enlaces ni textos auxiliares; los enlaces RF-14 siguen disponibles mediante el disclosure de fuentes.
- La vista mensual navega con fechas ISO y enlaza correctamente a Daily.
- Se prueban las fronteras del sábado 15:00, medianoche, fechas futuras y zonas horarias distintas.
- `npm run validate:daily`, `npm run lint`, `npm run build` y la suite específica pasan.
- Se verifica manualmente la experiencia en escritorio, móvil, teclado, lector de pantalla y estado sin conexión relevante.
- La documentación operativa registra fuente, licencia, sincronización, conservación de última versión y rollback.
- El workflow diario puede ejecutarse manualmente, es idempotente, actualiza solo la fecha vigente y deja la captura publicada disponible para el deploy de `main`.
- Daily muestra fiestas y santos en un contexto colapsable, con tratamientos “San”/“Santa” y fuentes separadas después del contenido principal.

## Dudas abiertas

No quedan dudas de producto pendientes para RF-14 a RF-18. La decisión aprobada es ofrecer desde Daily enlaces externos exactos cuando corresponda y, adicionalmente, mostrar en la web los nombres de una captura fechada de `santos.html`, sin texto copiado, con Vatican News como fuente secundaria y el Ordo como fuente litúrgica primaria. La captura se consultará diariamente desde un job server-side/CI, con resolución de fecha chilena, validación estricta e idempotencia; ningún contenido externo que no supere el gate de URL, fecha, correspondencia, licencia/atribución, estructura y nombres puede llegar al calendario público. El contexto se abrirá solo por interacción del visitante y las fuentes se mantendrán fuera del contenido principal.
