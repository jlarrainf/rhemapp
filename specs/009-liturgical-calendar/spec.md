# Spec 009 — Calendario litúrgico enriquecido

Estado: Aprobada para implementación — autorización explícita del propietario el 2026-09-15
Prioridad: P1

## Contexto y objetivo

Rhemapp ya muestra las lecturas del día y mantiene un calendario chileno con fecha explícita. Esta spec enriquece esa experiencia con la celebración litúrgica, las fiestas, los santos, el color litúrgico y una vista mensual del calendario, sin crear una segunda fuente de verdad ni convertir la información litúrgica en una sección pesada de la navegación.

## Usuarios y actores

- Visitante no autenticado.
- Usuario autenticado que consulta el calendario desde web, PWA o Android.
- Editor o mantenedor de contenido litúrgico.
- Proceso de sincronización editorial.
- Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile como fuentes editoriales.

## Historias de usuario

- H1: Como visitante, quiero saber qué celebración, fiesta o santo se conmemora hoy para rezar con el contexto litúrgico correcto.
- H2: Como visitante, quiero consultar un mes del calendario litúrgico para anticipar celebraciones y elegir un día.
- H3: Como visitante, quiero seleccionar un día del calendario y abrir sus lecturas sin perder la fecha exacta.
- H4: Como visitante, quiero distinguir la celebración principal de las memorias opcionales.
- H5: Como mantenedor, quiero publicar solo información litúrgica trazable y verificada.

## Requisitos funcionales

- RF-1: CUANDO un visitante abre `/daily` sin fecha explícita, EL SISTEMA muestra la celebración correspondiente a la fecha vigente en `America/Santiago` junto con las lecturas publicadas.
- RF-2: CUANDO una entrada publicada contiene información litúrgica verificada, EL SISTEMA muestra la celebración principal, su rango, el tiempo litúrgico o color cuando estén disponibles y los santos asociados sin inventar campos faltantes.
- RF-3: CUANDO una fecha tiene celebraciones opcionales o conmemoraciones adicionales, EL SISTEMA distingue visualmente la celebración principal de las opciones y conserva el orden editorial de la fuente.
- RF-4: CUANDO un visitante abre `/calendario?month=YYYY-MM`, EL SISTEMA muestra el mes solicitado con fechas ISO, un resumen breve por día y el calendario `chile` en `America/Santiago`.
- RF-5: CUANDO un visitante selecciona un día del calendario, EL SISTEMA navega a `/daily?date=YYYY-MM-DD` y conserva esa fecha como selección explícita, sin sustituirla por “Hoy”.
- RF-6: MIENTRAS el visitante consulta la cuadrícula mensual, EL SISTEMA muestra solo resúmenes breves y permite abrir el detalle de un día sin cargar todas las lecturas dentro de la cuadrícula.
- RF-7: CUANDO el proceso editorial sincroniza una fecha, EL SISTEMA conserva el proveedor, la URL, el momento de obtención y el estado de verificación de la información litúrgica publicada.
- RF-8: SI la fuente externa falla, devuelve datos incompletos o presenta una celebración sin verificación, ENTONCES EL SISTEMA conserva la última versión válida o muestra la información disponible como no publicada, sin reemplazar datos verificados con contenido incompleto.
- RF-9: SI falta únicamente metadata litúrgica opcional pero las lecturas verificadas son válidas, ENTONCES EL SISTEMA permite leer las lecturas y comunica de forma discreta que el detalle litúrgico no está disponible.
- RF-10: CUANDO el reloj pasa de sábado 14:59:59 a sábado 15:00:00 en `America/Santiago`, EL SISTEMA mantiene la regla dominical existente para el modo domingo; una fecha seleccionada explícitamente no cambia por ese corte.
- RF-11: CUANDO una persona consulta el detalle de una celebración, EL SISTEMA ofrece la fuente editorial y el estado de verificación mediante un disclosure accesible, sin competir visualmente con las lecturas.
- RF-12: EL SISTEMA ofrece la misma información esencial y los mismos enlaces de fecha en web, PWA y Android mediante contratos compartidos, sin duplicar la lógica del calendario en los clientes.

## Requisitos no funcionales

- La información publicada debe conservar proveedor, URL, licencia o condición de uso, fecha de obtención y estado de verificación cuando estén disponibles.
- La fuente editorial de selección seguirá siendo el calendario chileno basado en Eucaristía Diaria y el Ordo de la Conferencia Episcopal de Chile.
- Las fechas de dominio usarán `YYYY-MM-DD` y la zona canónica seguirá siendo `America/Santiago`.
- La vista mensual será responsive, legible en móvil y accesible por teclado y lector de pantalla.
- La cuadrícula no debe depender de `new Date("YYYY-MM-DD")` para resolver el día visible.
- Los errores y estados vacíos estarán en español y no expondrán detalles técnicos ni secretos.
- El calendario debe poder servirse desde datos locales verificados cuando la fuente externa no esté disponible durante una consulta.
- La nueva metadata no debe requerir autenticación ni crear datos privados.

## Casos límite

- Fecha sin entrada publicada, fecha futura incompleta o año fuera del rango disponible.
- Día con más de una celebración, memoria opcional o santos repetidos en la fuente.
- Celebración publicada sin color, descripción, santo o rango verificable.
- Conflicto entre Eucaristía Diaria y el Ordo.
- Fuente externa caída, respuesta parcial, cambio de HTML o URL inválida.
- Cambio de fecha alrededor de medianoche en un dispositivo con otra zona horaria.
- Sábado exactamente a las 14:59:59 y 15:00:00 en Chile.
- Mes solicitado inválido, repetido o fuera del rango permitido.
- Cuadrícula mensual en pantalla estrecha y navegación solo con teclado.
- Usuario sin conexión que ya tiene una lectura cacheada pero no un resumen mensual actualizado.

## Fuera de alcance

- Directorio independiente de santos o biografías extensas.
- Calendarios de otros países o selección automática por locale del navegador.
- Texto completo de la Misa, Liturgia de las Horas o devociones.
- Modificación manual de celebraciones desde la interfaz pública.
- Notificaciones de fiestas o santos.
- Reemplazar la regla dominical aprobada por una nueva interpretación.

## Criterios de finalización

- RF-1 a RF-12 tienen implementación y evidencia en `validation.md`.
- Las entradas completas, opcionales, incompletas y con conflicto de fuente tienen fixtures y validadores.
- La vista mensual navega con fechas ISO y enlaza correctamente a Daily.
- Se prueban las fronteras del sábado 15:00, medianoche, fechas futuras y zonas horarias distintas.
- `npm run validate:daily`, `npm run lint`, `npm run build` y la suite específica pasan.
- Se verifica manualmente la experiencia en escritorio, móvil, teclado, lector de pantalla y estado sin conexión relevante.
- La documentación operativa registra fuente, licencia, sincronización, conservación de última versión y rollback.

## Dudas abiertas

No quedan dudas de producto pendientes. La confirmación de licencia y atribución de cada descripción o texto externo es un gate obligatorio de publicación; ningún contenido que no lo supere puede llegar al calendario público.
