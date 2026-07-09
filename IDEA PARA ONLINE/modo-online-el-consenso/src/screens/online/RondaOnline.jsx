import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { Clock, Users, CheckCircle2 } from 'lucide-react';

export default function RondaOnline() {
  const { navegarA } = useGame();
  const { sala, jugadorId, mandarPalabras, arrancarRevelacion, todosEnviaronPalabras, soyHost, listaJugadores } =
    useOnlineGame();

  const [palabras, setPalabras] = useState(Array(8).fill(''));
  const [enviado, setEnviado] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(sala?.config?.tiempo ?? 75);
  const intervalRef = useRef(null);
  const yaEnvieAlCerrar = useRef(false);

  // Reinicia el formulario cada vez que arranca una ronda nueva
  useEffect(() => {
    setPalabras(Array(8).fill(''));
    setEnviado(false);
    yaEnvieAlCerrar.current = false;
    setTiempoRestante(sala?.config?.tiempo ?? 75);
  }, [sala?.rondaActual]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTiempoRestante((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [sala?.rondaActual]);

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
  }, [tiempoRestante]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const cantidadEnviaron = listaJugadores.filter(
    (j) => (sala.palabrasEnviadas?.[j.id]?.length ?? 0) > 0
  ).length;

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub">
          Ronda {sala.rondaActual}
          {sala.config.rondas !== 'infinito' ? ` / ${sala.config.rondas}` : ''}
        </span>
        <span
          className={`flex items-center gap-1.5 text-sm font-black ${
            tiempoRestante <= 10 ? 'text-neon-red animate-pulse' : 'text-neon-green'
          }`}
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
            {palabras.map((p, idx) => (
              <input
                key={idx}
                type="text"
                value={p}
                onChange={(e) => actualizarPalabra(idx, e.target.value)}
                placeholder={`${idx + 1}`}
                maxLength={30}
                className="bg-slate-900/60 border border-slate-805/85 rounded-lg px-3 py-2.5 text-sm font-bold outline-none focus:border-neon-purple"
              />
            ))}
          </div>
          <button
            type="button"
            className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase"
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
            <Users className="w-3.5 h-3.5" /> {cantidadEnviaron} / {listaJugadores.length} jugadores enviaron
          </p>
        </div>
      )}

      {soyHost && (
        <button
          type="button"
          disabled={!todosEnviaronPalabras && tiempoRestante > 0}
          className="btn-touch w-full mt-6 py-3.5 px-6 bg-slate-900/60 hover:bg-slate-900/90 disabled:opacity-30 disabled:pointer-events-none text-text-sub hover:text-white font-bold rounded-xl border border-slate-805/85 tracking-widest text-[11px] uppercase"
          onClick={arrancarRevelacion}
        >
          Revelar Resultados de la Ronda
        </button>
      )}
    </div>
  );
}
