# Spec 008 — Preferencias de tema

Estado: Completed — pendiente de revisión humana

## Contexto

Rhemapp tiene un botón de tema que alterna entre el tema claro y el oscuro según el tema efectivo actual. Ese comportamiento no permite elegir explícitamente el tema del dispositivo y puede dejar a la persona sin una señal clara de cuál preferencia está seleccionada. La aplicación necesita una preferencia de tema estable, comprensible y recordable.

## Actores

- Persona visitante que usa Rhemapp sin iniciar sesión.
- Persona autenticada que usa Rhemapp en uno o más dispositivos.
- Sistema operativo o navegador, que informa la preferencia `prefers-color-scheme`.

## Historias de usuario

- Como persona usuaria, quiero elegir entre seguir el tema de mi dispositivo, usar claro o usar oscuro, para controlar cómo leo Rhemapp.
- Como persona usuaria autenticada, quiero que mi elección se conserve al volver a iniciar sesión o cambiar de dispositivo.
- Como persona visitante, quiero que mi elección se conserve en este navegador sin que Rhemapp cree datos de cuenta para mí.

## Requisitos funcionales

### RF-1 — Opciones explícitas

CUANDO la persona abre el menú “Perfil y más”, EL SISTEMA DEBE mostrar un control de tema con exactamente estas opciones visibles en español: “Según el dispositivo”, “Claro” y “Oscuro”.

### RF-2 — Preferencia del dispositivo

CUANDO la preferencia seleccionada es “Según el dispositivo”, EL SISTEMA DEBE resolver el tema efectivo usando `prefers-color-scheme` y DEBE actualizarlo cuando cambie la preferencia del sistema operativo o navegador.

### RF-3 — Temas explícitos

CUANDO la persona selecciona “Claro” u “Oscuro”, EL SISTEMA DEBE aplicar el tema elegido inmediatamente, sin depender del tema efectivo que estaba activo antes de la selección.

### RF-4 — Preferencia inicial y selección

CUANDO no existe una preferencia válida guardada para la persona, EL SISTEMA DEBE usar “Según el dispositivo” y DEBE mantener “Según el dispositivo” como opción seleccionada aunque el tema efectivo resuelto sea claro u oscuro.

### RF-5 — Persistencia por usuario autenticado

CUANDO una persona autenticada cambia su preferencia, EL SISTEMA DEBE guardar el valor (`system`, `light` u `dark`) en el perfil de esa persona y DEBE restaurarlo al cargar su sesión en otro dispositivo o navegador.

### RF-6 — Persistencia local para visitantes

CUANDO una persona no autenticada cambia su preferencia, EL SISTEMA DEBE guardarla solamente en el almacenamiento local de ese navegador y DEBE aplicarla en visitas posteriores del mismo navegador.

### RF-7 — Compatibilidad y fallos

SI existe la clave local heredada `theme` con valor `light` u `dark`, EL SISTEMA DEBE migrarla a la preferencia explícita equivalente. SI la persistencia remota falla, EL SISTEMA DEBE conservar la elección aplicada localmente y mostrar un mensaje accionable en español sin exponer detalles técnicos.

### RF-8 — Accesibilidad y paridad responsive

EL SISTEMA DEBE ofrecer el mismo selector en las variantes de escritorio y móvil, con controles de teclado, nombre accesible, estado seleccionado perceptible y objetivos táctiles adecuados.

## Requisitos no funcionales

- La selección y la aplicación del tema deben usar los identificadores técnicos `system`, `light` y `dark`; la interfaz solo debe mostrar etiquetas en español.
- El tema inicial debe aplicarse antes de la interacción para minimizar el destello de tema durante la hidratación.
- La API debe validar el enum en servidor y mantener la autorización de propiedad del perfil mediante las políticas de datos existentes.
- La preferencia no debe incluir secretos ni información sensible adicional.
- La interfaz debe conservar el lenguaje visual actual, admitir claro/oscuro y respetar foco visible y `prefers-reduced-motion`.
- Los errores de persistencia deben registrarse sin tokens, notas privadas ni contenido de usuario.

## Casos límite

- El sistema operativo cambia de claro a oscuro mientras está seleccionada la opción “Según el dispositivo”.
- El sistema operativo cambia de tema mientras está seleccionada una opción explícita; el tema explícito no debe cambiar.
- El valor almacenado es inválido, está ausente o el almacenamiento local no está disponible.
- La preferencia local se aplica antes de que termine de cargarse la sesión autenticada.
- La persona cambia la preferencia mientras la sesión todavía se está resolviendo.
- La actualización del perfil falla por red, sesión expirada o error de persistencia.
- El perfil remoto no tiene todavía una preferencia; debe interpretarse como “Según el dispositivo”.
- La navegación móvil y de escritorio debe exponer el mismo estado seleccionado.

## Exclusiones

- No se crean temas de color personalizados.
- No se modifica la paleta litúrgica ni el contenido de las lecturas.
- No se añade un segundo formulario de configuración en la página de perfil; el selector vive en “Perfil y más”.
- No se cambian íconos de la aplicación ni se implementa un tema por página.

## Criterios de completitud

- RF-1 a RF-8 tienen implementación y evidencia en `validation.md`.
- La migración de perfil está versionada con el flujo soportado de Supabase y tiene una restricción para los tres valores.
- Existen pruebas reproducibles para la resolución del tema, validación de API, contrato de persistencia y controles de UI.
- `npm run lint`, `npm run build` y las pruebas relevantes pasan.
- Se verifica manualmente el selector en escritorio y móvil, incluyendo el estado “Según el dispositivo” cuando el sistema está en oscuro.

## Preguntas abiertas

No quedan preguntas abiertas: la persistencia local para visitantes y remota para personas autenticadas forma parte del comportamiento aprobado de esta spec.
