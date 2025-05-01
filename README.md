# Rhemapp - Aplicación Bíblica

![Logo de Rhemapp](/bible-app/public/Rhemapp_isotype.svg)

## Descripción

Rhemapp es una aplicación web diseñada para acercar la Palabra de Dios a los usuarios de manera interactiva y accesible. El nombre "RHEMA" proviene del griego ῥῆμα que significa "Palabra", y representa la palabra viva de Dios que habla directamente al corazón en el momento presente.

Esta aplicación permite a los usuarios:

- Descubrir versículos bíblicos aleatorios
- Acceder a la lectura del día
- Meditar los misterios del rosario correspondientes a cada día de la semana

## Tecnologías Utilizadas

- **Next.js**: Framework de React para el desarrollo de la interfaz de usuario
- **Tailwind CSS**: Para el diseño y estilizado de componentes
- **Vercel**: Para el hosting y despliegue
- **Bible API**: Para acceder a los textos bíblicos

## Estructura del Proyecto

```
bible-app/
├── public/             # Archivos estáticos
│   ├── data/           # Datos JSON con versículos
│   └── ...             # Iconos e imágenes
├── src/
│   ├── app/            # Rutas y páginas de Next.js
│   │   ├── api/        # API endpoints
│   │   ├── daily/      # Página de lectura diaria
│   │   ├── random/     # Página de versículos aleatorios
│   │   └── rosario/    # Página de misterios del rosario
│   └── components/     # Componentes reutilizables
```

## Funcionalidades Principales

### 1. Página de Inicio

La página principal presenta una introducción a Rhemapp con:

- Una descripción del significado del nombre
- Una cita bíblica destacada (Juan 8:31-32)
- Tres tarjetas de acceso a las principales funcionalidades
- Diseño responsivo y elementos interactivos

### 2. Versículo Aleatorio

Esta función permite explorar versículos bíblicos de manera aleatoria:

- **Implementación**:

  - Carga de versículos desde el archivo JSON local (`/public/data/verses.json`)
  - Sistema de generación de versículos aleatorios sin repetición
  - Historial de navegación entre versículos visitados
  - Interfaz con botones para navegar anterior/siguiente
  - Opción para ver el pasaje completo de cada versículo

- **Características técnicas**:
  - Gestión de estados con React Hooks (useState, useEffect)
  - Sistema de historial para permitir navegación entre versículos vistos
  - Manejo de errores y estados de carga
  - Componente reutilizable VerseCard para la visualización

### 3. Lectura del Día

Presenta un versículo específico para cada día del año:

- **Implementación**:

  - Sistema para determinar la fecha actual
  - Búsqueda de versículos asociados a cada fecha (formato MM-DD)
  - Selección aleatoria de versículo si no hay uno específico para la fecha
  - Visualización con formato destacado de la fecha y versículo

- **Características técnicas**:
  - Formateo de fechas para presentación al usuario
  - Manejo de datos para asociar versículos a fechas específicas
  - Sistema de respaldo para fechas sin versículos asignados
  - Integración con el componente VerseCard

### 4. Misterios del Rosario

Muestra los misterios del rosario correspondientes a cada día de la semana:

- **Implementación**:

  - Sistema para determinar el día de la semana actual
  - Asignación de diferentes tipos de misterios según el día:
    - Lunes y Sábados: Misterios Gozosos
    - Martes y Viernes: Misterios Dolorosos
    - Miércoles y Domingos: Misterios Gloriosos
    - Jueves: Misterios Luminosos
  - Para cada misterio, se muestra:
    - Título del misterio
    - Descripción breve
    - Cita bíblica relacionada
    - Versículo correspondiente
  - Selector interactivo para cambiar entre días de la semana

- **Características técnicas**:
  - Organización de datos estructurados para cada tipo de misterio
  - Interfaz de usuario interactiva con selección de días
  - Componentes visuales para representar cada misterio
  - Iconografía relacionada con el rosario

### 5. Componente VerseCard

Componente reutilizable para mostrar versículos con:

- **Funcionalidades**:

  - Visualización estilizada del versículo y su referencia
  - Botón para ver el pasaje completo
  - Navegación entre versículos (cuando se utiliza en la página de versículos aleatorios)
  - Modal para mostrar el pasaje completo con todos los versículos del capítulo

- **Características técnicas**:
  - Integración con la API de pasajes para obtener el contexto completo
  - Manejo de errores y estados de carga
  - Formateo de HTML para mostrar correctamente los números de versículo
  - Soporte para tema claro/oscuro

### 6. API de Pasajes

La aplicación incluye un endpoint API para obtener pasajes bíblicos completos:

- **Implementación**:

  - Ruta API en Next.js (`/api/passage/route.js`)
  - Conexión con la Bible API externa
  - Procesamiento del contenido para mejorar el formato visual
  - Formateo especial para los números de versículo

- **Características técnicas**:
  - Gestión de solicitudes HTTP
  - Manejo de parámetros de consulta
  - Procesamiento de texto y HTML con expresiones regulares
  - Estructuración de respuesta JSON para consumo desde el frontend

## Tema y Diseño

La aplicación utiliza una paleta de colores específica:

- Azul marino (#314156) para títulos y elementos primarios
- Dorado (#b79b72) para acentos y detalles
- Diseño limpio con tarjetas, sombras y transiciones suaves
- Soporte para tema claro y oscuro

## Configuración y Despliegue

### Requisitos Previos

- Node.js (versión 14 o superior)
- Cuenta en Vercel (para el despliegue)
- API Key de Bible API

### Instalación Local

1. Clonar el repositorio
2. Instalar dependencias:

   ```
   cd bible-app
   npm install
   ```

3. Crear archivo `.env.local` con la API key:

   ```
   NEXT_PUBLIC_BIBLE_API_KEY=tu_api_key_aquí
   ```

4. Iniciar en modo desarrollo:
   ```
   npm run dev
   ```

### Despliegue

1. Conectar tu repositorio con Vercel:

   - Inicia sesión en tu cuenta de Vercel
   - Importa el proyecto desde GitHub
   - Configura las variables de entorno necesarias (NEXT_PUBLIC_BIBLE_API_KEY)

2. Despliegue mediante GitHub:

   - Realizar cambios en el código
   - Preparar los archivos para commit:
     ```
     git add .
     ```
   - Crear un commit con una descripción de los cambios:
     ```
     git commit -m "Descripción de los cambios realizados"
     ```
   - Enviar los cambios al repositorio remoto:
     ```
     git push
     ```
   - Vercel detectará automáticamente los cambios en GitHub y desplegará la nueva versión

3. Verificar el despliegue:
   - Accede al dashboard de Vercel para monitorear el progreso del despliegue
   - Una vez completado, la aplicación estará disponible en la URL proporcionada por Vercel

## Futuras Mejoras Posibles

- Añadir más traducciones bíblicas
- Implementar sistema de búsqueda de versículos por palabra clave
- Añadir función de guardado de versículos favoritos
- Implementar notificaciones diarias
- Crear aplicación móvil con React Native

---

Desarrollado con ❤️ como un regalo especial.
