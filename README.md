# 🎯 El Consenso — Asistente de Juego Unanimo

Este proyecto es una Progressive Web App (PWA) de tipo mobile-first diseñada para funcionar como asistente en mesa del juego Unanimo. El objetivo es proporcionar una experiencia inmersiva, interactiva, rápida y sin necesidad de conexión estable a internet (offline).

Para conocer el plan de avance detallado por fases físicas de entrega, consulta el archivo **[implementacion etapas.md](file:///c:/Users/leone/OneDrive/Documentos/El%20consenso/implementacion%20etapas.md)**.

---

## 🛠️ Directivas Generales de Desarrollo

Para mantener el código ordenado, mantenible y alineado con los estándares del proyecto, se deben respetar las siguientes directivas:

### 1. Arquitectura de Carpetas (React + Vite)
El proyecto se organizará bajo la siguiente estructura estándar:

```text
el-consenso/
├── public/                 # Favicons, manifest.json, iconos de la PWA e imágenes estáticas
├── src/
│   ├── assets/             # Fuentes, estilos globales y assets de imagen/vector
│   ├── components/         # Componentes de UI reutilizables (Botones, Chips, Steppers, Modales)
│   ├── context/            # Contextos globales de React (GameContext, UIContext)
│   ├── hooks/              # Custom hooks (useTimer, useAudio, useWakeLock)
│   ├── screens/            # Pantallas principales de la SPA (Home, Setup, Game, Scoreboard, Podium)
│   ├── services/           # Lógica del LocalStorage y la base de categorías original
│   ├── App.jsx             # Punto de entrada de la UI y ruteador interno
│   ├── main.jsx            # Punto de entrada de React
│   └── index.css           # Estilos globales y tokens CSS de Tailwind
├── tests/                  # Carpeta contenedora de pruebas automatizadas (Vitest/Playwright)
├── vite.config.js          # Configuración de Vite y del plugin PWA
└── tailwind.config.js      # Configuración de los tokens de color del juego
```

### 2. Gestión del Estado
*   **Estado Global (`GameContext`):** Toda la información de la partida actual (lista de jugadores, configuraciones, ronda activa, historial de puntuación) se gestionará en un contexto centralizado de React.
*   **Persistencia:** La lectura/escritura en `localStorage` (para categorías modificadas y el historial general) se manejará a través de métodos encapsulados en un servicio especializado (`services/storage.js`) con manejo de errores para evitar inconsistencias.
*   **Estado Local:** El estado transitorio (por ejemplo, el valor de entrada actual de un campo de texto o el temporizador en segundos de la ronda) debe vivir a nivel de componente o custom hook local.

### 3. Reglas de CSS y Estilos (Tailwind CSS)
*   **Clases Temáticas:** No se deben hardcodear colores ad-hoc. En su lugar, se deben utilizar las variables temáticas de Tailwind configuradas en `tailwind.config.js`:
    *   Fondo: `bg-space-dark` (`#1A1A2E`)
    *   Acento principal: `bg-neon-purple` (`#7C3AED`) o `text-neon-purple`
    *   Acento secundario: `text-neon-green` (`#06D6A0`) o `bg-neon-green`
    *   Alerta: `bg-neon-red` (`#FF6B6B`) o `text-neon-red`
*   **Responsive:** Diseñar siempre priorizando pantallas de móviles de 360px a 480px de ancho (*mobile-first*). Usar flexbox y grid para asegurar que escale estéticamente a pantallas de tablets u computadoras.

### 4. Directivas de Audio e Interacción
*   **Restricciones del Navegador:** Los navegadores móviles bloquean el audio automático. Es **obligatorio** que la primera reproducción de sonido (los beeps de cuenta regresiva al pulsar "JUGAR") sea desencadenada por una acción explícita del usuario (un evento `click` o `touchstart`).
*   **Tone.js:** No se usarán archivos `.mp3` ni `.wav` para beeps o alarmas. Los tonos se sintetizarán programáticamente para garantizar peso ultraligero y velocidad en la PWA.

### 5. Estándar de Pruebas
*   Cualquier refactorización o cambio en la lógica del temporizador o la fórmula de puntuación debe estar respaldado por la ejecución y corrección de sus tests unitarios correspondientes en `/tests`.

---

## 📋 Checklist de Progreso General

Usa este checklist interactivo para medir el avance del desarrollo:

*   [x] **Etapa 1: Cimientos y Configuración Base**
    *   [x] Proyecto inicializado con React + Vite.
    *   [x] Tailwind CSS configurado con los colores temáticos.
    *   [x] Base de datos placeholder y store del `localStorage` inicializados.
    *   [x] Estructura PWA inicial (Service Worker y `manifest.json`).
*   [x] **Etapa 2: Flujo de Inicio y Configuración de Partida**
    *   [x] Pantalla Home diseñada con el historial del local storage.
    *   [x] Formulario de configuración (jugadores, rondas, tiempo).
    *   [x] Listado de categorías (chips interactivos).
    *   [x] Modal de edición de palabras (long press en chips de categoría).
*   [x] **Etapa 3: Ciclo de Juego (Ronda Activa)**
    *   [x] Cuenta regresiva 3, 2, 1 con sonido (beeps de Tone.js).
    *   [x] Web Speech API integrada para lectura de categorías en voz alta.
    *   [x] Temporizador SVG circular con cambio de color y pulso visual a los 10 segundos finales.
    *   [x] Wake Lock API implementada para prevenir el bloqueo de la pantalla.
    *   [x] Botón "Terminar ya" y alarma de fin de ronda (Tone.js buzzer).
*   [x] **Etapa 4: Conteo de Puntos y Marcadores**
    *   [x] Interfaz de entrada de puntajes con stepper e inputs de teclado.
    *   [x] Aplicación de la fórmula matemática de puntos de Unanimo.
    *   [x] Marcador de rondas con historial de puntuación y cálculo del delta de posiciones (flechas de subida/bajada).
*   [x] **Etapa 5: Podio y Lanzamiento PWA**
    *   [x] Pantalla del podio animada con fanfarria triunfal y confetti.
    *   [x] Carga final del banco de categorías (50+ categorías).
    *   [x] Toggles de silencio para sonidos y voz en la UI.
    *   [x] Generación y registro de iconos PWA definitivos.
    *   [x] Configuración del Service Worker offline lista y deploy en Vercel.
