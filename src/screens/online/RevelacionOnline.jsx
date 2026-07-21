import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { normalizarPalabra } from '../../services/salaService';
import { useAudio } from '../../hooks/useAudio';
import { Sparkles, ArrowRight, Trophy } from 'lucide-react';

export default function RevelacionOnline() {
  const { navegarA, todasCategorias } = useGame();
  const {
    sala,
    soyHost,
    listaJugadores,
    siguienteTurnoRevelacion,
    siguientePalabraRevelacion,
    cerrarRondaYAvanzar,
    mandarReaccion
  } = useOnlineGame();
  const { speakCategory, playPlop } = useAudio();

  useEffect(() => {
    if (sala?.estado === 'jugando') navegarA('online-ronda');
    if (sala?.estado === 'finalizada') navegarA('online-podium');
  }, [sala?.estado, navegarA]);

  const revelarGradual = sala?.config?.revelarGradual;
  const velocidad = sala?.config?.velocidadRevelacion || 1;
  const orden = sala?.ordenRevelacion || [];
  const turno = sala?.turnoRevelacion || 0;
  const yaTerminoRevelacion = !revelarGradual || turno >= orden.length;

  const nombreDe = (id) => listaJugadores.find((j) => j.id === id)?.nombre || '???';
  const detalle = sala?.detalleCoincidencias || [];
  const palabrasCoincidentesDe = (jugadorId) =>
    detalle.filter((d) => d.jugadoresIds?.includes(jugadorId));

  const jugadorIdActual = orden[turno];
  const nombreActual = nombreDe(jugadorIdActual);

  const palabrasRaw = sala?.palabrasEnviadas?.[jugadorIdActual];
  const palabras = Array.isArray(palabrasRaw)
    ? palabrasRaw
    : palabrasRaw
      ? Object.keys(palabrasRaw)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((key) => palabrasRaw[key])
      : [];

  const indexRevelado = sala?.palabraReveladaIndex ?? 1;

  // --- 1. Obtener todas las palabras normalizadas ya leídas por jugadores anteriores ---
  const palabrasLeidasAnteriores = new Set();
  orden.slice(0, turno).forEach((id) => {
    const palsRaw = sala?.palabrasEnviadas?.[id];
    const pals = Array.isArray(palsRaw)
      ? palsRaw
      : palsRaw
        ? Object.keys(palsRaw)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((key) => palsRaw[key])
        : [];
    pals.forEach((p) => {
      if (p) palabrasLeidasAnteriores.add(p.trim().toLowerCase());
    });
  });

  const coincidencias = palabrasCoincidentesDe(jugadorIdActual);

  // Índices de palabras de esta tarjeta que coinciden Y ya fueron leídas anteriormente
  const indicesPreLeidos = palabras
    .map((p, idx) => {
      const coincide = coincidencias.some(c => normalizarPalabra(c.palabra) === normalizarPalabra(p));
      const yaLeida = coincide && palabrasLeidasAnteriores.has(p.toLowerCase());
      return yaLeida ? idx : -1;
    })
    .filter(idx => idx !== -1);

  // --- Estados de ritmo: FaseActual ('intro', 'pausaInicial', 'fast', 'pausaIntermedia', 'lenta') ---
  const [faseActual, setFaseActual] = useState('intro');
  const faseActualRef = useRef('intro');
  const [fastReveladasCount, setFastReveladasCount] = useState(0);
  const ultimaPalabraLeidaIndexRef = useRef(0);

  const cambiarFase = (nuevaFase) => {
    faseActualRef.current = nuevaFase;
    setFaseActual(nuevaFase);
  };

  const palabrasRef = useRef(palabras);
  const palabrasLeidasAnterioresRef = useRef(palabrasLeidasAnteriores);
  const coincidenciasRef = useRef(coincidencias);

  // Sincronizar referencias en cada pasada de render
  useEffect(() => {
    palabrasRef.current = palabras;
    palabrasLeidasAnterioresRef.current = palabrasLeidasAnteriores;
    coincidenciasRef.current = coincidencias;
  });

  // Reiniciar flujo y control de voz al cambiar de jugador
  useEffect(() => {
    if (!yaTerminoRevelacion && revelarGradual) {
      cambiarFase('intro');
      setFastReveladasCount(0);
      ultimaPalabraLeidaIndexRef.current = 0;
    } else {
      cambiarFase('lenta');
      ultimaPalabraLeidaIndexRef.current = 0;
    }
  }, [turno, jugadorIdActual]);

  // Manejo secuencial de la línea de tiempo de revelación
  useEffect(() => {
    if (yaTerminoRevelacion || !revelarGradual) return;

    if (faseActual === 'intro') {
      const timer = setTimeout(() => {
        cambiarFase('pausaInicial');
      }, 1000 / velocidad); // 1a: Mostrar nombre
      return () => clearTimeout(timer);
    }

    if (faseActual === 'pausaInicial') {
      const timer = setTimeout(() => {
        // 1c: Tras mostrar el tablero tapado, si hay repetidas, vamos a fast; si no, a la transición.
        if (indicesPreLeidos.length > 0) {
          cambiarFase('fast');
        } else {
          cambiarFase('pausaIntermedia');
        }
      }, 1000 / velocidad); // 1c: Espera
      return () => clearTimeout(timer);
    }

    if (faseActual === 'fast') {
      const timer = setInterval(() => {
        setFastReveladasCount((prev) => {
          const next = prev + 1;
          playPlop(); // Emitir burbuja aguda
          if (next >= indicesPreLeidos.length) {
            clearInterval(timer);
            // Pasar a la pausa de transición post-repaso
            setTimeout(() => {
              cambiarFase('pausaIntermedia');
            }, 400 / velocidad); // delay del último plop
            return indicesPreLeidos.length;
          }
          return next;
        });
      }, 400 / velocidad); // 2: separación entre sonidos de repaso
      return () => clearInterval(timer);
    }

    if (faseActual === 'pausaIntermedia') {
      const timer = setTimeout(() => {
        cambiarFase('lenta');
      }, 1000 / velocidad); // 3: Silencio de transición al terminar repaso
      return () => clearTimeout(timer);
    }
  }, [faseActual, indicesPreLeidos.length, yaTerminoRevelacion, revelarGradual, playPlop, velocidad]);

  // --- 2. Paso automático lento entre palabras (Solo Host y si estamos en fase lenta) ---
  useEffect(() => {
    if (!revelarGradual || yaTerminoRevelacion || !soyHost || !jugadorIdActual || faseActualRef.current !== 'lenta') return;

    const idx = sala?.palabraReveladaIndex ?? 1;
    const currentPalabras = palabrasRef.current;
    
    if (idx <= currentPalabras.length) {
      const palabraActual = currentPalabras[idx - 1];
      let delay = 2500 / velocidad; // 2.5 segundos normal para leer palabras nuevas

      if (palabraActual) {
        const currentCoincidencias = coincidenciasRef.current;
        const currentLeidas = palabrasLeidasAnterioresRef.current;
        
        const coincide = currentCoincidencias.some(
          (c) => normalizarPalabra(c.palabra) === normalizarPalabra(palabraActual)
        );
        const yaLeidaAnteriormente = coincide && currentLeidas.has(palabraActual.toLowerCase());
        
        // 5: Si es repetida, se saltea sin delay (50ms) para no generar silencios
        if (yaLeidaAnteriormente) {
          delay = 50;
        }
      }

      const timer = setTimeout(() => {
        siguientePalabraRevelacion();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [turno, sala?.palabraReveladaIndex, revelarGradual, yaTerminoRevelacion, soyHost, jugadorIdActual, faseActual, siguientePalabraRevelacion]);

  // --- 3. Lectura por voz reactiva (Solo lee palabras nuevas y evita duplicados al inicio) ---
  useEffect(() => {
    if (!revelarGradual || yaTerminoRevelacion || !soyHost || !jugadorIdActual || faseActualRef.current !== 'lenta') return;

    const idx = sala?.palabraReveladaIndex ?? 1;
    
    // Solo proceder si este índice no fue leído en este turno
    if (idx !== ultimaPalabraLeidaIndexRef.current) {
      ultimaPalabraLeidaIndexRef.current = idx;
      
      const currentPalabras = palabrasRef.current;
      const palabraActual = currentPalabras[idx - 1];
      if (palabraActual) {
        const currentCoincidencias = coincidenciasRef.current;
        const currentLeidas = palabrasLeidasAnterioresRef.current;
        
        const coincide = currentCoincidencias.some(
          (c) => normalizarPalabra(c.palabra) === normalizarPalabra(palabraActual)
        );
        const yaLeidaAnteriormente = coincide && currentLeidas.has(palabraActual.toLowerCase());

        // Solo leer en voz alta si es la primera vez que se destapa en la mesa
        if (!yaLeidaAnteriormente) {
          speakCategory(palabraActual);
        }
      }
    }
  }, [turno, sala?.palabraReveladaIndex, revelarGradual, yaTerminoRevelacion, soyHost, jugadorIdActual, faseActual, speakCategory]);

  // --- 4. Lógica de Reacciones de Emojis Flotantes (con filtro debounce de 800ms) ---
  const [reaccionesFlotantes, setReaccionesFlotantes] = useState([]);
  const ultimaReaccionProcesadaRef = useRef({});

  useEffect(() => {
    if (!sala?.jugadores) return;

    const ahora = Date.now();
    const nuevasReacciones = [];

    Object.entries(sala.jugadores).forEach(([id, datos]) => {
      if (datos.reaccion && datos.reaccionTime) {
        const ultimoProcesado = ultimaReaccionProcesadaRef.current[id] || 0;
        const diferenciaTiempo = datos.reaccionTime - ultimoProcesado;

        // Descartar dobles eventos de Firebase si ocurren a menos de 800ms de diferencia
        if (datos.reaccionTime > ultimoProcesado && diferenciaTiempo > 800) {
          ultimaReaccionProcesadaRef.current[id] = datos.reaccionTime;

          if (ahora - datos.reaccionTime < 4000) {
            nuevasReacciones.push({
              id: `${id}_${datos.reaccionTime}`,
              emoji: datos.reaccion,
              nombre: datos.nombre,
              x: Math.floor(Math.random() * 60) + 20, // 20% a 80% horizontal
            });
          }
        }
      }
    });

    if (nuevasReacciones.length > 0) {
      setReaccionesFlotantes(prev => [...prev, ...nuevasReacciones]);
      nuevasReacciones.forEach(reac => {
        setTimeout(() => {
          setReaccionesFlotantes(prev => prev.filter(r => r.id !== reac.id));
        }, 2200);
      });
    }
  }, [sala?.jugadores]);

  if (!sala) return null;

  const avanzarJugador = () => {
    if (turno < orden.length) {
      siguienteTurnoRevelacion();
    }
  };

  const continuarASiguienteRonda = () => {
    cerrarRondaYAvanzar(todasCategorias);
  };

  // --- Vista "de a uno" (velo gradual activo) ---
  if (revelarGradual && !yaTerminoRevelacion) {
    
    // --- 1a: Pantalla de Introducción (Nombre de Jugador) ---
    if (faseActual === 'intro') {
      return (
        <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full relative min-h-screen justify-between overflow-hidden">
          {/* Reacciones Flotantes */}
          <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {reaccionesFlotantes.map((reac) => (
              <div
                key={reac.id}
                className="absolute bottom-32 pointer-events-none flex flex-col items-center animate-float-up text-center"
                style={{ left: `${reac.x}%`, animationDuration: '2.2s' }}
              >
                <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">{reac.emoji}</span>
                <span className="text-[7px] font-black text-white/50 uppercase tracking-widest bg-slate-950/70 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap mt-1">
                  {reac.nombre}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-neon-purple text-xs font-black uppercase tracking-widest mb-3 animate-pulse">
              Siguiente Tarjeta
            </p>
            <h1 className="text-4xl font-black font-display uppercase tracking-wide animate-scale-up text-white">
              {nombreActual}
            </h1>
            <p className="text-text-sub text-xs mt-3 font-semibold">
              Preparate para ver sus coincidencias...
            </p>
          </div>

          {/* Barra de Reacciones Emojis (Elevada para mobile) */}
          <div className="flex justify-center gap-6 py-3.5 bg-slate-950/30 border border-slate-900 rounded-2xl relative z-20 mb-10 pb-4">
            {['😤', '🤣', '🤌🏻', '🧐'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="btn-touch text-2xl hover:scale-125 transition-transform cursor-pointer p-1 active:scale-90"
                onClick={() => mandarReaccion(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // --- 1b & 1c: Pantalla de Tablero / Grilla (Repaso Rápido y Revelación Lenta) ---
    let puntosJugadorParcial = 0;
    if (faseActual === 'pausaInicial') {
      puntosJugadorParcial = 0;
    } else if (faseActual === 'fast') {
      const indicesReveladosEnFast = indicesPreLeidos.slice(0, fastReveladasCount);
      puntosJugadorParcial = palabras.reduce((total, palabra, idx) => {
        if (indicesReveladosEnFast.includes(idx)) {
          const match = coincidencias.find(c => normalizarPalabra(c.palabra) === normalizarPalabra(palabra));
          return total + (match ? match.puntos : 0);
        }
        return total;
      }, 0);
    } else {
      // pausaIntermedia o lenta
      puntosJugadorParcial = palabras.reduce((total, palabra, idx) => {
        const match = coincidencias.find(c => normalizarPalabra(c.palabra) === normalizarPalabra(palabra));
        const esPreLeida = match && palabrasLeidasAnteriores.has(palabra.toLowerCase());
        const esRecorridaLenta = idx < indexRevelado;
        if (match && (esPreLeida || esRecorridaLenta)) {
          return total + match.puntos;
        }
        return total;
      }, 0);
    }

    return (
      <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full relative min-h-screen justify-between overflow-hidden">
        {/* Renderizado de Reacciones Flotantes */}
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {reaccionesFlotantes.map((reac) => (
            <div
              key={reac.id}
              className="absolute bottom-32 pointer-events-none flex flex-col items-center animate-float-up text-center"
              style={{
                left: `${reac.x}%`,
                animationDuration: '2.2s'
              }}
            >
              <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
                {reac.emoji}
              </span>
              <span className="text-[7px] font-black text-white/50 uppercase tracking-widest bg-slate-950/70 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap mt-1">
                {reac.nombre}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 flex flex-col justify-start">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub text-center mb-1">
            Revelando · {turno + 1} / {orden.length}
          </p>
          <h1 className="text-2xl font-black uppercase text-center font-display mb-6">{nombreActual}</h1>

          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {palabras.map((palabra, idx) => {
              const coincide = coincidencias.some(
                (c) => normalizarPalabra(c.palabra) === normalizarPalabra(palabra)
              );
              const yaLeidaAnteriormente = coincide && palabrasLeidasAnteriores.has(palabra.toLowerCase());

              let visible = false;
              if (faseActual === 'pausaInicial') {
                visible = false; // 1c: Grilla mostrada pero todas las palabras ocultas (? )
              } else if (faseActual === 'fast') {
                const indexEnPreLeidos = indicesPreLeidos.indexOf(idx);
                visible = indexEnPreLeidos !== -1 && indexEnPreLeidos < fastReveladasCount;
              } else {
                // Fases pausaIntermedia o lenta
                visible = yaLeidaAnteriormente || idx < indexRevelado;
              }

              // Obtener jugadores coincidentes
              const matchDetalle = coincidencias.find(
                (c) => normalizarPalabra(c.palabra) === normalizarPalabra(palabra)
              );
              const idsCoincidentes = matchDetalle 
                ? matchDetalle.jugadoresIds.filter(id => id !== jugadorIdActual) 
                : [];
              const nombresCoincidentes = idsCoincidentes.map(id => nombreDe(id));

              if (!visible) {
                return (
                  <div
                    key={idx}
                    className="px-3 py-2.5 rounded-lg text-sm font-bold text-center border border-slate-850/40 bg-slate-950/20 text-slate-800 select-none animate-pulse"
                  >
                    ?
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`px-3 py-2.5 rounded-lg text-sm font-bold text-center border transition-all duration-300 relative overflow-visible ${
                    coincide
                      ? 'bg-neon-green/15 border-neon-green text-neon-green shadow-[0_0_8px_rgba(6,214,160,0.15)] font-black'
                      : 'bg-slate-900/50 border-slate-805/85 text-text-sub'
                  }`}
                >
                  <span>{palabra}</span>

                  {/* Animación flotante +1 Nombre en flujo LENTO */}
                  {faseActual === 'lenta' && idx === indexRevelado - 1 && coincide && !yaLeidaAnteriormente && nombresCoincidentes.length > 0 && (
                    <div className="absolute inset-x-0 bottom-full flex flex-col items-center pointer-events-none z-30">
                      {nombresCoincidentes.map((nombre, i) => (
                        <span
                          key={nombre}
                          className="absolute text-neon-green font-black text-[10px] px-2 py-0.5 bg-slate-950/95 border border-neon-green/30 rounded-lg animate-float-up shadow-md whitespace-nowrap"
                          style={{
                            animationDelay: `${i * 350}ms`,
                            transform: `translateY(${i * -14}px)`,
                            opacity: 0
                          }}
                        >
                          +1 "{nombre}"
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="text-center mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub">Puntos de la ronda</p>
            <p className="text-3xl font-black text-neon-green font-display animate-scale-up" key={puntosJugadorParcial}>
              +{puntosJugadorParcial}
            </p>
          </div>
        </div>

        {/* Botonera de Control Host / Estado */}
        <div className="w-full mb-6">
          {soyHost ? (
            <div className="w-full">
              {faseActual === 'pausaInicial' ? (
                <div className="text-center py-3 text-[10px] font-extrabold uppercase tracking-widest text-neon-purple animate-pulse">
                  Preparando grilla...
                </div>
              ) : faseActual === 'fast' ? (
                <div className="text-center py-3 text-[10px] font-extrabold uppercase tracking-widest text-yellow-500 animate-pulse">
                  Repasando aciertos anteriores...
                </div>
              ) : faseActual === 'pausaIntermedia' ? (
                <div className="text-center py-3 text-[10px] font-extrabold uppercase tracking-widest text-yellow-500 animate-pulse">
                  Listos para revelar palabras nuevas...
                </div>
              ) : indexRevelado <= palabras.length ? (
                <div className="text-center py-3 text-[10px] font-extrabold uppercase tracking-widest text-neon-green animate-pulse">
                  Revelando palabras automáticamente...
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-touch w-full py-4.5 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2 cursor-pointer"
                  onClick={turno === orden.length - 1 && sala.config.rondas !== 'infinito' && sala.rondaActual >= sala.config.rondas ? continuarASiguienteRonda : avanzarJugador}
                >
                  <Sparkles className="w-4 h-4" /> {turno === orden.length - 1 ? (sala.config.rondas !== 'infinito' && sala.rondaActual >= sala.config.rondas ? 'Terminar Partida y Ver Podio' : 'Ver Resultados') : 'Siguiente Jugador'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
              {faseActual === 'pausaInicial' || faseActual === 'fast' || faseActual === 'pausaIntermedia'
                ? 'Repasando aciertos anteriores...'
                : 'Esperando al anfitrión...'}
            </p>
          )}
        </div>

        {/* Barra de Reacciones Emojis (Elevada para mobile) */}
        <div className="flex justify-center gap-6 py-3.5 bg-slate-950/30 border border-slate-900 rounded-2xl relative z-20 mb-10 pb-4">
          {['😤', '🤣', '🤌🏻', '🧐'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="btn-touch text-2xl hover:scale-125 transition-transform cursor-pointer p-1 active:scale-90"
              onClick={() => mandarReaccion(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // --- Tabla completa de la ronda (velo desactivado, o ya se reveló a todos) ---
  const posiciones = Object.entries(sala.puntosRondaActual || {})
    .map(([id, puntos]) => ({ id, puntos, total: (sala.puntajes?.[id] || 0) + puntos }))
    .sort((a, b) => b.total - a.total);

  const esUltimaRonda =
    sala.config.rondas !== 'infinito' && sala.rondaActual >= sala.config.rondas;

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full relative min-h-screen justify-between overflow-hidden">
      {/* Renderizado de Reacciones Flotantes */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {reaccionesFlotantes.map((reac) => (
          <div
            key={reac.id}
            className="absolute bottom-32 pointer-events-none flex flex-col items-center animate-float-up text-center"
            style={{
              left: `${reac.x}%`,
              animationDuration: '2.2s'
            }}
          >
            <span className="text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]">
              {reac.emoji}
            </span>
            <span className="text-[7px] font-black text-white/50 uppercase tracking-widest bg-slate-950/70 px-1.5 py-0.5 rounded border border-white/5 whitespace-nowrap mt-1">
              {reac.nombre}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-start">
        <h1 className="text-xl font-black uppercase text-center font-display mb-6 flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" /> Resultado de la Ronda {sala.rondaActual}
        </h1>

        <div className="flex flex-col gap-2.5 mb-8">
          {posiciones.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-805/85"
            >
              <span className="font-bold text-sm">
                #{idx + 1} {nombreDe(p.id)}
              </span>
              <span className="text-sm font-black">
                {p.total} pts <span className="text-neon-green">(+{p.puntos})</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full flex flex-col gap-4">
        {soyHost ? (
          <button
            type="button"
            className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase cursor-pointer"
            onClick={continuarASiguienteRonda}
          >
            {esUltimaRonda ? 'Ver Podio Final' : 'Siguiente Ronda'}
          </button>
        ) : (
          <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
            Esperando al anfitrión...
          </p>
        )}

        {/* Barra de Reacciones Emojis (Elevada para mobile) */}
        <div className="flex justify-center gap-6 py-3.5 bg-slate-950/30 border border-slate-900 rounded-2xl relative z-20 mb-10 pb-4">
          {['😤', '🤣', '🤌🏻', '🧐'].map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="btn-touch text-2xl hover:scale-125 transition-transform cursor-pointer p-1 active:scale-90"
              onClick={() => mandarReaccion(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
