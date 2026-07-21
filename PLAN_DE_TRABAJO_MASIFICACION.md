# 📋 Plan de trabajo — Preparar "El Consenso Online" para más usuarios

Este documento ordena, por prioridad, lo que se detectó como pendiente antes de compartir el modo online más ampliamente. Cada punto tiene: por qué importa, qué hacer concretamente, y cómo saber que ya está resuelto.

---

## Prioridad 1 — Bloqueante de seguridad

### 1.1 Reglas de Firebase Realtime Database

**Por qué importa:** sin reglas explícitas, la base probablemente sigue en "modo prueba" (lectura/escritura abierta a cualquiera). Riesgo doble: (a) cualquiera puede leer/escribir/borrar cualquier sala ajena, (b) las reglas de prueba vencen a los 30 días de creado el proyecto — si eso pasa, la app deja de funcionar de golpe sin aviso.

**Qué hacer:**
- Entrar a Firebase Console → Realtime Database → pestaña "Reglas" y ver qué dice hoy.
- Escribir reglas mínimas que exijan estructura y bloqueen escritura cruzada de datos de otro jugador. Ejemplo de punto de partida (a ajustar con la forma real del nodo `salas/{codigoSala}`):
  ```json
  {
    "rules": {
      "salas": {
        "$codigoSala": {
          ".read": true,
          ".write": true,
          "palabrasEnviadas": {
            "$jugadorId": {
              ".validate": "newData.exists()"
            }
          }
        }
      }
    }
  }
  ```
  (Esto es un punto de partida, no la regla final — hay que iterarla probando que el juego siga andando.)
- Deployar las reglas desde la consola o con `firebase deploy --only database`.

**Cómo saber que está resuelto:** las reglas ya no dicen "modo prueba" / no tienen fecha de vencimiento visible en la consola, y el juego sigue funcionando de punta a punta después del cambio.

**Esfuerzo estimado:** 1-2 horas (la mayor parte es probar que no rompa el flujo real del juego).

---

## Prioridad 2 — Confirmar antes del primer envío masivo del link

### 2.1 Variables de entorno en Vercel (producción)

**Por qué importa:** las variables `VITE_FIREBASE_*` funcionan en tu `.env` local, pero si no están cargadas en el panel de Vercel, cualquiera que entre al link en producción va a chocar con el mensaje de "Firebase no está configurado".

**Qué hacer:**
- Vercel → tu proyecto → Settings → Environment Variables.
- Cargar las 7 variables de `.env.example`, iguales a las de tu `.env` local.
- Re-deployar (un simple redeploy alcanza para que tome las variables nuevas).

**Cómo saber que está resuelto:** abrir la URL de producción (no localhost) desde otro dispositivo/red y crear una sala de prueba sin errores.

**Esfuerzo estimado:** 15 minutos.

---

## Prioridad 3 — Corregir antes de que un usuario recurrente lo note

### 3.1 Carrera entre deep link y reconexión automática

**Por qué importa:** si alguien que ya jugó antes (tiene sesión guardada en `localStorage`) abre el link de una sala **nueva**, dos efectos que corren al montar la app compiten por decidir en qué sala termina esa persona. Puede terminar reconectado a su partida vieja en vez de entrar a la nueva a la que lo invitaron.

**Qué hacer:**
- En `App.jsx`, el efecto de deep link (`/sala/:codigo`) y, en `OnlineGameContext.jsx`, el efecto de reconexión automática desde `localStorage`, deben coordinarse: si hay un código en la URL, ese código gana siempre sobre cualquier sesión guardada.
- Enfoque sugerido: que el efecto de reconexión automática chequee primero si `window.location.pathname` ya tiene un `/sala/:codigo` distinto al guardado; si es así, no reconectar solo, y dejar que el flujo de "unirse" normal tome el control.

**Cómo saber que está resuelto:** con una sesión vieja guardada en el navegador (jugar una partida y no volver al home limpio), abrir un link de una sala nueva y confirmar que entra a la sala nueva, no a la vieja.

**Esfuerzo estimado:** 30-45 minutos.

---

## Prioridad 4 — Antes de que el uso se vuelva recurrente/frecuente

### 4.1 Limpieza de salas viejas

**Por qué importa:** ninguna sala se borra nunca. No es grave al principio (hace falta acumular cientos de miles para acercarse al límite de 1 GB del plan gratis), pero mejor resolverlo con tranquilidad ahora que como apuro después.

**Qué hacer (opción recomendada para este volumen, sin necesitar tarjeta):**
- Al crear una sala nueva (`crearSala` en `salaService.js`), antes de escribir la sala nueva, hacer una consulta liviana a salas con `estado: "finalizada"` y `creadaEn` de más de 24-48hs, y borrar un puñado (ej. hasta 5) de las que encuentre. Así la limpieza ocurre "de paso", sin necesitar un proceso corriendo todo el tiempo.

**Alternativa más robusta (si esto crece mucho):** una Cloud Function programada (cron) que corra una vez por día y borre todo lo viejo. Requiere pasar el proyecto de Firebase al plan Blaze (pago por uso), aunque a este volumen el gasto real seguiría siendo $0 dentro de la franja gratuita de Blaze.

**Cómo saber que está resuelto:** crear varias salas de prueba, marcarlas como viejas manualmente (cambiando `creadaEn` a mano en la consola para simular antigüedad), crear una sala nueva, y confirmar que las viejas desaparecen.

**Esfuerzo estimado:** 1-2 horas (opción cliente) / medio día (Cloud Function).

---

## Prioridad 5 — Antes de anunciarlo ampliamente

### 5.1 Prueba cruzada de navegador/dispositivo (Web Speech API)

**Por qué importa:** la lectura por voz depende del navegador. Safari/iOS es históricamente más limitado que Chrome/Android en voces disponibles y comportamiento de `speechSynthesis`. Si la mayoría va a jugar desde el celu, hay que probarlo ahí específicamente.

**Qué hacer:**
- Jugar una partida completa (crear sala, ronda, revelación) desde: Safari en iPhone, Chrome en Android, y un navegador de escritorio.
- Anotar cualquier diferencia notoria en la voz (no lee, tarda, usa una voz distinta) y decidir si hace falta un mensaje o fallback quality (ej. mostrar la palabra en texto grande si la voz no está disponible, cosa que ya hace la UI de por sí).

**Cómo saber que está resuelto:** jugaste una partida de punta a punta en los tres entornos sin sorpresas bloqueantes (la voz puede sonar distinto, pero el juego no debe trabarse).

**Esfuerzo estimado:** 1 hora.

### 5.2 Límite de creación de salas (anti-spam básico)

**Por qué importa:** hoy cualquiera puede crear salas sin límite. Para uso entre amigos no pasa nada, pero si el link circula más ampliamente, alguien podría (con o sin intención) generar muchas salas vacías y ensuciar el conteo de conexiones/almacenamiento.

**Qué hacer:**
- Nivel simple: limitar desde el cliente cuántas salas puede crear un mismo `localStorage`/dispositivo en una ventana de tiempo (ej. no más de 5 por hora). No es a prueba de balas, pero frena el caso accidental (alguien clickeando "Crear Sala" muchas veces).
- Nivel más serio (opcional, solo si hace falta más adelante): Firebase App Check, para verificar que las llamadas vienen de tu app real y no de un script externo.

**Cómo saber que está resuelto:** clickear "Crear Sala" repetidamente y confirmar que después de cierto número, se bloquea con un mensaje claro.

**Esfuerzo estimado:** 1 hora (nivel simple).

---

## Resumen visual de orden sugerido

| # | Tarea | Prioridad | Esfuerzo |
|---|---|---|---|
| 1.1 | Reglas de seguridad de Firebase | 🔴 Bloqueante | 1-2 hs |
| 2.1 | Variables de entorno en Vercel | 🔴 Antes de compartir el link | 15 min |
| 3.1 | Carrera deep link vs reconexión | 🟠 Antes de uso recurrente | 30-45 min |
| 4.1 | Limpieza de salas viejas | 🟡 Antes de uso frecuente | 1-2 hs |
| 5.1 | Prueba cruzada de navegador/voz | 🟡 Antes de anunciar ampliamente | 1 hs |
| 5.2 | Límite de creación de salas | 🟢 Nice-to-have | 1 hs |

**Total estimado:** entre 5 y 8 horas de trabajo, repartibles en varias sesiones sin bloquearse entre sí (salvo 1.1, que conviene resolver primero por ser el único con riesgo real de romper la app o exponer datos).
