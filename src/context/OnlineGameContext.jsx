import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  crearSala,
  unirseSala,
  escucharSala,
  actualizarConfigSala,
  iniciarPartidaOnline,
  enviarPalabras,
  iniciarRevelacion,
  avanzarTurnoRevelacion,
  finalizarRevelacionRonda,
  avanzarPalabraRevelacion,
  enviarReaccionOnline,
  reiniciarPartidaOnline,
  salirDeSala,
} from '../services/salaService';

import { saveMatchToHistory } from '../services/categories';
import { db } from '../services/firebase';
import { ref, get, update, onDisconnect, onValue, runTransaction } from 'firebase/database';

const OnlineGameContext = createContext();

export const useOnlineGame = () => {
  const context = useContext(OnlineGameContext);
  if (!context) {
    throw new Error('useOnlineGame debe ser usado dentro de un OnlineGameProvider');
  }
  return context;
};

export const OnlineGameProvider = ({ children }) => {
  const [codigoSala, setCodigoSala] = useState(null);
  const [jugadorId, setJugadorId] = useState(null);
  const [sala, setSala] = useState(null); // snapshot en vivo de la sala completa
  const [error, setError] = useState(db ? null : 'Firebase no está configurado. Por favor, agregá las variables de entorno VITE_FIREBASE_* en tu panel de Vercel.');
  const [cargando, setCargando] = useState(false);
  const [propuestaReconexion, setPropuestaReconexion] = useState(null);

  const unsubscribeRef = useRef(null);
  const guardadoRef = useRef(false);

  // Intentar reconexión automática al montar si hay una partida activa guardada en cache
  useEffect(() => {
    if (!db) return;
    
    const intentarReconexion = async () => {
      const codigoGuardado = localStorage.getItem("consenso_online_codigo");
      const idGuardado = localStorage.getItem("consenso_online_jugador_id");
      
      const path = window.location.pathname;
      const matchUrl = path.match(/^\/sala\/([a-zA-Z0-9]{5})$/i);
      const codigoUrl = matchUrl ? matchUrl[1].toUpperCase() : null;

      if (codigoUrl && codigoGuardado && codigoUrl !== codigoGuardado.toUpperCase()) {
        console.log(`Deep link detectado para nueva sala ${codigoUrl}, limpiando sesión vieja de ${codigoGuardado}`);
        localStorage.removeItem("consenso_online_codigo");
        localStorage.removeItem("consenso_online_jugador_id");
        return; // No intentamos reconectar, dejamos que App.jsx procese el link nuevo
      }

      if (codigoGuardado && idGuardado) {
        try {
          const salaSnap = await get(ref(db, `salas/${codigoGuardado}`));
          if (salaSnap.exists()) {
            const datosSala = salaSnap.val();
            
            // Validar antigüedad de la sala (máximo 3 horas)
            const esAntigua = datosSala.creadaEn 
              ? (Date.now() - datosSala.creadaEn) > 3 * 60 * 60 * 1000 
              : false;

            // Solo proponer reconexión si la sala no finalizó, el jugador está registrado y no es antigua
            if (datosSala.estado !== 'finalizada' && datosSala.jugadores?.[idGuardado] && !esAntigua) {
              console.log(`Propuesta de reconexión detectada para la sala ${codigoGuardado}`);
              setPropuestaReconexion({
                codigo: codigoGuardado,
                jugadorId: idGuardado,
                estado: datosSala.estado
              });
              return;
            }
          }
          // Si no es válida o es antigua, limpiamos cache
          localStorage.removeItem("consenso_online_codigo");
          localStorage.removeItem("consenso_online_jugador_id");
        } catch (e) {
          console.warn("Fallo al intentar reconexión automática:", e);
        }
      }
    };
    
    intentarReconexion();
  }, []);

  const confirmarReconexion = useCallback(() => {
    if (!propuestaReconexion) return;
    const { codigo, jugadorId: id } = propuestaReconexion;
    setCodigoSala(codigo);
    setJugadorId(id);
    setPropuestaReconexion(null);
    if (!window.location.pathname.includes(`/sala/${codigo}`)) {
      window.history.pushState({}, '', `/sala/${codigo}`);
    }
  }, [propuestaReconexion]);

  const descartarReconexion = useCallback(() => {
    localStorage.removeItem("consenso_online_codigo");
    localStorage.removeItem("consenso_online_jugador_id");
    setPropuestaReconexion(null);
  }, []);

  // Se suscribe a la sala cada vez que cambia el código
  useEffect(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    if (!codigoSala) {
      setSala(null);
      return;
    }
    unsubscribeRef.current = escucharSala(codigoSala, (data) => setSala(data));
    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [codigoSala]);

  // --- 1. Sincronizar presencia 'conectado: true' usando .info/connected para autorecuperación tras cortes de red ---
  useEffect(() => {
    if (!db || !codigoSala || !jugadorId) return;

    const connectedRef = ref(db, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        const jugadorConectadoRef = ref(db, `salas/${codigoSala}/jugadores/${jugadorId}/conectado`);
        onDisconnect(jugadorConectadoRef).set(false);
        update(ref(db, `salas/${codigoSala}/jugadores/${jugadorId}`), { conectado: true });
      }
    });

    return () => unsubscribe();
  }, [codigoSala, jugadorId]);

  // --- 2. Herencia de Host atómica: Si el Host actual se desconecta, el primer jugador activo toma la corona vía transacción ---
  useEffect(() => {
    if (!db || !codigoSala || !sala || !sala.jugadores) return;

    const hostIdActual = sala.host;
    const hostActualConectado = sala.jugadores[hostIdActual]?.conectado;

    if (!hostActualConectado) {
      const conectados = Object.entries(sala.jugadores)
        .filter(([_, d]) => d.conectado)
        .map(([id, d]) => ({ id, ...d }));

      if (conectados.length > 0) {
        const nuevoHost = conectados[0];

        if (nuevoHost.id === jugadorId) {
          const salaRef = ref(db, `salas/${codigoSala}`);
          runTransaction(salaRef, (salaData) => {
            if (!salaData || !salaData.jugadores) return salaData;
            const hostActual = salaData.host;
            // Verificamos atómicamente en el servidor si el host sigue desconectado o nulo
            if (!hostActual || !salaData.jugadores[hostActual]?.conectado) {
              console.log(`👑 Jugador ${jugadorId} toma la corona de Host en la sala ${codigoSala} (Transacción atómica)`);
              salaData.host = jugadorId;
              if (hostActual && salaData.jugadores[hostActual]) {
                salaData.jugadores[hostActual].esHost = false;
              }
              if (salaData.jugadores[jugadorId]) {
                salaData.jugadores[jugadorId].esHost = true;
              }
            }
            return salaData;
          });
        }
      }
    }
  }, [sala, codigoSala, jugadorId]);

  // --- Guardado automático en el historial cuando finaliza la sala ---
  useEffect(() => {
    if (sala?.estado === 'finalizada' && codigoSala && !guardadoRef.current) {
      try {
        const sortedScores = Object.entries(sala.puntajes || {})
          .map(([id, puntos]) => ({
            nombre: sala.jugadores?.[id]?.nombre || 'Jugador',
            puntos
          }))
          .sort((a, b) => b.puntos - a.puntos);

        const ganador = sortedScores.length > 0 ? sortedScores[0].nombre : "Sin ganador";

        const now = new Date();
        const registroPartida = {
          fecha: now.toLocaleDateString(),
          hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ganador,
          tablaFinal: sortedScores,
          claveUnica: `online_${codigoSala}`
        };

        saveMatchToHistory(registroPartida);
        console.log("Partida online guardada en el historial desde el contexto.");
        guardadoRef.current = true;
      } catch (e) {
        console.warn("Fallo al guardar la partida online en el historial:", e);
      }
    }
    
    // Si entramos a otra sala distinta o se resetea, permitimos guardar de nuevo
    if (sala?.estado === 'lobby') {
      guardadoRef.current = false;
    }
  }, [sala?.estado, sala?.puntajes, sala?.jugadores, codigoSala]);

  const crear = useCallback(async (nombreHost, configInicial) => {
    setCargando(true);
    setError(null);
    try {
      const { codigoSala: codigo, jugadorId: id } = await crearSala(nombreHost, configInicial);
      localStorage.setItem("consenso_online_codigo", codigo);
      localStorage.setItem("consenso_online_jugador_id", id);
      setCodigoSala(codigo);
      setJugadorId(id);
      // Deep link compartible sin recargar la página
      window.history.pushState({}, '', `/sala/${codigo}`);
      return codigo;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setCargando(false);
    }
  }, []);

  const unirse = useCallback(async (codigo, nombreJugador) => {
    setCargando(true);
    setError(null);
    try {
      const { codigoSala: codigoNormalizado, jugadorId: id } = await unirseSala(codigo, nombreJugador);
      localStorage.setItem("consenso_online_codigo", codigoNormalizado);
      localStorage.setItem("consenso_online_jugador_id", id);
      setCodigoSala(codigoNormalizado);
      setJugadorId(id);
      window.history.pushState({}, '', `/sala/${codigoNormalizado}`);
      return codigoNormalizado;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setCargando(false);
    }
  }, []);

  const salir = useCallback(async () => {
    localStorage.removeItem("consenso_online_codigo");
    localStorage.removeItem("consenso_online_jugador_id");
    if (codigoSala && jugadorId) {
      await salirDeSala(codigoSala, jugadorId);
    }
    setCodigoSala(null);
    setJugadorId(null);
    setSala(null);
    window.history.pushState({}, '', '/');
  }, [codigoSala, jugadorId]);

  const actualizarConfig = useCallback((nuevaConfig) => {
    if (!codigoSala) return;
    return actualizarConfigSala(codigoSala, nuevaConfig);
  }, [codigoSala]);

  const iniciarPartida = useCallback((categoriasPool) => {
    if (!codigoSala || !sala) return;
    const jugadoresIds = Object.keys(sala.jugadores);
    return iniciarPartidaOnline(codigoSala, categoriasPool, jugadoresIds);
  }, [codigoSala, sala]);

  const mandarPalabras = useCallback((palabras) => {
    if (!codigoSala || !jugadorId) return;
    return enviarPalabras(codigoSala, jugadorId, palabras);
  }, [codigoSala, jugadorId]);

  const arrancarRevelacion = useCallback(() => {
    if (!codigoSala) return;
    return iniciarRevelacion(codigoSala);
  }, [codigoSala]);

  const siguienteTurnoRevelacion = useCallback(() => {
    if (!codigoSala) return;
    return avanzarTurnoRevelacion(codigoSala);
  }, [codigoSala]);

  const siguientePalabraRevelacion = useCallback(() => {
    if (!codigoSala) return;
    return avanzarPalabraRevelacion(codigoSala);
  }, [codigoSala]);

  const cerrarRondaYAvanzar = useCallback((categoriasPool) => {
    if (!codigoSala) return;
    return finalizarRevelacionRonda(codigoSala, categoriasPool);
  }, [codigoSala]);

  const mandarReaccion = useCallback((emoji) => {
    if (!codigoSala || !jugadorId) return;
    return enviarReaccionOnline(codigoSala, jugadorId, emoji);
  }, [codigoSala, jugadorId]);

  const reiniciarPartida = useCallback(() => {
    if (!codigoSala) return;
    return reiniciarPartidaOnline(codigoSala);
  }, [codigoSala]);

  // Helpers derivados, pensados para no repetir lógica en cada pantalla
  const soyHost = sala?.host === jugadorId;
  const miNombre = sala?.jugadores?.[jugadorId]?.nombre;
  const listaJugadores = sala
    ? Object.entries(sala.jugadores || {}).map(([id, datos]) => ({ id, ...datos }))
    : [];
  const todosEnviaronPalabras =
    sala && sala.jugadores
      ? Object.entries(sala.jugadores)
          .filter(([_, datos]) => datos.conectado) // Solo esperar a los que siguen conectados
          .every(([id, _]) => sala.palabrasEnviadas?.[id] !== undefined)
      : false;

  return (
    <OnlineGameContext.Provider
      value={{
        codigoSala,
        setCodigoSala,
        jugadorId,
        sala,
        error,
        cargando,
        soyHost,
        miNombre,
        listaJugadores,
        todosEnviaronPalabras,
        crear,
        unirse,
        salir,
        actualizarConfig,
        iniciarPartida,
        mandarPalabras,
        arrancarRevelacion,
        siguienteTurnoRevelacion,
        siguientePalabraRevelacion,
        cerrarRondaYAvanzar,
        mandarReaccion,
        reiniciarPartida,
        propuestaReconexion,
        confirmarReconexion,
        descartarReconexion,
      }}
    >
      {children}
    </OnlineGameContext.Provider>
  );
};
