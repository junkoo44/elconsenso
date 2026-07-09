import { db } from './firebase';
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  push,
  serverTimestamp,
  onDisconnect,
  runTransaction,
} from 'firebase/database';

/**
 * ============================================================================
 * SERVICIO DE SALAS ONLINE — "El Consenso"
 * ============================================================================
 * Encapsula toda la comunicación con Firebase Realtime Database para el modo
 * multi-dispositivo. La estructura completa del nodo de una sala está
 * documentada en /ARQUITECTURA_ONLINE.md junto a este archivo.
 *
 * Ningún componente de React debería llamar a `ref`/`set`/`get` directamente:
 * todo pasa por acá para que la forma de los datos viva en un solo lugar.
 * ============================================================================
 */

const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0/I/1 para evitar confusión al leer en voz alta

/** Genera un código de sala de 5 caracteres, fácil de dictar por teléfono */
function generarCodigoSala() {
  let codigo = '';
  for (let i = 0; i < 5; i++) {
    codigo += CODIGO_CHARS[Math.floor(Math.random() * CODIGO_CHARS.length)];
  }
  return codigo;
}

/** Genera un id de jugador local, persistido en sessionStorage por pestaña/dispositivo */
function obtenerOCrearJugadorId(codigoSala) {
  const key = `consenso_jugador_id_${codigoSala}`;
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = push(ref(db, 'salas')).key; // aprovechamos el generador de ids de Firebase
    sessionStorage.setItem(key, id);
  }
  return id;
}

/** Normaliza una palabra para comparar coincidencias: minúsculas, sin tildes, sin espacios extra */
export function normalizarPalabra(palabra) {
  return palabra
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // remueve diacríticos (tildes, diéresis)
}

/**
 * Crea una nueva sala. Devuelve { codigoSala, jugadorId }.
 */
export async function crearSala(nombreHost, configInicial) {
  const codigoSala = generarCodigoSala();
  const jugadorId = obtenerOCrearJugadorId(codigoSala);

  const salaRef = ref(db, `salas/${codigoSala}`);
  await set(salaRef, {
    host: jugadorId,
    estado: 'lobby',
    creadaEn: serverTimestamp(),
    config: {
      rondas: configInicial.rondas ?? 5,
      tiempo: configInicial.tiempo ?? 75,
      revelarGradual: configInicial.revelarGradual ?? true,
      categoriasActivas: configInicial.categoriasActivas ?? [],
    },
    jugadores: {
      [jugadorId]: { nombre: nombreHost, conectado: true, esHost: true },
    },
    rondaActual: 0,
    categoriaActual: null,
    palabraActual: '',
    lector: null,
    categoriasJugadas: [],
    palabrasEnviadas: {},
    turnoRevelacion: 0,
    ordenRevelacion: [],
    puntosRondaActual: {},
    puntajes: {},
    historialRondas: [],
  });

  // Si el host cierra la app/pierde conexión, lo marcamos como desconectado (no borramos la sala)
  onDisconnect(ref(db, `salas/${codigoSala}/jugadores/${jugadorId}/conectado`)).set(false);

  return { codigoSala, jugadorId };
}

/**
 * Se une a una sala existente. Lanza error si no existe o si ya arrancó la partida.
 */
export async function unirseSala(codigoSala, nombreJugador) {
  codigoSala = codigoSala.trim().toUpperCase();
  const salaRef = ref(db, `salas/${codigoSala}`);
  const snap = await get(salaRef);

  if (!snap.exists()) {
    throw new Error('No encontramos ninguna sala con ese código.');
  }
  const sala = snap.val();
  if (sala.estado !== 'lobby') {
    throw new Error('Esta partida ya arrancó. Pedí un código de una sala nueva.');
  }

  const jugadorId = obtenerOCrearJugadorId(codigoSala);
  await update(ref(db, `salas/${codigoSala}/jugadores/${jugadorId}`), {
    nombre: nombreJugador,
    conectado: true,
    esHost: false,
  });

  onDisconnect(ref(db, `salas/${codigoSala}/jugadores/${jugadorId}/conectado`)).set(false);

  return { codigoSala, jugadorId };
}

/** Suscribe a cambios en tiempo real de una sala. Devuelve función para desuscribirse. */
export function escucharSala(codigoSala, callback) {
  const salaRef = ref(db, `salas/${codigoSala}`);
  const listener = onValue(salaRef, (snap) => {
    callback(snap.exists() ? snap.val() : null);
  });
  return () => off(salaRef, 'value', listener);
}

/** El host actualiza la configuración de la partida desde el lobby */
export async function actualizarConfigSala(codigoSala, nuevaConfig) {
  await update(ref(db, `salas/${codigoSala}/config`), nuevaConfig);
}

/** Elige una palabra al azar del banco de una categoría (misma lógica que el modo local) */
function elegirPalabraAleatoria(categoria) {
  if (!categoria?.palabras?.length) return 'Sin Palabra';
  const idx = Math.floor(Math.random() * categoria.palabras.length);
  return categoria.palabras[idx];
}

/** Elige una categoría al azar del pool que no se haya jugado (o resetea el mazo si se agotó) */
function seleccionarCategoriaAleatoria(pool, jugadas) {
  const disponibles = pool.filter((c) => !jugadas.includes(c.id));
  const fuente = disponibles.length > 0 ? disponibles : pool;
  return fuente[Math.floor(Math.random() * fuente.length)];
}

/**
 * El host inicia la partida: elige la primera categoría/palabra y pasa la sala a estado "jugando".
 * `categoriasPool` es el array completo de categorías disponibles (viene de categories.js, igual que en modo local).
 */
export async function iniciarPartidaOnline(codigoSala, categoriasPool, jugadoresIds) {
  const salaSnap = await get(ref(db, `salas/${codigoSala}`));
  const sala = salaSnap.val();
  const pool = categoriasPool.filter((c) => sala.config.categoriasActivas.includes(c.id));
  if (pool.length === 0) throw new Error('No hay categorías seleccionadas para jugar.');

  const primeraCat = seleccionarCategoriaAleatoria(pool, []);

  await update(ref(db, `salas/${codigoSala}`), {
    estado: 'jugando',
    rondaActual: 1,
    categoriaActual: primeraCat,
    palabraActual: elegirPalabraAleatoria(primeraCat),
    lector: jugadoresIds[0],
    categoriasJugadas: [primeraCat.id],
    palabrasEnviadas: {},
    puntajes: Object.fromEntries(jugadoresIds.map((id) => [id, 0])),
    historialRondas: [],
    ordenRevelacion: jugadoresIds,
  });
}

/** Un jugador manda sus 8 palabras de la ronda actual */
export async function enviarPalabras(codigoSala, jugadorId, palabras) {
  await set(ref(db, `salas/${codigoSala}/palabrasEnviadas/${jugadorId}`), palabras);
}

/**
 * Calcula las coincidencias entre todos los jugadores para la ronda actual.
 * Misma fórmula que el modo local (Score.jsx): los puntos de una palabra
 * coincidente son iguales a la cantidad de jugadores que la escribieron.
 * Una palabra que nadie más repitió no suma puntos.
 *
 * Devuelve:
 *  - puntosRonda: { jugadorId: puntosTotales }
 *  - detalle: [{ palabra, jugadoresIds: [...], puntos }]  (solo grupos con 2+ jugadores)
 */
export function calcularCoincidencias(palabrasEnviadas) {
  const puntosRonda = {};
  const gruposPorPalabra = {}; // palabraNormalizada -> [{jugadorId, palabraOriginal}]

  Object.entries(palabrasEnviadas).forEach(([jugadorId, palabras]) => {
    puntosRonda[jugadorId] = 0;
    (palabras || []).forEach((palabra) => {
      if (!palabra || !palabra.trim()) return;
      const norm = normalizarPalabra(palabra);
      if (!gruposPorPalabra[norm]) gruposPorPalabra[norm] = [];
      // Evita contar dos veces si un jugador repitió la misma palabra en su propia lista
      if (!gruposPorPalabra[norm].some((g) => g.jugadorId === jugadorId)) {
        gruposPorPalabra[norm].push({ jugadorId, palabraOriginal: palabra.trim() });
      }
    });
  });

  const detalle = [];
  Object.entries(gruposPorPalabra).forEach(([, grupo]) => {
    if (grupo.length >= 2) {
      const puntos = grupo.length; // misma fórmula que el modo local
      grupo.forEach(({ jugadorId }) => {
        puntosRonda[jugadorId] = (puntosRonda[jugadorId] || 0) + puntos;
      });
      detalle.push({
        palabra: grupo[0].palabraOriginal,
        jugadoresIds: grupo.map((g) => g.jugadorId),
        puntos,
      });
    }
  });

  return { puntosRonda, detalle };
}

/**
 * El host (o quien tenga el timer) cierra el envío de palabras y arranca la
 * revelación. Calcula las coincidencias una sola vez y las guarda en la sala
 * para que todos los dispositivos vean exactamente lo mismo.
 */
export async function iniciarRevelacion(codigoSala, palabrasEnviadas, ordenRevelacion) {
  const { puntosRonda, detalle } = calcularCoincidencias(palabrasEnviadas);
  await update(ref(db, `salas/${codigoSala}`), {
    estado: 'revelando',
    turnoRevelacion: 0,
    puntosRondaActual: puntosRonda,
    detalleCoincidencias: detalle,
    ordenRevelacion,
  });
}

/** Avanza el "velo": pasa al siguiente jugador en la revelación secuencial */
export async function avanzarTurnoRevelacion(codigoSala) {
  await runTransaction(ref(db, `salas/${codigoSala}/turnoRevelacion`), (actual) => (actual ?? 0) + 1);
}

/**
 * Cierra la revelación de la ronda: acumula los puntos de la ronda al total,
 * guarda el ranking de esa ronda en el historial, y decide si hay siguiente
 * ronda o si la partida terminó.
 */
export async function finalizarRevelacionRonda(codigoSala, categoriasPool) {
  const salaSnap = await get(ref(db, `salas/${codigoSala}`));
  const sala = salaSnap.val();

  const nuevosPuntajes = { ...sala.puntajes };
  Object.entries(sala.puntosRondaActual || {}).forEach(([jugadorId, puntos]) => {
    nuevosPuntajes[jugadorId] = (nuevosPuntajes[jugadorId] || 0) + puntos;
  });

  const ranking = calcularRanking(nuevosPuntajes);
  const nuevoHistorial = [
    ...(sala.historialRondas || []),
    { ronda: sala.rondaActual, posiciones: ranking },
  ];

  const esUltimaRonda =
    sala.config.rondas !== 'infinito' && sala.rondaActual >= sala.config.rondas;

  if (esUltimaRonda) {
    await update(ref(db, `salas/${codigoSala}`), {
      puntajes: nuevosPuntajes,
      historialRondas: nuevoHistorial,
      estado: 'finalizada',
    });
    return { finalizada: true };
  }

  // Preparar la siguiente ronda
  const jugadoresIds = Object.keys(sala.jugadores);
  const pool = categoriasPool.filter((c) => sala.config.categoriasActivas.includes(c.id));
  const nuevaCat = seleccionarCategoriaAleatoria(pool, sala.categoriasJugadas || []);
  const siguienteRonda = sala.rondaActual + 1;

  await update(ref(db, `salas/${codigoSala}`), {
    puntajes: nuevosPuntajes,
    historialRondas: nuevoHistorial,
    estado: 'jugando',
    rondaActual: siguienteRonda,
    categoriaActual: nuevaCat,
    palabraActual: elegirPalabraAleatoria(nuevaCat),
    lector: jugadoresIds[(siguienteRonda - 1) % jugadoresIds.length],
    categoriasJugadas: [...(sala.categoriasJugadas || []), nuevaCat.id],
    palabrasEnviadas: {},
    puntosRondaActual: {},
    detalleCoincidencias: [],
    turnoRevelacion: 0,
  });

  return { finalizada: false };
}

/** Igual a calcularRanking del modo local: mapea jugador -> posición (1, 2, 3...), con empates */
export function calcularRanking(mapaPuntajes) {
  const sorted = Object.entries(mapaPuntajes)
    .map(([id, puntos]) => ({ id, puntos }))
    .sort((a, b) => b.puntos - a.puntos);

  const posiciones = {};
  let pos = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].puntos < sorted[i - 1].puntos) pos = i + 1;
    posiciones[sorted[i].id] = pos;
  }
  return posiciones;
}

/** Marca al jugador como desconectado manualmente (ej: botón "salir de la sala") */
export async function salirDeSala(codigoSala, jugadorId) {
  await update(ref(db, `salas/${codigoSala}/jugadores/${jugadorId}`), { conectado: false });
}
