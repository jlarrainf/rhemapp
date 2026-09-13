# Constitución — Rhemapp

Estado: Activa

Estos principios son innegociables. Toda spec, clarificación, plan, tarea, implementación y validación debe respetarlos. Esta constitución solo cambia cuando cambia un principio del proyecto, no para resolver una decisión puntual de una funcionalidad.

1. **La spec expresa la intención:** ningún comportamiento nuevo se implementa si no está definido y aprobado en la spec activa.
2. **Simplicidad antes que infraestructura:** se reutiliza el stack actual y se añade complejidad solo cuando una necesidad concreta la justifica.
3. **Contenido confiable:** las lecturas, referencias y celebraciones deben conservar su fuente, licencia y estado de verificación; nunca se inventan datos litúrgicos.
4. **Lógica separada de interfaz:** reglas de calendario, permisos, persistencia y contenido viven fuera de los componentes visuales y son testeables de forma independiente.
5. **Seguridad por defecto:** autenticación, autorización, privacidad, secretos y validación se resuelven en servidor y en la capa de datos; ocultar un botón no es control de acceso.
6. **Tests como puerta:** una tarea no se marca completa con tests relevantes fallando; los casos de fecha, propiedad y permisos deben tener cobertura explícita.
7. **Human in the loop:** la persona responsable revisa la spec, clarificaciones, plan, código, tests y validación antes de aceptar el resultado.
8. **Idioma coherente:** código e identificadores están en inglés; toda interacción y contenido visible para usuarios está en español.
9. **Tiempo explícito:** las fechas de dominio usan `YYYY-MM-DD` y el calendario chileno usa `America/Santiago`; los cambios horarios deben tener tests de frontera.
10. **Evolución trazable:** toda modificación de comportamiento actualiza primero la spec y mantiene trazabilidad entre RF, tareas, tests y validación.
