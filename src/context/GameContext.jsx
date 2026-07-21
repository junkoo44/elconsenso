import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCategories, saveMatchToHistory } from '../services/categories';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame debe ser usado dentro de un GameProvider");
  }
  return context;
};

export const GameProvider = ({ children }) => {
  const [vistaActual, setVistaActual] = useState('home');
  const vistaActualRef = React.useRef('home');
  const [modalSalirOpen, setModalSalirOpen] = useState(false);

  // Interceptar el botón "Atrás" de Android y sincronizar historial
  useEffect(() => {
    vistaActualRef.current = vistaActual;
  }, [vistaActual]);

  useEffect(() => {
    // Inicializar el historial con DOBLE FONDO
    if (!window.history.state) {
      window.history.replaceState({ base: true }, "");
      window.history.pushState({ vista: 'home' }, "");
    }

    const handlePopState = (event) => {
      // 1. Siempre emitimos señal de cerrar modales en cualquier retroceso
      window.dispatchEvent(new Event('close-modals'));

      // 2. Si llegamos al fondo falso, volvemos a empujar para que el historial nunca quede vacío
      if (event.state && event.state.base) {
        window.history.pushState({ vista: vistaActualRef.current }, "");
        return;
      }

      // 3. Verificamos si estamos en una pantalla crítica que no debe cerrarse
      const vistaBloqueada = ['game', 'online-ronda', 'online-revelacion'].includes(vistaActualRef.current);
      
      if (vistaBloqueada) {
        setModalSalirOpen(true);
        window.history.pushState({ vista: vistaActualRef.current }, "");
        return;
      }

      // 4. Navegación normal
      if (event.state && event.state.vista) {
        setVistaActual(event.state.vista);
      } else {
        setVistaActual('home');
        window.history.replaceState({ base: true }, "");
        window.history.pushState({ vista: 'home' }, "");
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navegarA = (nuevaVista) => {
    setVistaActual(nuevaVista);
    window.history.pushState({ vista: nuevaVista }, "");
  };
  
  // Lista de categorías global cargada desde Storage
  const [todasCategorias, setTodasCategorias] = useState([]);

  // Configuración de audio persistente
  const [muteSonidos, setMuteSonidos] = useState(() => {
    return localStorage.getItem('consenso_mute_sonidos') === 'true';
  });
  const [muteVoz, setMuteVoz] = useState(() => {
    return localStorage.getItem('consenso_mute_voz') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('consenso_mute_sonidos', muteSonidos);
  }, [muteSonidos]);

  useEffect(() => {
    localStorage.setItem('consenso_mute_voz', muteVoz);
  }, [muteVoz]);

  const toggleMuteSonidos = () => setMuteSonidos(prev => !prev);
  const toggleMuteVoz = () => setMuteVoz(prev => !prev);

  // Configuración de tema visual persistente
  const [temaActual, setTemaActual] = useState(() => {
    return localStorage.getItem('consenso_tema') || 'neon';
  });

  useEffect(() => {
    localStorage.setItem('consenso_tema', temaActual);
  }, [temaActual]);

  const cambiarSiguienteTema = () => {
    const temas = ['neon', 'crimson', 'ocean', 'forest', 'arcade'];
    setTemaActual(prev => {
      const idx = temas.indexOf(prev);
      const nextIdx = (idx + 1) % temas.length;
      return temas[nextIdx];
    });
  };


  
  // Configuración de la partida
  const [jugadores, setJugadores] = useState([]);
  const [config, setConfig] = useState({
    rondas: 5, // Número, o "infinito"
    tiempo: 75,
    llevarPuntaje: true,
    categoriasActivas: [] // Array de ids
  });

  // Estado del flujo de juego
  const [partidaEnCurso, setPartidaEnCurso] = useState(false);
  const [rondaActual, setRondaActual] = useState(1);
  const [categoriaActual, setCategoriaActual] = useState(null);
  const [palabraActual, setPalabraActual] = useState("");
  const [lectorRonda, setLectorRonda] = useState("");
  const [categoriasJugadas, setCategoriasJugadas] = useState([]);
  const [puntajes, setPuntajes] = useState({}); // { jugador: puntos }
  const [historialRondas, setHistorialRondas] = useState([]); // [{ ronda: X, posiciones: { jugador: rank } }]
  const [ultimoDeltaPuntos, setUltimoDeltaPuntos] = useState({}); // { jugador: puntosDeLaRonda }

  /**
   * Elige una palabra al azar del banco de la categoría
   */
  const elegirPalabraAleatoria = (categoria) => {
    if (!categoria || !categoria.palabras || categoria.palabras.length === 0) {
      return "Sin Palabra";
    }
    const idx = Math.floor(Math.random() * categoria.palabras.length);
    return categoria.palabras[idx];
  };

  // Cargar categorías al montar
  useEffect(() => {
    const cats = getCategories();
    setTodasCategorias(cats);
    // Por defecto, activar todas las categorías disponibles
    setConfig(prev => ({
      ...prev,
      categoriasActivas: cats.map(c => c.id)
    }));
  }, []);

  /**
   * Refresca las categorías desde localStorage (por si hubo ediciones externas)
   */
  const recargarCategorias = () => {
    const cats = getCategories();
    setTodasCategorias(cats);
  };

  /**
   * Inicializa una nueva partida
   */
  const iniciarNuevaPartida = (listaJugadores, nuevaConfig) => {
    if (listaJugadores.length < 3) {
      alert("Se necesitan al menos 3 jugadores para comenzar.");
      return false;
    }
    setJugadores(listaJugadores);
    setConfig(nuevaConfig);
    
    // Inicializar puntajes en 0
    const inicialPuntajes = {};
    listaJugadores.forEach(j => {
      inicialPuntajes[j] = 0;
    });
    setPuntajes(inicialPuntajes);
    
    // Reset de rondas e historial
    setRondaActual(1);
    setCategoriasJugadas([]);
    setHistorialRondas([]);
    setUltimoDeltaPuntos({});
    
    // Seleccionar la primera categoría del pool activo
    const pool = todasCategorias.filter(c => nuevaConfig.categoriasActivas.includes(c.id));
    if (pool.length === 0) {
      alert("¡No hay categorías seleccionadas para jugar!");
      return false;
    }
    
    const primeraCat = seleccionarCategoriaAleatoria(pool, []);
    setCategoriaActual(primeraCat);
    setPalabraActual(elegirPalabraAleatoria(primeraCat));
    setLectorRonda(listaJugadores[0]); // El primer jugador empieza leyendo
    setCategoriasJugadas([primeraCat.id]);
    
    setPartidaEnCurso(true);
    return true;
  };

  /**
   * Selecciona una categoría aleatoria de las disponibles sin repetir
   */
  const seleccionarCategoriaAleatoria = (pool, jugadas) => {
    const disponibles = pool.filter(c => !jugadas.includes(c.id));
    
    // Si se agotaron todas las categorías del pool, reiniciamos barajando de nuevo
    if (disponibles.length === 0) {
      const indice = Math.floor(Math.random() * pool.length);
      return pool[indice];
    }
    
    const indice = Math.floor(Math.random() * disponibles.length);
    return disponibles[indice];
  };

  /**
   * Avanza a la siguiente ronda
   */
  const avanzarSiguienteRonda = () => {
    const pool = todasCategorias.filter(c => config.categoriasActivas.includes(c.id));
    const nuevaCat = seleccionarCategoriaAleatoria(pool, categoriasJugadas);
    
    setCategoriaActual(nuevaCat);
    setPalabraActual(elegirPalabraAleatoria(nuevaCat));
    // Asignar el siguiente lector de forma rotativa según el número de la siguiente ronda
    setLectorRonda(jugadores[rondaActual % jugadores.length]);
    setCategoriasJugadas(prev => [...prev, nuevaCat.id]);
    setRondaActual(prev => prev + 1);
  };

  /**
   * Registra los puntos de la ronda actual y calcula las posiciones/deltas
   */
  const registrarPuntajesRonda = (puntosRonda) => {
    setUltimoDeltaPuntos(puntosRonda);
    
    // Calcular nuevos puntajes acumulados
    const nuevosPuntajes = { ...puntajes };
    jugadores.forEach(j => {
      nuevosPuntajes[j] = (nuevosPuntajes[j] || 0) + (puntosRonda[j] || 0);
    });
    
    // Guardar el ranking de posiciones de esta ronda para calcular flechas de movimiento
    const rankingActual = calcularRanking(nuevosPuntajes);
    const registroRonda = {
      ronda: rondaActual,
      posiciones: rankingActual // { jugador: posicionIndex }
    };
    
    setHistorialRondas(prev => [...prev, registroRonda]);
    setPuntajes(nuevosPuntajes);
  };

  /**
   * Calcula el ranking en base a los puntajes acumulados
   * Retorna un mapa: { "NombreJugador": posicion (1, 2, 3...) }
   */
  const calcularRanking = (mapaPuntajes) => {
    const sorted = Object.entries(mapaPuntajes)
      .map(([nombre, puntos]) => ({ nombre, puntos }))
      .sort((a, b) => b.puntos - a.puntos);
    
    const posiciones = {};
    let pos = 1;
    for (let i = 0; i < sorted.length; i++) {
      // Manejar empates de posición
      if (i > 0 && sorted[i].puntos < sorted[i - 1].puntos) {
        pos = i + 1;
      }
      posiciones[sorted[i].nombre] = pos;
    }
    return posiciones;
  };

  /**
   * Obtiene la tendencia de posición del jugador comparando esta ronda con la anterior
   * Retorna 'subio', 'bajo' o 'mantuvo'
   */
  const obtenerTendenciaJugador = (jugador) => {
    if (historialRondas.length < 2) return 'mantuvo';
    
    const rondaActualIndex = historialRondas.length - 1;
    const posicionActual = historialRondas[rondaActualIndex].posiciones[jugador];
    const posicionAnterior = historialRondas[rondaActualIndex - 1].posiciones[jugador];
    
    if (posicionActual < posicionAnterior) return 'subio'; // Nota: menor número de ranking = mejor posición (1er puesto es mejor que 2do)
    if (posicionActual > posicionAnterior) return 'bajo';
    return 'mantuvo';
  };

  /**
   * Finaliza la partida y la escribe en el historial
   */
  const finalizarPartida = () => {
    if (!partidaEnCurso) return;
    
    const sortedScores = Object.entries(puntajes)
      .map(([nombre, puntos]) => ({ nombre, puntos }))
      .sort((a, b) => b.puntos - a.puntos);
    
    const ganador = sortedScores.length > 0 ? sortedScores[0].nombre : "Sin ganador";
    
    // Crear objeto de historial
    const now = new Date();
    const partidaInfo = {
      fecha: now.toLocaleDateString(),
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ganador,
      tablaFinal: sortedScores
    };
    
    saveMatchToHistory(partidaInfo);
    setPartidaEnCurso(false);
    setVistaActual('podium');
  };

  /**
   * Finaliza una partida cuando no se lleva puntaje, registrando manualmente al ganador
   */
  const finalizarPartidaSinPuntaje = (ganadorNombre) => {
    if (!partidaEnCurso) return;

    const fakeScores = jugadores.map(nombre => ({
      nombre,
      puntos: nombre === ganadorNombre ? 1 : 0
    })).sort((a, b) => b.puntos - a.puntos);

    const now = new Date();
    const partidaInfo = {
      fecha: now.toLocaleDateString(),
      hora: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ganador: ganadorNombre,
      tablaFinal: fakeScores
    };

    saveMatchToHistory(partidaInfo);
    
    // Inyectar puntaje ficticio para que Podium.jsx renderice el podio
    const puntajesFicticios = {};
    jugadores.forEach(j => {
      puntajesFicticios[j] = j === ganadorNombre ? 1 : 0;
    });
    setPuntajes(puntajesFicticios);

    setPartidaEnCurso(false);
    setVistaActual('podium');
  };

  return (
    <GameContext.Provider value={{
      vistaActual,
      navegarA,
      todasCategorias,
      jugadores,
      config,
      partidaEnCurso,
      rondaActual,
      categoriaActual,
      palabraActual,
      categoriasJugadas,
      puntajes,
      ultimoDeltaPuntos,
      recargarCategorias,
      setJugadores,
      setConfig,
      iniciarNuevaPartida,
      avanzarSiguienteRonda,
      registrarPuntajesRonda,
      obtenerTendenciaJugador,
      finalizarPartida,
      finalizarPartidaSinPuntaje,
      setPartidaEnCurso,
      muteSonidos,
      muteVoz,
      toggleMuteSonidos,
      toggleMuteVoz,
      temaActual,
      setTemaActual,
      cambiarSiguienteTema,
      lectorRonda,
      modalSalirOpen,
      setModalSalirOpen
    }}>
      {children}
    </GameContext.Provider>
  );
};

