import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useAudio } from '../hooks/useAudio';
import { 
  Flag, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  Users, 
  Bell, 
  ArrowRight, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export default function Game() {
  const { 
    jugadores, 
    config, 
    rondaActual, 
    categoriaActual, 
    palabraActual,
    categoriasJugadas,
    finalizarPartida, 
    finalizarPartidaSinPuntaje,
    avanzarSiguienteRonda,
    registrarPuntajesRonda,
    navegarA,
    muteSonidos,
    muteVoz,
    toggleMuteSonidos,
    toggleMuteVoz,
    lectorRonda
  } = useGame();

  const {
    playCountdownBeep,
    playTick,
    playBuzzer,
    speakCategory
  } = useAudio();

  // Estados de fase: 'countdown' | 'playing' | 'finished'
  const [fase, setFase] = useState('countdown');
  
  // Contadores
  const [contadorInicial, setContadorInicial] = useState(3);
  const [tiempoRestante, setTiempoRestante] = useState(config.tiempo);

  // Wake Lock Sentinel Ref
  const wakeLockSentinel = useRef(null);
  
  // Timer Interval Ref
  const timerInterval = useRef(null);
  
  // Tiempo transcurrido para habilitar el botón "Terminar ya" (min 10 segundos)
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);

  // Estado para el modal de confirmación de abandono (reemplaza confirm nativo)
  const [modalAbandonarOpen, setModalAbandonarOpen] = useState(false);

  // Estado para el modal de selección de ganador manual (cuando no se lleva puntaje)
  const [modalGanadorOpen, setModalGanadorOpen] = useState(false);

  // Referencias mutables para que el temporizador lea el estado del sonido sin reiniciarse
  const muteSonidosRef = useRef(muteSonidos);
  const muteVozRef = useRef(muteVoz);

  // Mantener las referencias de audio actualizadas sin disparar re-renders en el interval
  useEffect(() => {
    muteSonidosRef.current = muteSonidos;
  }, [muteSonidos]);

  useEffect(() => {
    muteVozRef.current = muteVoz;
  }, [muteVoz]);

  // --- 1. Fase de Cuenta Regresiva (Countdown) ---
  useEffect(() => {
    if (fase !== 'countdown') return;

    // Reproducir primer beep de inmediato si no está muteado
    if (contadorInicial === 3 && !muteSonidosRef.current) {
      playCountdownBeep(440); // A4
    }

    const interval = setInterval(() => {
      setContadorInicial(prev => {
        const next = prev - 1;
        
        // Tonos ascendentes
        if (next === 2 && !muteSonidosRef.current) playCountdownBeep(554); // C#5
        if (next === 1 && !muteSonidosRef.current) playCountdownBeep(659); // E5
        
        if (next === 0) {
          clearInterval(interval);
          if (!muteSonidosRef.current) playCountdownBeep(880); // A5 (Arranca)
          setFase('playing');
          return 3; // Reset
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fase, playCountdownBeep]);

  // --- 2. Wake Lock API (Gestión de pantalla activa) ---
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockSentinel.current = await navigator.wakeLock.request('screen');
        console.log("Wake Lock: Pantalla bloqueada para evitar apagado.");
      }
    } catch (err) {
      console.warn("Wake Lock: No se pudo adquirir el bloqueo de pantalla:", err);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockSentinel.current) {
      wakeLockSentinel.current.release()
        .then(() => {
          wakeLockSentinel.current = null;
          console.log("Wake Lock: Bloqueo de pantalla liberado.");
        });
    }
  };

  // --- 3. Lector por Voz Único (Se dispara una sola vez al entrar a 'playing') ---
  const vozHabladaRef = useRef(false);
  useEffect(() => {
    if (fase === 'playing' && !vozHabladaRef.current) {
      if (!muteVozRef.current && palabraActual) {
        // Micro-pausa de 50ms para sincronizar perfectamente con el renderizado de la palabra
        const speechTimer = setTimeout(() => {
          speakCategory(palabraActual);
        }, 50);
        vozHabladaRef.current = true;
        return () => clearTimeout(speechTimer);
      }
    }
    
    // Resetear la referencia cuando no estemos en la fase playing para la siguiente ronda
    if (fase !== 'playing') {
      vozHabladaRef.current = false;
    }
  }, [fase, palabraActual, speakCategory]);

  // --- 4. Fase de Juego Activo (Playing: Intervalo e incremento de tiempo) ---
  useEffect(() => {
    if (fase !== 'playing') return;

    requestWakeLock();

    timerInterval.current = setInterval(() => {
      setTiempoTranscurrido(prev => prev + 1);
      
      setTiempoRestante(prev => {
        const next = prev - 1;

        // Sonidos de Tictac en los últimos 10 segundos
        if (next <= 10 && next > 0 && !muteSonidosRef.current) {
          playTick();
        }

        // Fin del tiempo
        if (next === 0) {
          clearInterval(timerInterval.current);
          if (!muteSonidosRef.current) playBuzzer();
          releaseWakeLock();
          setFase('finished');
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      releaseWakeLock();
    };
  }, [fase, playTick, playBuzzer]);

  // --- 5. Círculo SVG del Temporizador ---
  const SVG_SIZE = 192;
  const R = 80;
  const C = 2 * Math.PI * R;
  
  // Calcular el offset: En countdown el círculo está completo, en playing se vacía
  const strokeDashoffset = fase === 'countdown' 
    ? 0 
    : C - (tiempoRestante / config.tiempo) * C;
  
  const esUltimos10s = fase === 'playing' && tiempoRestante <= 10;
  const habilitarTerminarYa = fase === 'playing' && tiempoTranscurrido >= 10;

  // --- 6. Finalización de la Ronda Manual ---
  const handleTerminarRondaManual = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (!muteSonidosRef.current) playBuzzer();
    releaseWakeLock();
    setFase('finished');
  };

  // --- 7. Abandono de partida ---
  const handleAbandonarConfirmado = () => {
    if (timerInterval.current) clearInterval(timerInterval.current);
    releaseWakeLock();
    setModalAbandonarOpen(false);
    navegarA('setup');
  };

  // --- 8. Acciones de Fin de Ronda sin puntaje ---
  const handleSiguienteRondaSinPuntaje = () => {
    const limiteSuperado = config.rondas !== 'infinito' && rondaActual >= config.rondas;
    if (limiteSuperado) {
      const puntosFicticios = {};
      jugadores.forEach(j => { puntosFicticios[j] = 0; });
      registrarPuntajesRonda(puntosFicticios);
      finalizarPartida();
      navegarA('home');
    } else {
      setTiempoRestante(config.tiempo);
      setTiempoTranscurrido(0);
      avanzarSiguienteRonda();
      setFase('countdown');
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between py-6 px-4 relative">
      
      {/* 🧾 Cabecera de Juego (Siempre visible en Countdown y Playing para consistencia estética) */}
      {fase !== 'finished' && (
        <div className="flex items-center justify-between border-b border-slate-900 pb-3 h-14">
          <button 
            type="button" 
            className="text-xs font-bold text-neon-red hover:text-red-500 flex items-center gap-1 btn-touch cursor-pointer transition-colors"
            onClick={() => setModalAbandonarOpen(true)}
          >
            <Flag className="w-4 h-4" /> Abandonar
          </button>
          <h2 className="text-sm font-black tracking-widest uppercase text-white font-display">
            Ronda {rondaActual} {config.rondas !== 'infinito' ? `de ${config.rondas}` : '(∞)'}
          </h2>
          
          {/* Controles flotantes de Sonido idénticos al Home */}
          <div className="flex gap-2 z-20">
            <button 
              type="button" 
              className="btn-touch w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center cursor-pointer transition-colors shadow-md"
              onClick={toggleMuteSonidos}
              title={muteSonidos ? "Activar efectos de sonido" : "Silenciar efectos de sonido"}
            >
              {muteSonidos ? <VolumeX className="w-4 h-4 text-neon-red" /> : <Volume2 className="w-4 h-4 text-neon-green" />}
            </button>
            <button 
              type="button" 
              className="btn-touch w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center cursor-pointer transition-colors shadow-md"
              onClick={toggleMuteVoz}
              title={muteVoz ? "Activar lector de voz" : "Silenciar lector de voz"}
            >
              {muteVoz ? <MicOff className="w-4 h-4 text-neon-red" /> : <Mic className="w-4 h-4 text-neon-purple" />}
            </button>
          </div>
        </div>
      )}

      {/* 2. RENDER DE CUENTA REGRESIVA O TEMPORIZADOR ACTIVO (LAYOUT UNIFICADO SIN SALTOS) */}
      {fase !== 'finished' && (
        <main className="flex-1 flex flex-col justify-center items-center gap-8 my-8 text-center animate-scale-up">
          
          {/* Fila superior: Info de Categoría y Palabra (Estática durante la cuenta regresiva) */}
          <div className="h-28 flex flex-col justify-center gap-1.5">
            {fase === 'countdown' ? (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black tracking-widest text-neon-purple uppercase animate-pulse">
                  Preparados para la ronda
                </span>
                <span className="text-text-sub text-[11px] font-bold uppercase tracking-wider">
                  Leé la palabra en el centro al comenzar
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-black tracking-widest text-neon-green uppercase">
                  Categoría: {categoriaActual ? categoriaActual.nombre : "Sin Categoría"}
                </span>
                <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-wide border-y border-slate-900 py-4 my-1 drop-shadow-[0_4px_12px_rgba(124,58,237,0.15)] font-display">
                  {palabraActual || "Sin Palabra"}
                </h1>
              </div>
            )}
          </div>

          {/* Temporizador circular SVG Unificado */}
          <div className={`relative flex items-center justify-center select-none ${esUltimos10s ? 'animate-scale-pulse' : ''}`}>
            <svg width={SVG_SIZE} height={SVG_SIZE} className="transform -rotate-90">
              {/* Círculo de fondo */}
              <circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={R}
                fill="transparent"
                stroke="#1E293B"
                strokeWidth="8"
              />
              {/* Círculo de progreso animado */}
              <circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={R}
                fill="transparent"
                stroke={esUltimos10s ? '#FF6B6B' : '#7C3AED'}
                strokeWidth="8"
                strokeDasharray={C}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            
            {/* Texto en medio del círculo (Números 3, 2, 1 o segundos restantes) */}
            <div className="absolute inset-0 flex items-center justify-center">
              {fase === 'countdown' ? (
                <span 
                  key={contadorInicial} 
                  className="text-7xl font-black text-white select-none font-display drop-shadow-[0_4px_15px_rgba(124,58,237,0.3)] animate-scale-up"
                >
                  {contadorInicial}
                </span>
              ) : (
                <span 
                  key={tiempoRestante} 
                  className={`text-6xl font-black select-none font-display drop-shadow-[0_4px_15px_rgba(124,58,237,0.3)] animate-scale-up ${esUltimos10s ? 'text-neon-red' : 'text-white'}`}
                >
                  {tiempoRestante}
                </span>
              )}
            </div>
          </div>

          {/* Fila inferior: Jugadores activos en mesa */}
          <div className="text-[10px] font-bold text-text-sub flex items-center gap-1.5 justify-center uppercase tracking-wider h-6">
            <Users className="w-3.5 h-3.5 text-neon-purple animate-pulse" /> {jugadores.length} jugadores en la mesa
          </div>
          
        </main>
      )}

      {/* Botón de control inferior para la fase activa */}
      {fase === 'playing' && (
        <div className="min-h-[64px] flex items-center">
          {habilitarTerminarYa ? (
            <button
              type="button"
              className="btn-touch w-full py-4.5 px-6 bg-neon-red hover:bg-red-500 text-white font-extrabold rounded-2xl shadow-xl shadow-neon-red/10 tracking-widest text-sm uppercase animate-scale-up cursor-pointer flex items-center justify-center gap-2 border-b-4 border-red-905"
              onClick={handleTerminarRondaManual}
            >
              <Bell className="w-4 h-4" /> Terminar ya
            </button>
          ) : (
            <p className="text-text-sub text-center w-full text-[10px] font-bold uppercase tracking-wider italic animate-pulse">
              El botón "Terminar ya" se habilitará en {10 - tiempoTranscurrido}s...
            </p>
          )}
        </div>
      )}

      {/* 3. RENDER FIN DE RONDA (FINISHED) */}
      {fase === 'finished' && (
        <div className="flex-1 flex flex-col justify-between py-4 animate-scale-up">
          <div className="text-center my-auto flex flex-col items-center gap-6">
            <div className="w-20 h-20 bg-neon-red/10 border border-neon-red/30 rounded-3xl flex items-center justify-center animate-bounce">
              <Bell className="w-10 h-10 text-neon-red animate-pulse" />
            </div>
            <h1 className="text-5xl font-black tracking-widest text-neon-red uppercase font-display">
              ¡TIEMPO!
            </h1>
            <p className="text-text-sub text-xs max-w-[280px] leading-relaxed font-bold uppercase tracking-wider">
              Dejen los lápices y prepárense para contar.
            </p>
            
            <div className="bg-slate-900/40 border border-slate-805/85 rounded-2xl p-5 w-full text-left mt-6 shadow-xl">
              <h3 className="text-xs font-black tracking-widest text-neon-green uppercase mb-3 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-neon-green" /> Resumen de Ronda
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-text-sub font-bold uppercase text-[10px]">Palabra jugada:</span>
                  <span className="font-extrabold text-white">{palabraActual}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-text-sub font-bold uppercase text-[10px]">Categoría:</span>
                  <span className="font-extrabold text-slate-300">{categoriaActual?.nombre}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-text-sub font-bold uppercase text-[10px]">Lector inicial:</span>
                  <span className="font-extrabold text-neon-purple flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-neon-purple animate-pulse" /> {lectorRonda}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-sub font-bold uppercase text-[10px]">Ronda completada:</span>
                  <span className="font-extrabold text-white">
                    {rondaActual} {config.rondas !== 'infinito' ? `de ${config.rondas}` : '(Infinito)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            {config.llevarPuntaje ? (
              <button
                type="button"
                className="btn-touch w-full py-4.5 px-6 bg-neon-green hover:bg-emerald-500 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-neon-green/10 tracking-widest text-sm uppercase cursor-pointer flex items-center justify-center gap-2 border-b-4 border-emerald-900"
                onClick={() => navegarA('score')}
              >
                Contar Consensos
              </button>
            ) : (
              <button
                type="button"
                className="btn-touch w-full py-4.5 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl shadow-xl shadow-neon-purple/10 tracking-widest text-sm uppercase cursor-pointer flex items-center justify-center gap-1.5 border-b-4 border-violet-900"
                onClick={() => {
                  const limiteSuperado = config.rondas !== 'infinito' && rondaActual >= config.rondas;
                  if (limiteSuperado) {
                    setModalGanadorOpen(true);
                  } else {
                    handleSiguienteRondaSinPuntaje();
                  }
                }}
              >
                {config.rondas !== 'infinito' && rondaActual >= config.rondas 
                  ? 'Registrar Ganador' 
                  : <>Siguiente Ronda <ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🏳️ Modal Confirmación Abandonar Partida */}
      {modalAbandonarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-space-dark border-2 border-neon-red rounded-2xl max-w-xs w-full p-6 text-center shadow-2xl relative animate-scale-up">
            <div className="mx-auto mb-3.5 w-12 h-12 bg-neon-red/10 border border-neon-red/30 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-neon-red animate-pulse" />
            </div>
            <h3 className="text-sm font-black tracking-widest uppercase text-white mb-2 font-display">
              ¿Abandonar Partida?
            </h3>
            <p className="text-text-sub text-[11px] leading-relaxed mb-6 font-semibold">
              ¿Seguro que querés salir al menú? Perderás todo el progreso acumulado en esta partida.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-touch flex-1 py-2.5 bg-slate-900 border border-slate-850 text-text-sub font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                onClick={() => setModalAbandonarOpen(false)}
              >
                Seguir jugando
              </button>
              <button
                type="button"
                className="btn-touch flex-1 py-2.5 bg-neon-red hover:bg-red-650 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 border-red-900 cursor-pointer"
                onClick={handleAbandonarConfirmado}
              >
                Sí, salir
              </button>
            </div>
            </div>
          </div>
        )}

      {/* 🏆 Modal Selección de Ganador Manual */}
      {modalGanadorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-space-dark border-2 border-neon-purple rounded-2xl max-w-xs w-full p-6 shadow-2xl relative animate-scale-up">
            <h3 className="text-sm font-black tracking-widest uppercase text-center text-white mb-2 font-display">
              ¿Quién ganó la partida?
            </h3>
            <p className="text-[10px] text-text-sub font-bold uppercase tracking-wider text-center mb-5">
              Seleccioná al ganador del podio
            </p>

            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 mb-6">
              {jugadores.map((nombre) => (
                <button
                  key={nombre}
                  type="button"
                  className="btn-touch w-full p-3 rounded-xl border border-slate-805/85 bg-slate-900/60 hover:bg-neon-purple hover:border-neon-purple text-text-sub hover:text-white text-xs font-bold text-center transition-colors cursor-pointer"
                  onClick={() => {
                    setModalGanadorOpen(false);
                    finalizarPartidaSinPuntaje(nombre);
                  }}
                >
                  {nombre}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="btn-touch w-full py-2.5 bg-slate-950 border border-slate-850 text-text-sub font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
              onClick={() => setModalGanadorOpen(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
