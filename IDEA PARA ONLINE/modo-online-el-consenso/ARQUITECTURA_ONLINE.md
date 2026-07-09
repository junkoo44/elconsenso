# 🏗️ Arquitectura del Modo Online — "El Consenso"

Este documento explica cómo se implementó el modo multi-dispositivo, para que sirva como referencia cuando lo extiendas o lo debuguees. Complementa a `implementacion etapas.md` (que describe el modo local original) sin reemplazarlo.

---

## 1. Decisión de arquitectura: por qué Firebase Realtime Database

El problema de fondo es que **Vercel no sostiene WebSockets persistentes** en sus funciones serverless. Cualquier solución de "tiempo real" necesita un backend externo que mantenga el estado y empuje cambios a todos los dispositivos conectados.

Se eligió **Firebase Realtime Database (RTDB)** por tres razones concretas:

1. **Ya la conocés** (Firebase Auth en Nestify) — cero curva de aprendizaje para entender la consola y el modelo mental del SDK.
2. **Sincronización automática sin escribir un servidor propio.** RTDB expone `onValue()`: te suscribís a un nodo del JSON y React se re-renderiza solo cada vez que cambia, sin sockets manuales ni polling.
3. **El modelo de datos encaja perfecto con un juego de salas.** Una sala es literalmente un nodo JSON (`salas/ABCDE`) con jugadores, ronda actual y puntajes adentro. No hace falta modelar relaciones ni tablas — por eso se prefirió sobre Supabase/Postgres, que brilla más cuando necesitás SQL, no cuando necesitás "un objeto que todos ven en vivo".

**Costo de esta decisión:** no hay servidor autoritativo validando reglas de negocio (por ejemplo, nada impide hoy que un jugador cambie sus propias palabras después de enviarlas, aparte de la UI). Para un juego de amigos esto es aceptable; si en algún momento se necesita anti-cheat real, ver la sección 6 (Extensiones futuras).

---

## 2. Los dos modos conviven, no se pisan

```
src/context/
  GameContext.jsx         ← YA EXISTÍA. Maneja el modo local (un solo celu, localStorage).
  OnlineGameContext.jsx    ← NUEVO. Maneja el modo online (multi-dispositivo, Firebase).
```

Ninguno de los dos contexts sabe que el otro existe. `App.jsx` sigue usando `vistaActual` de `GameContext` como el único router de la app (ver sección 3) — así evitamos meter una librería de routing (`react-router`) para lo que sigue siendo, en esencia, una máquina de estados de pantallas.

**Por qué no se fusionaron en un solo Context:** el modo local es síncrono y vive en memoria/localStorage; el modo online es asíncrono y vive en un stream de Firebase. Mezclarlos hubiera significado meter `if (esOnline)` adentro de cada función del `GameContext` viejo, ensuciando código que ya funciona y está testeado. Separarlos es más código total, pero cada uno es más simple de leer.

---

## 3. Ruteo: se reutiliza el patrón existente, no uno nuevo

La app ya rutea por `switch(vistaActual)` en `App.jsx` en vez de usar una librería de routing. Se mantuvo ese mismo patrón y simplemente se agregaron los casos nuevos:

```
'online-home'        → OnlineHome.jsx        (elegir crear o unirse)
'online-crear'        → CrearSala.jsx
'online-unirse'        → UnirseSala.jsx
'online-lobby'        → LobbySala.jsx
'online-ronda'        → RondaOnline.jsx
'online-revelacion'    → RevelacionOnline.jsx
'online-podium'        → PodiumOnline.jsx
```

**Deep link (`/sala/ABCDE`):** como no hay `react-router`, el link compartible se resuelve a mano en dos puntos:
- `App.jsx` lee `window.location.pathname` una sola vez al montar; si matchea `/sala/:codigo`, navega directo a `online-unirse` con el código precargado.
- `OnlineGameContext.jsx` hace `window.history.pushState(...)` cada vez que se crea o se entra a una sala, para que la URL en la barra del navegador quede compartible sin recargar la página.

Si en algún momento el proyecto crece y necesita rutas anidadas de verdad, este es el primer lugar donde valdría la pena migrar a `react-router` — pero para 7 pantallas no se justificaba la dependencia todavía.

---

## 4. Modelo de datos en Firebase

Un único nodo raíz por partida: `salas/{codigoSala}`.

```
salas/ABCDE/
  host: "jugadorId-del-creador"
  estado: "lobby" | "jugando" | "revelando" | "finalizada"
  config: {
    rondas: 5 | "infinito",
    tiempo: 75,
    revelarGradual: true,     // el toggle del "velo"
    categoriasActivas: ["id1", "id2", ...]
  }
  jugadores: {
    "jugadorId1": { nombre: "Leo", conectado: true, esHost: true },
    "jugadorId2": { nombre: "Rosset", conectado: true, esHost: false }
  }
  rondaActual: 1
  categoriaActual: { id, nombre, palabras: [...] }   // objeto completo, no solo el id
  palabraActual: "Perro"
  lector: "jugadorId1"                                // rota cada ronda, igual que en modo local
  categoriasJugadas: ["id1"]                          // evita repetir categoría en la misma partida
  palabrasEnviadas: {
    "jugadorId1": ["ladra", "correa", "hueso", ...],
    "jugadorId2": ["correa", "pelota", ...]
  }
  ordenRevelacion: ["jugadorId1", "jugadorId2", ...]  // fijo por ronda, orden de "turno de orador"
  turnoRevelacion: 0                                   // índice dentro de ordenRevelacion, avanza con el velo
  puntosRondaActual: { "jugadorId1": 3, "jugadorId2": 3 }
  detalleCoincidencias: [
    { palabra: "correa", jugadoresIds: ["jugadorId1","jugadorId2"], puntos: 2 }
  ]
  puntajes: { "jugadorId1": 12, "jugadorId2": 8 }      // acumulado histórico de la partida
  historialRondas: [ { ronda: 1, posiciones: {...} } ]
```

**Por qué `categoriaActual` guarda el objeto completo y no solo el id:** así cualquier dispositivo que se conecta tarde (o se reconecta) no necesita tener el banco de categorías sincronizado para saber qué se está jugando — la sala es autocontenida. El pool completo de categorías (`categories.js`) sigue viviendo local en cada cliente; solo se usa para **elegir** la próxima categoría/palabra, nunca para leerla de vuelta.

---

## 5. El "velo" (revelación secuencial) — cómo funciona en la práctica

Esto es lo más particular del diseño, vale la pena explicarlo con detalle porque no es obvio mirando el código de una sola pantalla.

1. Cuando el host cierra el envío de palabras, se llama **una sola vez** a `calcularCoincidencias()` (en `salaService.js`) y el resultado (`puntosRondaActual` + `detalleCoincidencias`) se escribe en Firebase. Esto es clave: **el cálculo no se repite por dispositivo** — todos leen el mismo resultado ya calculado, evitando inconsistencias de redondeo o de timing entre clientes.
2. `ordenRevelacion` fija el orden en que se muestra a cada jugador (hoy es el orden de entrada al lobby; ver sección 6 si querés que rote por ronda).
3. `turnoRevelacion` es un contador simple. El host tiene el único botón que lo avanza (`avanzarTurnoRevelacion`, con `runTransaction` para evitar carreras si por error dos hosts tocan a la vez). Todos los demás dispositivos solo *leen* ese número vía `onValue` y muestran al jugador correspondiente — nadie más tiene botón de avanzar, así se garantiza que todos ven el mismo jugador al mismo tiempo.
4. Cuando `turnoRevelacion` llega al final de `ordenRevelacion`, la pantalla cambia sola (sin botón adicional) a la tabla resumen de la ronda.
5. Si `config.revelarGradual` está en `false`, se saltea todo el paso 2-4 y se muestra la tabla resumen directo — mismo dato (`puntosRondaActual`), presentación distinta.

**Nota de diseño:** el "velo" es un toggle de partida completo (se configura una vez en el lobby), no algo que se prenda/apague ronda a ronda. Si más adelante querés que sea por ronda, el cambio es chico: mover `revelarGradual` de `config` a un valor que se setee en `finalizarRevelacionRonda` antes de cada ronda nueva.

---

## 6. Puntaje automático: la migración desde el modo local

En el modo local (`Score.jsx`), el anfitrión mira el papel de cada jugador y **tilda a mano** quiénes coincidieron; el puntaje es `seleccionados.length` (la cantidad de jugadores que escribieron lo mismo).

En el modo online, `calcularCoincidencias()` (en `salaService.js`) reproduce exactamente esa misma fórmula, pero de forma automática:

1. Junta las palabras de **todos** los jugadores de la ronda.
2. Normaliza cada palabra (`normalizarPalabra`: minúsculas, sin tildes, sin espacios extra) para que "Perro", "perro " y "PÉRRO" cuenten como la misma.
3. Agrupa por palabra normalizada. Si un grupo tiene 2 o más jugadores distintos, cada uno de esos jugadores suma puntos igual al tamaño del grupo — mismo criterio que `Score.jsx`.
4. Si un jugador escribió la misma palabra dos veces en su propia lista, no se cuenta dos veces (se filtra antes de agrupar).

Esto significa que **la fórmula de puntos vive en un solo lugar conceptual** (aunque hoy está duplicada como código entre `Score.jsx` y `salaService.js`, porque son flujos de datos distintos — manual vs. automático). Si el día de mañana cambiás la fórmula de puntaje, acordate de tocar los dos lugares, o considerá extraerla a un helper compartido en `src/services/scoring.js`.

---

## 7. Presencia y desconexiones

Cada jugador, al crear o unirse a una sala, registra un `onDisconnect()` sobre su propio flag `conectado`. Si cierra la pestaña, pierde señal o mata la app, Firebase pone `conectado: false` automáticamente del lado del servidor (no depende de que el cliente alcance a avisar).

**Decisión importante:** un jugador desconectado **no se borra** de la sala, solo se marca. Esto es a propósito: si vuelve a abrir el link, `unirseSala()` lo reconecta a la misma sala (mismo `jugadorId`, persistido en `sessionStorage` por pestaña) sin perder su historial de puntos. La sala en sí no tiene expiración automática todavía — ver sección 8.

---

## 8. Lo que falta / próximos pasos sugeridos

Esto se dejó afuera del alcance de esta primera implementación a propósito, para no sobre-construir antes de probarlo con gente real:

- **Reglas de seguridad de Firebase (`database.rules.json`):** hoy, si alguien tiene el código de sala, puede escribir cualquier cosa en ese nodo (no hay reglas restrictivas configuradas todavía). Para un juego casero con amigos el riesgo es bajo, pero conviene como próximo paso escribir reglas que, como mínimo, impidan que un jugador escriba las palabras de otro `jugadorId` que no sea el suyo.
- **Limpieza de salas viejas:** no hay un TTL. Si esto se usa mucho, conviene una Cloud Function que borre salas con `estado: "finalizada"` después de, por ejemplo, 24hs.
- **Reconexión en medio de una ronda:** si un jugador se cae mientras escribe sus palabras, al volver arranca con el formulario vacío (no se persiste el borrador). Es un detalle menor de UX, no un bug de datos.
- **Rotación de `ordenRevelacion` por ronda:** hoy es fijo (orden de entrada al lobby). Si querés que el orden de revelación cambie cada ronda, es un cambio de una línea en `iniciarRevelacion()`.
