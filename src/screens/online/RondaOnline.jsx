import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { useAudio } from '../../hooks/useAudio';
import { Clock, Users, CheckCircle2 } from 'lucide-react';

export default function RondaOnline() {
  const { navegarA, muteSonidos, muteVoz } = useGame();
  const { sala, jugadorId, mandarPalabras, arrancarRevelacion, todosEnviaronPalabras, soyHost, listaJugadores } =
    useOnlineGame();

  const { playTick, playBuzzer, speakCategory, playCountdownBeep } = useAudio();

  const [palabras, setPalabras] = useState(Array(8).fill(''));
  const [enviado, setEnviado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(sala?.config?.tiempo ?? 75);
  const intervalRef = useRef(null);
  const yaEnvieAlCerrar = useRef(false);
  const enviadoRef = useRef(enviado);

  const [faseRonda, setFaseRonda] = useState('intro'); // 'intro' o 'juego'
  const [segundosIntro, setSegundosIntro] = useState(3);

  // Sincronizar la referencia del estado enviado
  useEffect(() => {
    enviadoRef.current = enviado;
  }, [enviado]);

  // --- Cuenta regresiva inicial de 3 segundos al comenzar la ronda ---
  useEffect(() => {
    if (faseRonda !== 'intro') return;

    // Beep inicial para arrancar la cuenta regresiva
    playCountdownBeep(440);

    const timer = setInterval(() => {
      setSegundosIntro((s) => {
        const next = s - 1;
        if (next > 0) {
          playCountdownBeep(440); // Beep medio
        } else if (next === 0) {
          playCountdownBeep(880); // Beep agudo (arranca el juego!)
          clearInterval(timer);
          setFaseRonda('juego');
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [faseRonda, playCountdownBeep]);

  // --- Leer la palabra en voz alta al empezar la ronda ---
  const vozHabladaRef = useRef(false);
  useEffect(() => {
    if (faseRonda !== 'juego') return; // Esperar a que la intro termine!

    if (sala?.palabraActual && !vozHabladaRef.current) {
      if (!muteVoz) {
        const speakTimer = setTimeout(() => {
          speakCategory(sala.palabraActual);
        }, 150);
        vozHabladaRef.current = true;
        return () => clearTimeout(speakTimer);
      }
    }
  }, [sala?.rondaActual, sala?.palabraActual, muteVoz, speakCategory, faseRonda]);

  // Reinicia el formulario cada vez que arranca una ronda nueva
  useEffect(() => {
    setPalabras(Array(8).fill(''));
    setEnviado(false);
    yaEnvieAlCerrar.current = false;
    vozHabladaRef.current = false;
    setTiempoRestante(sala?.config?.tiempo ?? 75);
    setFaseRonda('intro'); // Volver a activar intro para la nueva ronda
    setSegundosIntro(3);
  }, [sala?.rondaActual]);

  useEffect(() => {
    if (faseRonda !== 'juego') return; // Esperar a que la intro termine!

    intervalRef.current = setInterval(() => {
      setTiempoRestante((t) => {
        const next = t > 0 ? t - 1 : 0;

        // Sonidos de Tictac en los últimos 10 segundos
        if (next <= 10 && next > 0 && !muteSonidos) {
          playTick();
        }

        // Fin del tiempo: sonar campana dulce si ya entregó, o buzzer ruidoso si no
        if (next === 0 && t === 1 && !muteSonidos) {
          if (enviadoRef.current) {
            playCountdownBeep(587.33); // Nota Re5 (agradable y amena)
          } else {
            playBuzzer(); // Chicharra ruidosa de alerta
          }
        }

        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [sala?.rondaActual, muteSonidos, playTick, playBuzzer, playCountdownBeep, faseRonda]);

  // Cuando la sala pasa a "revelando" (alguien más cerró la ronda), navegamos todos juntos
  useEffect(() => {
    if (sala?.estado === 'revelando') {
      navegarA('online-revelacion');
    }
  }, [sala?.estado, navegarA]);

  // Al agotarse el tiempo, se auto-envía lo que cada uno haya escrito hasta ahí
  useEffect(() => {
    if (tiempoRestante === 0 && !yaEnvieAlCerrar.current) {
      yaEnvieAlCerrar.current = true;
      const limpias = palabras.map((p) => p.trim()).filter(Boolean);
      mandarPalabras(limpias);
      setEnviado(true);
    }
  }, [tiempoRestante, palabras, mandarPalabras]);

  if (!sala) return null;

  const actualizarPalabra = (idx, valor) => {
    const copia = [...palabras];
    copia[idx] = valor;
    setPalabras(copia);
  };

  const enviarManual = () => {
    const limpias = palabras.map((p) => p.trim()).filter(Boolean);
    mandarPalabras(limpias);
    setEnviado(true);
  };

  const jugadoresActivos = listaJugadores.filter((j) => j.conectado);
  const cantidadEnviaron = jugadoresActivos.filter(
    (j) => (sala.palabrasEnviadas?.[j.id]?.length ?? 0) > 0
  ).length;

  // Helper local para normalizar y detectar duplicados en tiempo real
  const normalizarLocal = (str) => {
    if (!str) return '';
    return str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const palabrasNormalizadas = palabras.map(p => normalizarLocal(p));
  const esDuplicada = (idx, texto) => {
    if (!texto || !texto.trim()) return false;
    const norm = normalizarLocal(texto);
    const apariciones = palabrasNormalizadas.filter(p => p === norm).length;
    return apariciones > 1;
  };

  if (faseRonda === 'intro') {
    return (
      <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full justify-center items-center text-center bg-space-dark relative min-h-screen">
        <p className="text-neon-purple text-xs font-black uppercase tracking-widest mb-2 animate-pulse">
          Ronda {sala.rondaActual}
          {sala.config.rondas !== 'infinito' ? ` de ${sala.config.rondas}` : ''}
        </p>
        <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest mb-8">
          Categoría: <span className="text-white font-black">{sala.categoriaActual?.nombre}</span>
        </p>

        <div className="relative w-48 h-48 flex items-center justify-center">
          {/* Círculo animado de fondo */}
          <div className="absolute inset-0 rounded-full border border-neon-purple/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-neon-purple/40" />
          
          <span 
            className="text-7xl font-black font-display text-neon-purple animate-scale-up"
            key={segundosIntro}
          >
            {segundosIntro}
          </span>
        </div>

        <p className="text-text-sub text-xs mt-10 font-bold uppercase tracking-widest animate-pulse">
          ¡Preparate para escribir!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub">
          Ronda {sala.rondaActual}
          {sala.config.rondas !== 'infinito' ? ` / ${sala.config.rondas}` : ''}
        </span>
        <span
          className={`flex items-center gap-1.5 text-sm font-black ${
            tiempoRestante <= 10 ? 'text-neon-red animate-pulse animate-scale-up' : 'text-neon-green'
          }`}
          key={tiempoRestante}
        >
          <Clock className="w-4 h-4" /> {tiempoRestante}s
        </span>
      </div>

      <div className="text-center mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neon-purple mb-1">
          {sala.categoriaActual?.nombre}
        </p>
        <p className="text-3xl font-black font-display">{sala.palabraActual}</p>
      </div>

      {!enviado ? (
        <>
          <p className="text-text-sub text-[11px] font-semibold mb-3 text-center">
            Escribí 8 palabras que creas que otros también van a poner
          </p>
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {palabras.map((p, idx) => {
              const duplicada = esDuplicada(idx, p);
              return (
                <input
                  key={idx}
                  type="text"
                  value={p}
                  onChange={(e) => actualizarPalabra(idx, e.target.value.replace(/\s/g, ''))}
                  placeholder={`${idx + 1}`}
                  maxLength={30}
                  className={`bg-slate-900/60 border rounded-lg px-3 py-2.5 text-sm font-bold outline-none transition-colors ${
                    duplicada
                      ? 'border-neon-red text-neon-red focus:border-neon-red shadow-[0_0_8px_rgba(255,90,121,0.15)] font-black'
                      : 'border-slate-805/85 focus:border-neon-purple text-white'
                  }`}
                />
              );
            })}
          </div>
          <button
            type="button"
            className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase cursor-pointer"
            onClick={enviarManual}
          >
            Confirmar Palabras
          </button>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <CheckCircle2 className="w-10 h-10 text-neon-green" />
          <p className="text-sm font-bold uppercase tracking-widest">¡Enviadas!</p>
          <p className="text-text-sub text-xs font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {cantidadEnviaron} / {jugadoresActivos.length} jugadores enviaron
          </p>
        </div>
      )}

      {soyHost && (
        <button
          type="button"
          disabled={!todosEnviaronPalabras && tiempoRestante > 0}
          className="btn-touch w-full mt-6 py-3.5 px-6 bg-slate-900/60 hover:bg-slate-900/90 disabled:opacity-30 disabled:pointer-events-none text-text-sub hover:text-white font-bold rounded-xl border border-slate-805/85 tracking-widest text-[11px] uppercase cursor-pointer"
          onClick={arrancarRevelacion}
        >
          Revelar Resultados de la Ronda
        </button>
      )}
    </div>
  );
}
