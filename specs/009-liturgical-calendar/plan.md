# Plan técnico — Spec 009

## Alcance técnico

La spec extiende el dominio de lecturas existente para incluir metadata litúrgica verificable, nombres de santos del día, nombres suplementarios de Vatican News, enlaces secundarios de información y una vista mensual pública. La implementación debe conservar los archivos JSON actuales, el endpoint `/api/readings`, la regla dominical y la compatibilidad temporal del campo `celebration`.

No se introduce una base de datos para el calendario en esta fase. La fuente de publicación seguirá siendo el conjunto local validado, actualizado por el sincronizador editorial.

## Plan de remediación del incidente operativo 2026-09-21

### Diagnóstico

La causa inmediata está confirmada en los runs remotos `35503401236` y `35590502665`: el paso de captura de nombres de Vatican News termina con `Ambiguous Vatican News saint name in heading 0` el 20 de septiembre y `Ambiguous Vatican News saint descriptor at index 0` el 21 de septiembre. La sincronización primaria de calendario termina antes de ese paso; validación y commit quedan omitidos porque el workflow trata la captura secundaria opcional como un paso bloqueante.

El parser vigente no cubre dos cambios legítimos de la fuente: encabezados con varios nombres separados por coordinación y descriptores nuevos como `apóstol y evangelista`, además de caracteres Unicode presentes en nombres publicados. El comportamiento fail-closed debe conservarse: el sistema no puede adivinar una separación ni publicar descriptores como nombres.

### Resultado objetivo

El pipeline tendrá dos propiedades independientes:

1. La sincronización primaria de lecturas podrá validar y publicar sus cambios válidos aunque falle la captura opcional de Vatican News.
2. La captura secundaria seguirá siendo atómica, fechada, idempotente y fail-closed. Ante una ambigüedad, conservará la última captura válida de esa fecha y producirá una advertencia visible con diagnóstico suficiente para corregir el parser.

### Orden de ejecución

1. **Cerrar la decisión editorial (T52).** Revisar los encabezados reales del 20 y 21 de septiembre y decidir cómo representar un grupo con varios nombres. Crear fixtures mínimos, no una copia innecesaria de la página completa, con la salida esperada y los casos que deben seguir siendo rechazados.
2. **Endurecer el contrato del parser (T53).** Ajustar `src/lib/readings/vaticanNewsSaints.js` para aceptar únicamente las formas aprobadas: vocabulario de descriptores respaldado por fixtures, encabezados compuestos con separadores explícitos, Unicode y alias parentéticos válidos preservados en el campo `name`. Omitir encabezados litúrgicos sin nombre individual y permitir una captura válida con lista vacía. Mantener rechazo ante texto biográfico indistinguible, paréntesis desbalanceados, duplicados, fecha incorrecta, secciones ausentes o estructura no reconocida.
3. **Aislar el workflow (T54).** Reordenar o separar `.github/workflows/sync-daily-readings.yml` para que el resultado secundario no omita `validate:daily` ni el commit de la parte primaria. La ejecución debe conservar la captura anterior cuando T53 rechace la fuente y dejar un resumen de advertencia; no se debe usar `continue-on-error` de forma que oculte el estado sin una salida observable.
4. **Verificar el flujo completo (T55).** Ejecutar las pruebas de parser, validación de datos y dry-runs con 20/09 y 21/09; simular fuente secundaria inválida y confirmar que la captura anterior no cambia. Ejecutar un `workflow_dispatch` controlado y comprobar en GitHub que la sincronización primaria, la validación, el commit condicionado y el despliegue siguen su camino aunque la fuente secundaria esté degradada.
5. **Cerrar documentación y operación (T56).** Actualizar `docs/liturgical-calendar-operation.md` y `validation.md` con el estado `partial`, la advertencia, la conservación de última captura, el rollback y los enlaces a los runs. Esta etapa se completó después de la verificación local y remota; la spec vuelve a estado `Accepted`.

### Límites y no objetivos del incidente

- No rotar `BIBLE_API_KEY`, cambiar Vercel, migrar el JSON a una base de datos ni alterar la autoridad del Ordo: ninguna de esas acciones explica el fallo observado.
- No relajar el parser para aceptar cualquier texto visible ni convertir el fallo en éxito silencioso.
- El rango fijo `2026-09-10`–`2026-12-31` genera advertencias esperables para fechas futuras aún no publicadas; es una mejora operativa separable y no la causa del fallo actual.

### Criterios de salida

- Los fixtures de 2026-09-20 y 2026-09-21 pasan con la representación editorial aprobada y los casos ambiguos siguen fallando sin mutación.
- Una falla secundaria deja la entrada secundaria anterior intacta, permite validar/commit de cambios primarios válidos y queda visible como `partial`/advertencia en el run; el comportamiento de rechazo y conservación está cubierto por fixtures y dry-runs, y el aislamiento está implementado en el workflow.
- Un run válido e idempotente no genera cambios repetidos ni duplica nombres.
- `npm run test:vatican-saints`, `npm run test:calendar`, `npm run test:readings`, `npm run validate:daily`, `npm run lint` y `npm run build` pasan; `validation.md` contiene evidencia RF-15 y RF-19.

## Arquitectura y módulos

- `src/lib/readings/`: normalización, validación y compatibilidad de metadata litúrgica.
- `src/lib/liturgicalSchedule.js`: fechas ISO, zona `America/Santiago`, navegación mensual y regla dominical existente.
- `src/lib/liturgicalCalendar.js`: resumen mensual, clasificación de celebraciones y resolución de fuentes.
- `src/lib/dailyReading.js`: carga de entradas enriquecidas sin romper consumidores legacy.
- `scripts/sync-daily-readings.mjs`: extracción de celebración principal, opcionales, rango, color y santos cuando la fuente los entregue; incorporación editorial explícita de enlaces secundarios cotejados.
- `src/lib/readings/vaticanNewsSaints.js`: contrato del parser server-side para fecha, sección, nombres limpios, orden, duplicados y provenance de la captura diaria.
- `scripts/sync-vatican-news-saints.mjs`: consulta diaria idempotente de `santos.html`, validación contra la fecha chilena y actualización atómica de la entrada JSON sin eliminar metadata no relacionada.
- `scripts/validate-daily-readings.mjs`: validación de fechas, orden, fuentes, duplicados y metadata.
- `src/app/api/readings/route.js`: respuesta enriquecida para Daily.
- `src/app/api/calendar/route.js`: contrato resumido por mes para web, PWA y Android.
- `src/app/daily/`: presentación compacta de celebración, santos, color, enlaces secundarios y enlace al calendario.
- `src/app/calendario/`: vista mensual accesible y navegación por `month=YYYY-MM`.
- `public/data/daily-readings/*.json`: persistencia versionada y trazable de la metadata.

### Ampliación de santos del día

- La única fuente de verdad seguirá siendo `celebrations[].saints[]` dentro de la entrada diaria; no se crea un directorio ni una tabla independiente de santos.
- Daily renderizará una sección “Santos del día” con los nombres verificados en orden editorial, dentro del bloque de contexto existente.
- `liturgicalCalendar.js` proyectará esos nombres al resumen mensual. La celda mantendrá una altura acotada; su etiqueta accesible y el detalle de Daily conservarán la lista completa publicada.
- El home no incorporará una tarjeta ni un enlace principal nuevo. El acceso continuará siendo el enlace contextual de Daily y Rosario, preservando la navegación acordada.
- No se almacenarán descripciones ni biografías. Cada santo podrá tener un `informationSource` secundario con proveedor, URL, verificación editorial y atribución; solo esa metadata se enviará a `/api/readings` y se mostrará en Daily.
- Cada entrada podrá incluir `supplementalSaints[]` como captura local, fechada y verificada de los nombres visibles en `https://www.vaticannews.va/es/santos.html`; sus elementos conservarán nombre y provenance, sin biografía ni enlace individual.
- El workflow diario resolverá la fecha con `America/Santiago`, consultará la representación fechada `/es/santos/MM/DD.html` que la portada `santos.html` carga para ese día, validará la fecha y la estructura esperadas y solo escribirá un cambio si la captura completa es válida. El commit queda trazado en Git y el deploy de `main` publica el JSON actualizado; la provenance pública conservará la URL solicitada `santos.html`.
- La cuadrícula mensual seguirá proyectando únicamente nombres de santos; no incluirá enlaces secundarios para conservar densidad, rendimiento y accesibilidad.
- Vatican News no se consultará ni se raspará durante una petición de usuario. Las URLs se incorporarán mediante revisión editorial explícita y el enlace no bloqueará la lectura si el sitio externo no está disponible.
- Daily renderizará `celebrations[].saints[]` y `supplementalSaints[]` como listas verticales planas, separadas por provenance y sin tarjetas, separadores, píldoras ni enlaces dentro de las listas.
- Los enlaces válidos de `informationSource` se conservarán en el contrato y se moverán al disclosure existente `Fuente y verificación`, fuera del bloque visible de nombres.

### Refinamiento del contexto litúrgico

- `LiturgicalContext` conservará una sola superficie visual, pero su contenido se envolverá en un `<details open>` nativo con el resumen `Contexto litúrgico`; la persona podrá cerrarlo sin perder el contenido ni el foco accesible.
- Dentro del disclosure se mostrarán la fiesta/celebración principal, las celebraciones opcionales, el tiempo/color y dos listas de nombres: santos y santas litúrgicos y nombres suplementarios disponibles. Ninguna de esas listas mostrará proveedores o enlaces.
- `formatSaintName` será una utilidad de presentación compartida por las listas de Daily. Agregará `San` o `Santa` a nombres sin tratamiento, conservará títulos marianos o hagiográficos existentes y no modificará los JSON ni el contrato público.
- El disclosure de fuentes se separará del contexto y aparecerá después en una sección independiente. Allí quedarán la fuente editorial, el estado, la atribución, el enlace secundario y el enlace a Vatican News de la captura, sin duplicar esa información en el bloque principal.
- La condición de ausencia se calculará a partir de todo el contexto verificable (`celebrations`, santos, `supplementalSaints`, tiempo y color). La presencia de cualquier captura suplementaria impedirá mostrar “no disponible”, aunque no exista `primary`.

La vista mensual debe consumir la misma función de dominio que valida la fecha solicitada por Daily. No debe reconstruir fechas con objetos `Date` ambiguos ni duplicar la regla del sábado.

## Modelo de datos

La forma propuesta mantiene compatibilidad con `celebration`:

```json
{
  "date": "YYYY-MM-DD",
  "calendar": "chile",
  "liturgicalYear": "YYYY",
  "liturgicalSeason": "...",
  "liturgicalColor": "white",
  "celebration": "Texto legacy",
  "celebrations": [
    {
      "name": "...",
      "rank": "memorial",
      "isPrimary": true,
      "saints": [
        {
          "name": "...",
          "source": { "provider": "...", "url": "...", "verified": true },
          "informationSource": { "provider": "Vatican News", "url": "https://www.vaticannews.va/es/santos/...", "verified": true, "attribution": "Vatican News" }
        }
      ],
      "source": { "provider": "...", "url": "...", "verified": true }
    }
  ],
  "supplementalSaints": [
    {
      "name": "...",
      "source": {
        "provider": "Vatican News",
        "url": "https://www.vaticannews.va/es/santos.html",
        "verified": true,
        "attribution": "Vatican News"
      }
    }
  ],
  "readings": [],
  "source": {
    "provider": "...",
    "url": "...",
    "verified": true,
    "fetchedAt": "..."
  }
}
```

Los valores técnicos de `rank` serán una enumeración controlada. La interfaz traducirá esos valores a etiquetas españolas. No se publicará un santo o celebración sin `source.verified === true`. `informationSource` será opcional, pero si existe exigirá la misma validación HTTP(S), proveedor y `verified === true`, además de conservar la atribución. `supplementalSaints` será opcional, exigirá una fuente verificada y nombres no vacíos, y se validará como una captura asociada a la fecha de la entrada. La validación rechazará nombres ausentes, fuentes no verificadas, URLs secundarias inválidas y duplicados de santos dentro de una entrada; la normalización conservará el orden editorial.

## Contratos

### `GET /api/calendar?month=YYYY-MM`

Respuesta esperada:

```json
{
  "month": "YYYY-MM",
  "calendar": "chile",
  "timeZone": "America/Santiago",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "label": "...",
      "primaryCelebration": "...",
      "celebrationRank": "memorial",
      "saints": ["..."],
      "liturgicalColor": "white",
      "available": true,
      "source": { "provider": "...", "url": "...", "verified": true }
    }
  ]
}
```

El endpoint rechazará meses inválidos, parámetros repetidos y calendarios no soportados con errores en español. Un día sin publicación se representará como no disponible, no con contenido inventado.

### `GET /api/readings`

Conservará el contrato existente y añadirá metadata estructurada de la celebración, la lista pública de nombres de santos verificados y, cuando exista, `supplementalSaints` con los nombres y provenance de la captura de Vatican News. Las lecturas y la fecha seguirán siendo la fuente de verdad para el contenido bíblico. La interfaz web mostrará de esa lista únicamente `name`; no se publicará texto biográfico.

## Decisiones técnicas

| Decisión | Motivo | Alternativa descartada |
|---|---|---|
| Mantener JSON versionado | Reutiliza el pipeline editorial y evita una migración de datos prematura | Crear tablas antes de validar el modelo |
| Derivar el mes desde las entradas diarias | Evita dos fuentes de verdad | Mantener un calendario mensual separado |
| Conservar `celebration` como alias | Protege consumidores legacy | Romper todos los consumidores de una vez |
| Mostrar resumen en la cuadrícula | Mantiene legibilidad y rendimiento | Renderizar lecturas completas en cada día |
| Mostrar nombres y enlaces secundarios verificados | Añade contexto útil sin copiar contenido ni crear un directorio pesado | Almacenar biografías o hacer scraping en tiempo de ejecución |
| Mantener Daily y calendario como superficies | Reutiliza la navegación y el contexto existentes | Añadir una nueva tarjeta principal al home |
| Metadata opcional no bloquea lecturas válidas | Degrada con seguridad sin perder la función principal | Ocultar Daily completo por un campo secundario |
| Fuente primaria separada de `informationSource` | Evita confundir autoridad litúrgica con información complementaria | Reemplazar el Ordo por una fuente secundaria |
| URLs secundarias editoriales y estáticas | Hace reproducible la publicación y tolera caídas del sitio externo | Resolver o inventar enlaces dinámicamente |
| Captura local actualizada por job diario | Permite mantener los nombres al día sin scraping en cada visita, conservar historial y no mezclar autoridades editoriales | Hacer fetch de `santos.html` desde el render o depender de un filesystem efímero de Vercel |
| Parser fail-closed e idempotente | Impide publicar una fecha incorrecta, biografía o captura parcial y permite repetir el job sin duplicar cambios | Aceptar cualquier texto visible o sobrescribir ante una respuesta incompleta |
| Listas verticales planas para santos | Reduce carga visual y mantiene nombres escaneables sin perder separación de provenance | Mantener chips, columnas flexibles o enlaces visibles junto a cada nombre |
| Disclosure para enlaces RF-14 | Conserva el acceso a información verificada sin competir con el objetivo principal de la lista | Eliminar enlaces secundarios o mantenerlos como una segunda lista visible |
| Contexto litúrgico colapsable | Prioriza una vista limpia y deja el detalle disponible bajo una acción nativa y accesible | Mostrar toda la metadata abierta antes de las lecturas |
| Fuentes como sección posterior | Separa contenido litúrgico de provenance y evita contaminar la lectura principal | Repetir proveedores y enlaces dentro de cada lista |
| Disponibilidad agregada de fuentes | Evita falsos estados de ausencia cuando Vatican News ya tiene una captura válida | Basar el estado únicamente en la celebración primaria |

### Refinamiento de integración de la lista

La UI construirá una proyección única de contexto a partir de las celebraciones publicadas, sus santos asociados y `supplementalSaints`. La fuente de cada dato seguirá separada en el contrato y en la sección “Fuentes y verificación”, pero nunca se expresará mediante subtítulos distintos dentro de la lista visible. El orden será determinista: celebraciones, santos del Ordo y captura suplementaria, preservando el orden de cada fuente y eliminando solo duplicados exactos para no repetir visualmente un mismo nombre. Los rangos de celebración seguirán como metadato secundario junto al nombre correspondiente.

### Refinamiento visual del bloque

El bloque conservará el componente nativo `<details>` y se alineará visualmente con `VerseCard`: `rounded-lg`, borde sutil, `shadow-lg`, superficie blanca en claro y gris oscuro en dark mode, con el azul marino y dorado ya usados en Daily. El contenido abierto usará menos espacio vertical, una lista semántica con marcadores dorados y etiquetas de temporada/color flexibles. No se añadirán iconos decorativos, nuevas tarjetas anidadas ni estilos que cambien la identidad del resto de la página.

## Trazabilidad hacia RF

| Parte del plan | RF cubiertos |
|---|---|
| Modelo y validator de metadata | RF-2, RF-3, RF-7, RF-8, RF-9 |
| `liturgicalSchedule.js` y `liturgicalCalendar.js` | RF-1, RF-4, RF-5, RF-10, RF-12 |
| `/api/calendar` | RF-4, RF-5, RF-6, RF-12 |
| Daily enriquecido | RF-1, RF-2, RF-3, RF-9, RF-11 |
| Lista pública de santos y presentación compacta | RF-2, RF-4, RF-6, RF-9, RF-11, RF-13 |
| `informationSource` y enlace atribuido en Daily | RF-7, RF-11, RF-12, RF-14 |
| `supplementalSaints`, parser y lista web de nombres | RF-7, RF-9, RF-11, RF-15, RF-19 |
| Proyección unificada de fiestas y santos | RF-2, RF-11, RF-13, RF-15, RF-16, RF-17, RF-18 |
| Sincronización y documentación editorial | RF-7, RF-8, RF-19 |
| Aislamiento del fallo secundario y publicación parcial observable | RF-7, RF-8, RF-15, RF-19 |
| Tests responsive, accesibles y de zona horaria | RF-1 a RF-14 |

## Estrategia de tests

- Unitarios para normalización de celebraciones, rangos, color, santos y clasificación principal/opcional.
- Unitarios para nombres de santos verificados, fuente ausente/no verificada, duplicados, orden editorial y ausencia sin placeholder.
- Fixtures con día ordinario, memoria, fiesta, solemnidad, opciones múltiples, metadata ausente y fuente conflictiva.
- Fixtures de santos con uno, varios, ausente, duplicado y fuente no verificada; el caso de varios debe probar el orden en Daily y calendario.
- Fixtures de `informationSource` presente, ausente, proveedor/URL inválidos, `verified` falso y fuente no coincidente; ningún fixture debe incluir texto biográfico copiado.
- Fixtures de `supplementalSaints` con captura válida, ausencia, fecha incorrecta, nombres múltiples, duplicados y nombre ambiguo; la proyección debe conservar solo nombre y provenance permitido.
- Fixtures del HTML mínimo esperado de Vatican News con fecha válida, fecha incorrecta, estructura ausente, nombres con descriptor y duplicado; el parser debe fallar cerrado y conservar solo nombres inequívocos.
- Tests de calendario mensual para febrero, cambio de año, mes inválido, fechas futuras y fecha sin publicación.
- Tests de resolución de fecha en `America/Santiago`, medianoche y sábado 14:59:59/15:00:00.
- Tests de API para parámetros repetidos, calendario no soportado, datos incompletos y respuesta válida.
- Tests de sincronización para fuente caída, respuesta parcial, conservación de la última entrada y estado stale.
- Tests del job diario para zona horaria chilena, fecha de fuente, idempotencia, escritura solo de la fecha vigente, preservación de campos no relacionados y rechazo sin mutación ante HTML inválido.
- Tests de regresión para encabezados compuestos, descriptores ampliados y Unicode válido observados el 2026-09-20 y 2026-09-21; cada caso debe conservar el orden aprobado y rechazar ambigüedad no resuelta.
- Tests del workflow o una simulación equivalente para confirmar que un fallo de Vatican News conserva su captura anterior, deja estado `partial`/advertencia y no impide validar ni publicar cambios primarios válidos.
- Verificación manual de Daily y calendario en móvil, escritorio, teclado y lector de pantalla.
- Verificación manual de enlaces externos en Daily y Android: nombre accesible, nueva pestaña/intención externa, atribución visible y degradación segura cuando falta `informationSource`.
- Verificación manual de las listas de santos en Daily: nombres verticales, sin tarjetas/separadores/enlaces visibles, disclosure de fuentes accesible por teclado y comportamiento legible en móvil.
- Verificación visual del bloque contra `VerseCard`: superficie, radio, borde, sombra, colores, espaciado, foco y comportamiento en móvil.
- Verificación manual del contexto abierto por defecto, su cierre y reapertura con teclado, la separación posterior de fuentes y la ausencia de mensaje cuando existe únicamente `supplementalSaints`.

### Ajuste de estado inicial aprobado el 2026-09-21

El contexto litúrgico debe iniciar abierto en Daily. La implementación se limita a declarar el estado inicial del `<details>`; no cambia la proyección de datos, el orden de la lista, la provenance ni la sección posterior de fuentes. La regresión cubrirá apertura inicial, cierre/reapertura por teclado y legibilidad responsive.
- Tests de presentación de nombres con `San`/`Santa`, preservación de títulos marianos y ausencia de duplicación de información de fuentes en el contexto principal.
- Tests de proyección unificada: combinación de celebración, santos del Ordo y `supplementalSaints`, deduplicación exacta, orden estable y ausencia de encabezados “Otros” o de separación por proveedor, incluido el caso supplemental-only.
- Ejecutar `npm run validate:daily`, `npm run lint`, `npm run build` y la suite específica antes de marcar tareas.

## Riesgos, migración y rollback

- Riesgo: la fuente cambia sus encabezados o estructura. Mitigación: parser por secciones, fixtures mínimas del contrato, validación completa, workflow visible y conservación de la última versión válida.
- Riesgo: el Ordo y la fuente web discrepan. Mitigación: detener publicación de la fecha, registrar conflicto y resolver editorialmente.
- Riesgo: romper consumidores de `celebration`. Mitigación: alias temporal y migración en dos pasos.
- Riesgo: sobrecargar la cuadrícula con listas extensas de santos. Mitigación: resumen visual acotado, lista accesible completa y detalle en Daily.
- Riesgo: publicar nombres no verificables o duplicados. Mitigación: validación por entrada, provenance por santo y rechazo antes de publicar.
- Riesgo: presentar una URL secundaria incorrecta o una biografía protegida como contenido propio. Mitigación: campo separado, revisión editorial exacta, lista blanca pública de metadata y prohibición de scraping/copia.
- Riesgo: publicar títulos o frases biográficas de `santos.html` como si fueran nombres. Mitigación: extracción editorial explícita, validación de fecha/orden/duplicados y fixture de nombre ambiguo; la UI renderiza únicamente el campo `name`.
- Riesgo: GitHub Actions ejecuta el job con retraso, dos veces o sin permisos de escritura. Mitigación: fecha canónica independiente de UTC, operación idempotente, permisos declarados, commit solo ante diff y fallo visible sin alterar la captura anterior.
- Riesgo: calendario mensual lento o incompleto. Mitigación: derivación local, respuestas resumidas y cache público controlado.
- Rollback: deshabilitar temporalmente el job, revertir el commit de captura si es necesario, ejecutar `npm run validate:daily` y volver a desplegar. No borrar archivos ni historial; la web seguirá sirviendo la última captura válida.
