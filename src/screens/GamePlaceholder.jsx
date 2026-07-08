import React from 'react';
import { useGame } from '../context/GameContext';

export default function GamePlaceholder() {
  const { 
    jugadores, 
    config, 
    rondaActual, 
    categoriaActual, 
    categoriasJugadas,
    finalizarPartida, 
    navegarA 
  } = useGame();

  const handleSimularFin = () => {
    // Simular que finaliza la partida y va al podio/historial
    finalizarPartida();
    alert("Partida finalizada. Se ha guardado en el historial de localStorage.");
    navegarA('home');
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <button 
          type="button" 
          className="text-xs font-bold text-neon-red hover:text-red-500 flex items-center gap-1 btn-touch"
          onClick={() => {
            if (window.confirm("¿Seguro que querés abandonar la partida actual?")) {
              navegarA('setup');
            }
          }}
        >
          🏳️ Abandonar
        </button>
        <h2 className="text-sm font-black tracking-widest uppercase text-white">
          Ronda {rondaActual} {config.rondas !== 'infinito' ? `de ${config.rondas}` : '(Infinito)'}
        </h2>
        <div className="w-16"></div> {/* Espaciador */}
      </div>

      {/* Main gameplay visualization placeholder */}
      <main className="flex-1 flex flex-col justify-center items-center gap-6 my-12 text-center">
        {/* Categoría gigante */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black tracking-widest text-neon-green uppercase">
            Categoría de la Ronda
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-wide border-y border-slate-800 py-6 my-2">
            {categoriaActual ? categoriaActual.nombre : "Sin Categoría"}
          </h1>
          <p className="text-text-sub text-xs max-w-[280px] mx-auto font-medium">
            (Web Speech API leerá esta categoría en voz alta en la Etapa 3)
          </p>
        </div>

        {/* Timer visual mockup */}
        <div className="relative w-36 h-36 flex items-center justify-center border-4 border-dashed border-neon-purple rounded-full animate-spin-slow">
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-full animate-none">
            <span className="text-3xl font-black text-neon-purple font-mono">
              {config.tiempo}s
            </span>
          </div>
        </div>

        {/* Lista de Jugadores en juego */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 w-full text-left">
          <h3 className="text-xs font-black tracking-widest uppercase text-text-sub mb-2">
            Jugadores en mesa:
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {jugadores.map((j) => (
              <span key={j} className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold">
                👤 {j}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* Footer controls */}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="btn-touch w-full py-4 px-6 bg-neon-green hover:bg-emerald-500 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-neon-green/10 tracking-wider text-sm uppercase"
          onClick={handleSimularFin}
        >
          🏁 Simular Fin de Partida (Podio/Historial)
        </button>
      </div>
    </div>
  );
}
