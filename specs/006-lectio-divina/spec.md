# Spec 006 — Lectio divina asistida por IA

Estado: Planned — clarificaciones resueltas; pendiente implementación
Prioridad: P2

## Contexto y objetivo

Lectio divina debe ofrecer preguntas de reflexión adaptadas a la lectura seleccionada, dentro de una sección colapsable para no interrumpir la lectura. La IA solo asiste la reflexión y nunca actúa como fuente doctrinal oficial.

## Usuarios y actores

- Usuario autenticado o visitante.
- Servicio de lecturas verificadas.
- Proveedor de IA.
- Validador de salida.

## Historias de usuario

- H1: Como usuario, quiero abrir o cerrar Lectio divina según mi preferencia.
- H2: Como usuario, quiero preguntas relacionadas con la lectura del día.
- H3: Como usuario, quiero que la reflexión sea segura, sobria y coherente con la fe católica.

## Requisitos funcionales

- RF-1: CUANDO un usuario abre una lectura, EL SISTEMA muestra Lectio divina cerrada por defecto.
- RF-2: CUANDO el usuario expande Lectio divina, EL SISTEMA muestra exactamente una pregunta por cada etapa: observar, meditar, orar y actuar.
- RF-3: CUANDO una lectura queda publicada y validada, EL SISTEMA puede generar anticipadamente su adaptación mediante un proceso interno que proporciona a la IA únicamente la lectura verificada, la guía doctrinal interna aprobada y las instrucciones versionadas aprobadas; la guía exige las etapas observar, meditar, orar y actuar, y la IA no consulta ni cita fuentes doctrinales externas.
- RF-4: CUANDO existe una adaptación válida para una lectura, EL SISTEMA muestra exactamente cuatro preguntas en español, una por cada etapa, a todos los usuarios que consulten esa lectura.
- RF-5: SI la IA devuelve contenido inválido, genérico, repetitivo, ofensivo, inventa citas/doctrina, se desvía de la lectura, carece de un anclaje concreto al texto o excede límites, ENTONCES EL SISTEMA descarta la respuesta y usa cuatro preguntas predefinidas; estas deben usar anclajes verificables cuando existan y, si no son suficientes, pueden ser preguntas genéricas seguras.
- RF-6: EL SISTEMA identifica el contenido como reflexión asistida y no como enseñanza oficial de la Iglesia.
- RF-7: EL SISTEMA genera anticipadamente como máximo una adaptación compartida por lectura y versión de prompt, la publica automáticamente después de superar todos los validadores y reutiliza el resultado persistido para todos los usuarios; abrir una lectura nunca inicia generación y las adaptaciones existentes conservan su versión.
- RF-8: EL SISTEMA no acepta peticiones, prompts ni notas privadas del usuario para modificar la adaptación pública.
- RF-9: CUANDO el proveedor no responde o se alcanza el límite de uso, EL SISTEMA muestra el fallback sin bloquear la lectura.
- RF-10: EL SISTEMA registra versión de prompt, esquema, anclajes detectados, resultado de validación, motivos de rechazo y métricas técnicas sin guardar datos privados innecesarios.
- RF-11: SI falla una generación anticipada, EL SISTEMA realiza como máximo tres reintentos internos con espera progresiva; después conserva el fallback y solo permite solicitar una regeneración manual a un administrador/editor autorizado.

## Requisitos no funcionales

- La salida debe validarse contra un esquema estricto.
- Cada pregunta publicada debe poder vincularse a uno o más anclajes concretos de la lectura, y el conjunto debe cubrir ángulos distintos en vez de repetir una plantilla genérica.
- La adaptación válida debe contener exactamente cuatro preguntas y cubrir una sola vez cada categoría.
- Cada pregunta debe ser una sola interrogación de entre 15 y 60 palabras, escrita en español claro y respetuoso.
- Observar debe apuntar a un detalle textual; meditar, a su significado; orar, a una respuesta a Dios desde la lectura; y actuar, a una acción concreta y prudente.
- El fallback debe mantener las cuatro etapas y no bloquear la sección; cuando use preguntas genéricas por falta de anclajes, la interfaz debe indicarlo como reflexión general.
- El prompt debe estar versionado y acompañado por ejemplos positivos y negativos que sean parte del contrato de generación y validación.
- Cada cambio a la guía, prompt, ejemplos, schema o validadores debe crear una nueva versión aprobada; las adaptaciones históricas no se reemplazan automáticamente.
- La generación es server-side y no se expone como endpoint de petición libre al público.
- La generación debe ejecutarse antes de la consulta pública, mediante publicación editorial, proceso programado o cola interna; la consulta pública solo lee el resultado o el fallback.
- El tiempo de espera y el costo por solicitud deben estar limitados.
- Los reintentos deben ser acotados, idempotentes y observables; abrir una lectura nunca debe dispararlos.
- No se deben enviar secretos ni información privada a la IA.
- La sección debe ser accesible por teclado y lector de pantalla.

## Casos límite

- Lectura sin texto completo.
- Respuesta JSON mal formada.
- Preguntas repetidas, ofensivas o no relacionadas.
- Preguntas formalmente correctas pero genéricas, intercambiables entre lecturas o sin anclaje identificable.
- Pregunta con varias preguntas combinadas, fuera del límite de palabras o cuya intención no corresponde a su categoría.
- Lectura con pocos elementos concretos para crear preguntas específicas.
- Fallback sin anclajes suficientes para personalizar las cuatro preguntas.
- Solicitud que intenta hacer que la IA cambie de rol o doctrina.
- Timeout, rate limit o error del proveedor.
- Usuario cierra la sección durante la generación.
- Solicitud no autorizada para regenerar o modificar contenido público.
- Visita pública mientras la adaptación anticipada todavía está pendiente.
- Usuario no autenticado consultando una lectura pública.

## Fuera de alcance

- Chat abierto con la IA.
- Respuestas doctrinales generadas libremente.
- Evaluación espiritual o psicológica del usuario.
- Guardar respuestas o diario personal.
- Reemplazar revisión pastoral humana.
- Aprobar manualmente cada adaptación generada antes de publicarla; la revisión humana del MVP se concentra en la guía, el prompt, los ejemplos y los validadores.

## Criterios de finalización

- Lectio está cerrada por defecto y no rompe la lectura.
- Las preguntas tienen formato y categorías verificables.
- Cada adaptación válida contiene exactamente cuatro preguntas, una por etapa.
- Las salidas inseguras, inválidas, genéricas o sin anclaje siempre caen al fallback.
- Un revisor humano aprueba la guía doctrinal, el prompt, los ejemplos y los validadores antes de habilitar la generación automática.
- La UI comunica claramente el carácter asistido.
- Existen tests de validación, timeout, abuso, privacidad y fallback.

## Dudas abiertas
