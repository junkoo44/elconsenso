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
  salirDeSala,
  avanzarPalabraRevelacion,
  enviarReaccionOnline,
} from '../services/salaService';

import { saveMatchToHistory } from '../services/categories';
import { db } from '../services/firebase';
import { ref, get } from 'firebase/database';

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
            // Solo reconectar si la sala no finalizó y el jugador está registrado
            if (datosSala.estado !== 'finalizada' && datosSala.jugadores?.[idGuardado]) {
              console.log(`Reconectado automáticamente a la sala ${codigoGuardado}`);
              setCodigoSala(codigoGuardado);
              setJugadorId(idGuardado);
              
              // Sincronizar URL si es necesario
              if (!window.location.pathname.includes(`/sala/${codigoGuardado}`)) {
                window.history.pushState({}, '', `/sala/${codigoGuardado}`);
              }
              return;
            }
          }
          // Si no es válida, limpiamos cache
          localStorage.removeItem("consenso_online_codigo");
          localStorage.removeItem("consenso_online_jugador_id");
        } catch (e) {
          console.warn("Fallo al intentar reconexión automática:", e);
        }
      }
    };
    
    intentarReconexion();
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
    if (!codigoSala || !sala) return;
    const ordenRevelacion = Object.keys(sala.jugadores);
    // Mezclar orden de forma aleatoria (Fisher-Yates)
    for (let i = ordenRevelacion.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ordenRevelacion[i], ordenRevelacion[j]] = [ordenRevelacion[j], ordenRevelacion[i]];
    }
    return iniciarRevelacion(codigoSala, sala.palabrasEnviadas || {}, ordenRevelacion);
  }, [codigoSala, sala]);

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
          .every(([id, _]) => (sala.palabrasEnviadas?.[id]?.length ?? 0) > 0)
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
      }}
    >
      {children}
    </OnlineGameContext.Provider>
  );
};
