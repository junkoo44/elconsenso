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
} from '../services/salaService';

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
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const unsubscribeRef = useRef(null);

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

  const crear = useCallback(async (nombreHost, configInicial) => {
    setCargando(true);
    setError(null);
    try {
      const { codigoSala: codigo, jugadorId: id } = await crearSala(nombreHost, configInicial);
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
    return iniciarRevelacion(codigoSala, sala.palabrasEnviadas || {}, ordenRevelacion);
  }, [codigoSala, sala]);

  const siguienteTurnoRevelacion = useCallback(() => {
    if (!codigoSala) return;
    return avanzarTurnoRevelacion(codigoSala);
  }, [codigoSala]);

  const cerrarRondaYAvanzar = useCallback((categoriasPool) => {
    if (!codigoSala) return;
    return finalizarRevelacionRonda(codigoSala, categoriasPool);
  }, [codigoSala]);

  // Helpers derivados, pensados para no repetir lógica en cada pantalla
  const soyHost = sala?.host === jugadorId;
  const miNombre = sala?.jugadores?.[jugadorId]?.nombre;
  const listaJugadores = sala
    ? Object.entries(sala.jugadores || {}).map(([id, datos]) => ({ id, ...datos }))
    : [];
  const todosEnviaronPalabras =
    sala && sala.jugadores
      ? Object.keys(sala.jugadores).every((id) => (sala.palabrasEnviadas?.[id]?.length ?? 0) > 0)
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
        cerrarRondaYAvanzar,
      }}
    >
      {children}
    </OnlineGameContext.Provider>
  );
};
