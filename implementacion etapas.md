# 🗺️ Plan de Implementación por Etapas: El Consenso (v2.0)

Este documento detalla la hoja de ruta paso a paso para el desarrollo de **El Consenso**, la app asistente para el juego Unanimo. El desarrollo se ha estructurado en **5 etapas incrementales**, asegurando que cada etapa sea funcional y testeable antes de avanzar a la siguiente.

---

## 🎨 Sistema de Diseñó (Identidad Visual)
Para todas las pantallas aplicaremos la referencia estética del documento:
*   **Fondo:** `#1A1A2E` (Espacio oscuro / Among Us vibe).
*   **Acento Principal:** `#7C3AED` (Violeta vibrante para botones de acción principal, headers y destaques).
*   **Acento Secundario:** `#06D6A0` (Verde esmeralda para confirmaciones, aciertos y aumento de posiciones).
*   **Alerta / Fin:** `#FF6B6B` (Rojo coral para final de tiempos, advertencias y descenso de posiciones).
*   **Texto Principal:** `#FFFFFF` (Sobre fondos oscuros).
*   **Texto Secundario:** `#9CA3AF` (Gris suave para subtítulos y ayudas).
*   **Tipografía:** Display sin serif, negritas exageradas y títulos en mayúsculas para transmitir el tono de un party game nocturno.

---

## 🏗️ Etapas de Desarrollo

### 📍 Etapa 1: Cimientos del Proyecto y Configuración Base
El objetivo de esta etapa es inicializar el entorno de desarrollo y establecer las bases tecnológicas y estilísticas del proyecto.

1.  **Inicialización de Proyecto:**
    *   Crear la aplicación con React + Vite.
    *   Configurar **Tailwind CSS** con la paleta de colores personalizada definida en la identidad visual.
    *   Estructurar el ruteo interno (o control de vistas por estado reactivo para mantenerlo rápido y ligero).
2.  **Capa de Datos Local (Store):**
    *   Definir la estructura del estado global en memoria de sesión o un Context simple.
    *   Crear el banco de categorías precargadas (usando categorías iniciales como placeholders, ya que pueden cambiar).
    *   Implementar helpers para leer y escribir el historial y categorías personalizadas en `localStorage`.
3.  **Configuración de PWA Básica:**
    *   Crear el archivo `manifest.json` inicial con los metadatos requeridos (`theme_color`, `background_color`, etc.).
    *   Configurar un Service Worker simple para el cacheo básico de assets y preparación del soporte offline.

---

### 📍 Etapa 2: Home y Configuración de Partida (El Setup)
En esta etapa implementamos la gestión de datos previa al juego y la pantalla principal.

1.  **Pantalla de Home (Inicio):**
    *   Diseñar el logotipo de estilo neón/Among Us en tipografía grande y audaz.
    *   Botón "En la Mesa" (navega a Configuración).
    *   Botón "Online" (abre un modal interactivo estilizado: *"Proximamente disponible 🚀"*).
    *   Lista de historial (lee del localStorage y muestra partidas previas con fecha, hora, ganador y tap para ver tabla final).
2.  **Pantalla de Configuración de Partida:**
    *   **Gestión de Jugadores:** Entrada de texto para agregar jugadores y chips visuales con botón `[X]` para eliminarlos (mínimo 2 jugadores).
    *   **Configuración del Juego:**
        *   Selector de Rondas (1-10) con una opción para activar "Rondas Infinitas".
        *   Selector de Tiempo (+/- Stepper de 5s en 5s, rango 30s-180s, default 75s).
        *   Toggle de "Llevar Puntaje" (si se desactiva, se omite la pantalla de conteo y marcadores).
3.  **Administrador de Categorías (Chips):**
    *   Renderizar las categorías activas como chips/pills seleccionables (tap activa/desactiva).
    *   Botón `[+]` para agregar categorías propias personalizadas.
    *   **Interacción Avanzada (Long Press):**
        *   Abrir un modal con la lista de palabras de la categoría seleccionada.
        *   Permitir agregar y quitar palabras individuales.
        *   Botón de "Restaurar por defecto" (para categorías predefinidas modificadas).
        *   Botón de "Eliminar Categoría" (únicamente habilitado para categorías propias).

---

### 📍 Etapa 3: El Ciclo de Juego Activo (Pantalla de Ronda)
Aquí es donde el juego cobra vida. Esta etapa incluye la mayor cantidad de APIs de hardware de navegador (Sonidos, Voz, Pantalla).

1.  **Cuenta Regresiva Inicial:**
    *   Al hacer tap en "JUGAR", mostrar una pantalla con una cuenta regresiva 3... 2... 1... interactiva y grande.
    *   Integrar Tone.js para reproducir beeps ascendentes coordinados con los números.
2.  **Visualización de la Categoría:**
    *   Mostrar el nombre de la categoría elegida aleatoriamente (sin repetición) en tamaño display (48px+).
    *   Integrar **Web Speech API** para que el celular lea la categoría en español neutro automáticamente al iniciar la ronda.
3.  **Temporizador SVG Circular:**
    *   Crear un círculo SVG interactivo que se vacíe progresivamente conforme transcurre el tiempo.
    *   Visualizar el número de segundos restantes dentro del círculo.
    *   **Últimos 10 segundos:** Cambiar el contorno del SVG a rojo (`#FF6B6B`), aplicar un pulso de animación CSS y disparar un sonido de tictac sutil en cada segundo restante.
4.  **Botonera de Control:**
    *   Botón "Terminar ya" que aparece recién a los 10 segundos de iniciada la ronda para evitar toques accidentales. Al pulsarlo, corta el tiempo inmediatamente y detiene el temporizador.
5.  **Control de Hardware:**
    *   Implementar la **Wake Lock API** (`navigator.wakeLock.request('screen')`) para asegurar que la pantalla del celular no se apague en mitad de una ronda. Liberar el Wake Lock al finalizar la ronda o salir de la pantalla.
    *   Al llegar a 0, disparar un sonido de alarma tipo "buzzer" contundente mediante Tone.js.

---

### 📍 Etapa 4: Conteo de Puntos y Marcadores
El flujo de entrada de datos después de jugar. Esta etapa se activa solo si "Llevar Puntaje" está habilitado.

1.  **Pantalla de Conteo de Puntos:**
    *   Mostrar el indicador "Ronda X de Y" (o simplemente "Ronda X" si es infinito).
    *   Listar a todos los jugadores participantes. Al lado de cada uno, colocar un stepper de puntos (+/-) y permitir la entrada numérica directa con teclado táctil.
    *   *Nota de UX:* Facilitar la introducción rápida con validaciones. El puntaje máximo por jugador está limitado por la fórmula: `Jugadores × 8`.
    *   **Fórmula del Juego:**
        *   0 coincidencias = 0 puntos.
        *   1 coincidencia = 2 puntos.
        *   2 coincidencias = 3 puntos.
        *   N coincidencias = N + 1 puntos.
2.  **Marcador entre Rondas:**
    *   Mostrar la tabla de clasificación ordenada de forma descendente (del primer al último puesto).
    *   Mostrar el delta de la ronda al lado del puntaje (`+X pts` en verde).
    *   Implementar un sistema de comparación con la ronda anterior para mostrar:
        *   🟢 Flecha arriba si el jugador subió de posición.
        *   🔴 Flecha abajo si el jugador bajó de posición.
        *   Sin flecha si el jugador se mantuvo en el mismo puesto.
    *   Botón "Siguiente Ronda" (vuelve al ciclo de la etapa 3) o "Finalizar Partida" (si está en modo infinito).

---

### 📍 Etapa 5: Podio, PWA Final y Ajustes de UX
La etapa final de pulido y empaquetamiento para producción.

1.  **Podio Final:**
    *   Crear una pantalla celebratoria con posiciones de podio clásica (1er puesto en el centro y más alto, 2do a la izquierda, 3ro a la izquierda).
    *   Animar la pantalla con efectos visuales (efecto confetti animado) y reproducir una fanfarria triunfal corta con Tone.js.
    *   Botón "Otra Partida" (carga la misma lista de jugadores y configuraciones de ronda de forma automática).
    *   Botón "Menú Principal" (reinicia el juego y registra la partida en el historial de localStorage).
2.  **Llenado del Banco de Categorías:**
    *   Completar el listado de categorías iniciales hasta superar las 50 categorías (comidas, deportes, geografía, cultura pop, etc.). *Se definirá en un archivo JS independiente para fácil edición.*
3.  **Toggles de Sonido y Voz:**
    *   Agregar controles de silencio rápidos en la barra de navegación superior o configuración:
        *   Toggle para silenciar sonidos (beeps, buzzer, tictac).
        *   Toggle separado para silenciar la lectura de voz alta (Web Speech API).
4.  **Optimización PWA y Deploy:**
    *   Generar los iconos de la app en resoluciones `192x192` y `512x512` con diseño premium.
    *   Asegurar que el Service Worker almacene de forma confiable todos los archivos estáticos de la aplicación para un funcionamiento 100% offline.
    *   Desplegar el proyecto en **Vercel** (`porconsenso.vercel.app`).

---

## 🧪 Estrategia de Pruebas y Herramientas de Comprobación ("Debug Mode")

Para asegurar que cada etapa funcione correctamente y facilitar el desarrollo ágil, se contempla una estrategia mixta de **tests automatizados** y **herramientas utilizables de comprobación rápida** (Debug tools).

### 1. ⚙️ Herramientas de Comprobación en Desarrollo ("Utilizables")
Jugar una partida entera de 10 rondas para probar el podio o el historial es ineficiente en desarrollo. Implementaremos un **Panel de Debug en Desarrollo** (`process.env.NODE_ENV === 'development'`) invisible en producción con las siguientes utilidades:
*   **Auto-Completar Setup:** Un botón para agregar automáticamente 4 jugadores de prueba y configurar una ronda rápida de 30 segundos.
*   **Fast-Forward (Avanzar Tiempo):** Un botón en la pantalla de ronda que reduce el tiempo restante a 2 segundos para testear la transición al buzzer y el pulso rojo de forma inmediata.
*   **Inyector de Historial Mock:** Función para pre-cargar el localStorage con 5 o 10 partidas simuladas (con distintos ganadores, fechas y puntajes) para verificar el funcionamiento y diseño de la lista del Home al instante.
*   **Simulador de Hardware (Mocks):** Interruptor para mockear el comportamiento de la Web Speech API y la Wake Lock API si no se está en un dispositivo compatible (ej: navegadores antiguos o entornos de test).

### 2. 🧪 Implementación de Tests Automatizados
La suite de pruebas se organizará de la siguiente manera:

*   **Tests Unitarios (Vitest):**
    *   *Fórmula de Puntos:* Validar matemáticamente que el calculador de puntos funcione según las reglas (`0 coincidencias = 0 pts`, `1 coincidencia = 2 pts`, etc.).
    *   *Lógica del Banco:* Validar que el algoritmo de selección aleatoria baraje las categorías y no las repita hasta agotar el mazo.
    *   *Helpers de LocalStorage:* Validar el correcto guardado, recuperación y sanitización de las categorías personalizadas e historial.
*   **Tests de Componentes / Integración (React Testing Library):**
    *   *Validación del Setup:* Comprobar que el botón "JUGAR" esté deshabilitado si hay menos de 2 jugadores.
    *   *Editor de Categorías:* Verificar que al editar palabras en una categoría, el cambio se guarde en el estado y se refleje en la UI.
*   **Tests End-to-End (E2E) (Playwright):**
    *   *Flujo Completo:* Simular a un usuario creando una partida, jugando 3 rondas virtuales, cargando puntajes y llegando al podio.
    *   *Prueba Offline de la PWA:* Playwright simulará la desconexión de internet (`context.setOffline(true)`) para asegurar que los assets carguen correctamente desde el Service Worker.

---

## 🛠️ Próximos Pasos Recomendados

Para iniciar el desarrollo, se sugiere seguir el siguiente orden práctico:
1.  **Confirmar si las tecnologías son correctas:** El uso de **Tone.js** y **Web Speech API** es excelente para desarrollo web, pero requieren interacción inicial del usuario para poder reproducir audios (política del navegador). Por eso el primer botón "JUGAR" de la pantalla de configuración servirá para activar el contexto de audio.
2.  **Iniciar con Etapa 1:** Crear el andamiaje del proyecto en Vite para comenzar a codificar los estilos base y la paleta de colores.
