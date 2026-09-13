# Prompts de trabajo SDD

Estos prompts son una guía reusable. Cada agente debe adaptarlos nombrando la spec y los archivos concretos, pero no debe saltarse fases.

## Constitución

```text
Lee el contexto actual del repositorio. Propón cambios para docs/constitution.md con principios cortos, verificables y no negociables sobre simplicidad, relación entre spec y código, contenido litúrgico, seguridad, tests, idioma y tiempo. No escribas código. Espera aprobación humana.
```
## Spec

```text
NO escribas código. Lee docs/constitution.md y la idea de producto. Haz preguntas de una en una para eliminar ambigüedades, casos límite, errores y alcance. Máximo seis preguntas. Después genera specs/NNN-feature/spec.md con contexto, actores, historias de usuario, RF numerados en notación EARS, requisitos no funcionales, casos límite, fuera de alcance, criterios de finalización y dudas abiertas. Define el QUÉ y el POR QUÉ, no el stack ni los nombres de archivos.
```

## Clarificación

```text
Revisa specs/NNN-feature/spec.md como QA profesional y lee docs/constitution.md. Lista por separado ambigüedades, contradicciones, casos límite ausentes y conflictos con la constitución. No propongas una implementación ni ocultes dudas. Después de la revisión humana, registra las respuestas aprobadas en clarifications.md.
```

## Plan

```text
Lee docs/constitution.md, spec.md y clarifications.md. NO escribas código. Genera plan.md con arquitectura afectada, módulos, modelo de datos, contratos, migraciones, decisiones justificadas, alternativas descartadas, estrategia de pruebas, riesgos y trazabilidad de cada parte hacia los RF.
```

## Tareas

```text
A partir de spec.md, clarifications.md y plan.md, genera tasks.md. Divide el trabajo en tareas pequeñas de aproximadamente 20–30 minutos, ordenadas por dependencia. Cada tarea debe tener checkbox, ID, RF que cubre y una línea "Hecho cuando:" verificable. No agregues alcance que no esté en la spec.
```

## Implementación

```text
Implementa SOLO la tarea Tn de specs/NNN-feature/tasks.md. Lee AGENTS.md, docs/constitution.md, spec.md, clarifications.md y plan.md. Escribe o actualiza primero los tests relevantes y luego el código. Ejecuta las verificaciones indicadas. Marca Tn como completa solo si hay evidencia. Indica los RF cubiertos y PÁRATE; no empieces la siguiente tarea.
```

## Validación

```text
Lee la spec completa y recorre cada RF en orden. Para cada uno indica qué test o evidencia manual lo cubre y su resultado. Comprueba requisitos no funcionales, casos límite, fuera de alcance y criterios de finalización. Termina con un veredicto explícito: SPEC CUMPLIDA o SPEC NO CUMPLIDA, con los pendientes.
```

## Cambio

```text
Nuevo requisito o cambio de comportamiento: <descripción>. NO toques código. Actualiza primero spec.md con los nuevos RF, casos límite y fuera de alcance; muestra el diff. Después de aprobación, actualiza clarifications.md, plan.md y tasks.md antes de implementar.
```
