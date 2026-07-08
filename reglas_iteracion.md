# 🛡️ Reglas de Calidad y Buenas Prácticas por Iteración

Este documento define los estándares de desarrollo, diseño móvil y control de calidad que se deben cumplir estrictamente en **cada iteración de código** para garantizar la estabilidad y rendimiento de **El Consenso**.

---

## 💻 1. Convenciones de Código (Clean Code en React)

*   **Principio de Responsabilidad Única (SRP):**
    *   Mantener los componentes de React pequeños y enfocados en una sola cosa. Si un componente supera las **150 líneas de código**, evalúa refactorizar elementos internos a subcomponentes o mover la lógica a un *custom hook*.
*   **Encapsulamiento de Efectos y Eventos:**
    *   Toda lógica compleja de efectos secundarios (como listeners de temporizadores, inicialización de Tone.js, suscripción a eventos de red/offline) debe aislarse en **custom hooks** personalizados (ej. `useTimer`, `useSpeech`, `useWakeLock`).
*   **Prevención de Renderizados Inútiles:**
    *   Evita cálculos pesados dentro del render de React. Utiliza `useMemo` para cálculos complejos (como la fórmula de puntos o el ordenamiento del podio).
    *   Pasa funciones estables a componentes hijos utilizando `useCallback` en manejadores de clicks y cambios.
*   **Limpieza de Eventos y Suscripciones:**
    *   Siempre retorna una función de limpieza (`cleanup`) en los `useEffect` que utilicen `setInterval`, `setTimeout`, listeners de teclado, Web Speech API o Wake Lock para prevenir fugas de memoria (*memory leaks*).

---

## 🎨 2. Experiencia y Diseño Móvil (Mobile-First UX)

*   **Áreas Táctiles Mínimas (Touch Targets):**
    *   Todos los elementos interactivos (botones, steppers, selectores, chips) deben tener un área táctil mínima de **48x48 píxeles** para evitar errores de selección en pantallas pequeñas.
*   **Prevención de Zoom Automático (iOS):**
    *   Todos los inputs de texto o numéricos deben tener un tamaño de fuente de al menos **16px** (Tailwind `text-base`). Si la fuente es menor a 16px, iOS hace zoom automático al hacer focus, rompiendo la maquetación.
*   **Viewport Fijo:**
    *   La aplicación no debe permitir el scroll horizontal bajo ninguna circunstancia. El contenedor raíz debe contar con `overflow-x-hidden` y diseño flexible (`h-screen flex flex-col`).
*   **Estilos en Línea Prohibidos:**
    *   No usar estilos directos (`style={{...}}`) a menos que sea estrictamente necesario para propiedades puramente dinámicas (ej. el cálculo en tiempo real de `strokeDasharray` en el SVG circular o el ancho de una barra de progreso). Todo lo demás debe usar clases de Tailwind CSS.

---

## 🔉 3. Manejo de APIs del Navegador (Sonido y Voz)

*   **Silencio por Defecto y Activación Obligatoria:**
    *   Debido a las políticas de seguridad de los navegadores, las APIs de Audio no pueden iniciar sin interacción. El flujo debe estar diseñado para que el usuario haga una primera acción táctil que "desbloquee" o inicialice el contexto de Tone.js de forma silenciosa.
*   **Manejo de Errores Robustos:**
    *   Las APIs de hardware de navegador móvil (`SpeechSynthesis` y `WakeLock`) fallan frecuentemente debido a restricciones del sistema operativo, modo de bajo consumo o compatibilidad.
    *   Todo bloque de llamada a estas APIs debe estar encapsulado en un bloque `try/catch` para evitar que la aplicación entera crashee si la API no está disponible o es rechazada por el sistema.

---

## 🚀 4. Definición de Hecho (Definition of Done) para cada Iteración

Antes de dar por completada una tarea o subir un cambio de código, verifica lo siguiente:

1.  **Sin Advertencias del Linter:** No debe haber variables no utilizadas, importaciones huérfanas ni errores de sintaxis en la consola de desarrollo.
2.  **Verificación de Build:** Ejecutar la compilación de producción localmente para confirmar que el compilador no arroje ningún error:
    ```bash
    npm run build
    ```
3.  **Tests en Verde:** Si la lógica modificada cuenta con pruebas automatizadas, se deben ejecutar y asegurar que el 100% de los casos pasen con éxito:
    ```bash
    npm run test
    ```
4.  **Consola Limpia:** Remover cualquier instrucción temporal de depuración (`console.log`, `debugger`, variables mock locales) antes de persistir los cambios, a menos que formen parte deliberada de la UI del *Panel de Debug*.
