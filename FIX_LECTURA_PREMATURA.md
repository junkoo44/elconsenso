# 🐛 Fix: lectura por voz prematura en la revelación online

## Síntoma

Al empezar la revelación de cada jugador (o al arrancar cada ronda), la app leía la primera palabra en voz alta **antes de tiempo** — antes de que terminara la animación de "preparate" / la cuenta regresiva.

Afectaba dos pantallas: `RevelacionOnline.jsx` (donde se notaba, porque ahí sonaba siempre) y, en potencia, `RondaOnline.jsx` (donde no sonaba por una casualidad, ver más abajo).

---

## Causa raíz: un estado que "llega tarde" a un efecto vecino

Esto **no es un bug de Firebase ni de la lógica de juego** — es una condición de carrera propia de cómo funciona React con `useState` + `useEffect`. Vale la pena entenderla bien porque es un patrón que puede repetirse en cualquier pantalla nueva que agregues.

### El detalle que rompe todo

Cuando cambia de jugador, dos cosas suceden **en el mismo instante** (mismo "commit" de React):

1. Firebase actualiza `turnoRevelacion` y `palabraReveladaIndex` juntos (un solo `update()`).
2. Eso hace que React vuelva a ejecutar **todos los `useEffect` que dependen de esos valores**, en el mismo lote.

Entre esos efectos hay dos:

- **Efecto A** — "cuando cambia el turno, reiniciar la fase a `'intro'`": llama a `setFaseActual('intro')`.
- **Efecto B** — "si estamos en fase `'lenta'`, leer la palabra en voz alta": chequea `if (faseActual !== 'lenta') return;`.

El problema es este: **`setFaseActual('intro')` no se aplica al instante.** React necesita **un render más** para que ese nuevo valor esté disponible dentro del componente. Entonces, cuando el Efecto B se ejecuta —en el mismo lote, apenas un instante después del Efecto A— todavía lee el `faseActual` **viejo** (`'lenta'`, herencia de la revelación del jugador anterior), porque ese es el valor que existía cuando arrancó este render, no el que Efecto A acaba de pedir.

Resultado: el guard `faseActual !== 'lenta'` da `false` (porque cree que sigue en `'lenta'`), no frena, y dispara la lectura de la primera palabra del jugador nuevo — todo antes de que la pantalla llegue siquiera a mostrar "preparate para ver sus coincidencias".

### Por qué en `RondaOnline.jsx` no se notaba

Ahí existía el mismo patrón exacto, pero el bug quedaba tapado por dos casualidades que no eran una protección real:

- La lectura estaba envuelta en un `setTimeout(() => speakCategory(...), 150)`. Como el efecto se vuelve a ejecutar en el render siguiente (cuando `faseRonda` sí pasa a ser `'intro'` de verdad), su función de limpieza cancela ese `setTimeout` **antes de que llegue a disparar**.
- Un `ref` (`vozHabladaRef`) que por casualidad seguía en `true` de la ronda anterior, evitando que la lectura corriera en ese primer commit "adelantado".

Es decir: funcionaba, pero por suerte, no por diseño. Cualquier cambio futuro en los tiempos (por ejemplo bajar el delay del `setTimeout`, o tocar el orden de los `useEffect`) podía hacer reaparecer el bug ahí también.

---

## La solución: un `ref` como espejo sincrónico del estado

La regla general para arreglar esto: **cuando un efecto necesita saber "en qué fase estamos" para decidir si actuar, y esa fase puede cambiar en el mismo commit en el que el efecto se dispara, no hay que confiar en el `useState` para ese chequeo.** Hay que usar un `useRef` que se actualice de forma sincrónica, en el mismo momento en que se pide el cambio de estado.

### Patrón aplicado (en ambos archivos)

```jsx
// 1. Guardar un ref que "espeja" el estado
const [faseActual, setFaseActual] = useState('intro');
const faseActualRef = useRef('intro');

// 2. Crear un helper que actualiza los dos A LA VEZ
const cambiarFase = (nuevaFase) => {
  faseActualRef.current = nuevaFase; // ← esto es INSTANTÁNEO
  setFaseActual(nuevaFase);          // ← esto tarda un render más
};

// 3. Usar cambiarFase(...) en vez de setFaseActual(...) en TODOS lados
cambiarFase('intro');
cambiarFase('lenta');
// etc.

// 4. Los efectos que necesitan el valor "de verdad, ahora mismo"
//    leen el REF, no el estado:
useEffect(() => {
  if (faseActualRef.current !== 'lenta') return; // ✅ siempre al día
  // ... leer en voz alta, avanzar palabra, etc.
}, [/* el estado sigue en las dependencias, solo cambia el chequeo interno */]);
```

**Por qué funciona:** los refs (`.current`) se escriben y se leen de forma inmediata, sin esperar a un ciclo de render. Como el Efecto A (el que resetea la fase) se ejecuta **antes** que el Efecto B en el mismo commit —simplemente porque está declarado antes en el archivo—, para cuando Efecto B corre, el ref ya tiene el valor correcto. El estado (`faseActual`) se sigue usando igual que antes para todo lo que se **muestra en pantalla** (JSX), porque ahí sí necesitás que React re-renderice; el ref solo se usa para el chequeo interno del efecto.

**Importante:** el estado sigue en el arreglo de dependencias (`[..., faseActual, ...]`) del `useEffect`. Eso no se toca — sigue haciendo falta para que el efecto se vuelva a ejecutar cuando la fase realmente cambia en un render "normal" (no en el commit conflictivo). Lo único que cambia es *qué valor lee el `if` de adentro*.

---

## Cómo detectar este patrón en el futuro

Sospechá de esto cada vez que tengas:

1. Un valor en Firebase (o cualquier fuente externa) que, al cambiar, dispara **más de un `useEffect` a la vez**.
2. Uno de esos efectos llama a un `setEstado(...)` para "reiniciar" algo.
3. Otro de esos efectos **lee ese mismo estado** para decidir si debe actuar (un `if (estado !== X) return`).

Si los tres puntos se cumplen, ese segundo efecto puede estar leyendo un valor "atrasado" un commit. La solución es siempre la misma: mover el chequeo a un `ref` que se actualiza junto con el `setEstado`, como se explicó arriba.

Una alternativa más agresiva (no aplicada acá, pero válida) sería fusionar ambos efectos en uno solo, para que compartan el mismo cierre (closure) y no haya dos "lecturas" del mismo valor en momentos distintos. Se prefirió el patrón del ref porque implica cambios más chicos y localizados, sin reordenar la lógica existente.

---

## Archivos modificados

- `src/screens/online/RevelacionOnline.jsx` — bug real, confirmado y corregido.
- `src/screens/online/RondaOnline.jsx` — mismo patrón de riesgo, blindado preventivamente aunque no se manifestaba (ver sección de arriba sobre por qué "no sonaba").

Verificado con `npm run build` sin errores en ambos casos.
