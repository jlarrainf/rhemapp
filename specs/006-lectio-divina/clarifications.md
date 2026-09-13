# Clarificaciones — Spec 006

Estado: Resolved — decisiones registradas

## Hallazgos de QA

- La IA no puede garantizar por sí sola fidelidad doctrinal; el alcance debe reducirse a preguntas de reflexión controladas y ancladas explícitamente a la lectura.
- Hace falta definir la fuente aprobada que limita el tono y los temas permitidos.
- Guardar respuestas del usuario supondría datos personales y no está requerido para el MVP.
- La función necesita fallback para que una dependencia externa no bloquee Daily.
- Generar una adaptación por usuario sería innecesario y aumentaría costos; el contenido debe ser igual para todos.

## Decisiones aprobadas

- La Lectio divina con IA será pública y compartida: se generará como máximo una adaptación por lectura y versión de prompt, se persistirá y se reutilizará para todos los usuarios.
- Los usuarios no podrán enviar peticiones, prompts ni notas para modificar la adaptación pública.
- La adaptación será igual para todos los usuarios y no requerirá inicio de sesión para visualizarse.
- La adaptación se generará anticipadamente mediante un proceso interno al publicar o validar la lectura; abrir la lectura no podrá iniciar una generación ni generar costos. Mientras no exista, se mostrará el fallback.
- Ante un fallo habrá como máximo tres reintentos automáticos internos con espera progresiva. Si todos fallan, se conservará el fallback y solo un administrador/editor autorizado podrá solicitar una regeneración manual.
- La generación debe estar guiada por un prompt estructurado, una lista de anclajes extraídos de la lectura y ejemplos positivos/negativos versionados.
- Cada adaptación válida tendrá exactamente cuatro preguntas: una de observar, una de meditar, una de orar y una de actuar.
- Cada pregunta será una sola interrogación de 15 a 60 palabras, en español claro y respetuoso, con el propósito específico de su etapa.
- El fallback siempre mostrará cuatro preguntas. Intentará usar anclajes verificables de la lectura y, cuando no sean suficientes, mostrará preguntas genéricas, seguras y etiquetadas como reflexión general.
- La única base doctrinal permitida será la lectura verificada y una guía doctrinal interna, fija y aprobada; el sistema no consultará ni citará documentos doctrinales externos durante la generación.
- La guía interna exigirá las etapas observar, meditar, orar y actuar; usará solo lo explícito de la lectura; mantendrá un tono católico, sobrio y esperanzador; evitará moralizar, inventar contexto/doctrina/citas y dar consejos médicos o psicológicos; y ordenará usar fallback si no existe base textual suficiente.
- La guía, el prompt, los ejemplos, el schema y los validadores se guardarán versionados en el repositorio. Cada cambio requerirá una nueva versión y aprobación registrada; las adaptaciones existentes conservarán su versión y solo se regenerarán mediante una acción manual autorizada.
- No se aprobará manualmente cada adaptación. La publicación será automática únicamente después de superar schema, seguridad, idioma, especificidad, no repetición y anclaje a la lectura; si falla, se usará fallback.
- La revisión humana previa al lanzamiento se concentrará en la guía doctrinal, el prompt, los ejemplos y las reglas de validación.

## Impacto

- Plan: se requiere generación server-side persistida, estructurada y validada antes de publicar, sin endpoint de petición libre.
- Tareas: no conectar un proveedor de IA hasta tener prompt versionado, esquema, límites, fallback y política de publicación automática tras validación.
