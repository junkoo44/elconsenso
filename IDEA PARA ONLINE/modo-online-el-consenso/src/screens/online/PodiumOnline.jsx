import React from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { Crown, Home } from 'lucide-react';

export default function PodiumOnline() {
  const { navegarA } = useGame();
  const { sala, listaJugadores, salir } = useOnlineGame();

  if (!sala) return null;

  const nombreDe = (id) => listaJugadores.find((j) => j.id === id)?.nombre || '???';

  const tablaFinal = Object.entries(sala.puntajes || {})
    .map(([id, puntos]) => ({ id, nombre: nombreDe(id), puntos }))
    .sort((a, b) => b.puntos - a.puntos);

  const ganador = tablaFinal[0];

  const volverAlInicio = async () => {
    await salir();
    navegarA('home');
  };

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full items-center justify-center text-center">
      <Crown className="w-14 h-14 text-yellow-500 mb-4" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-1">Ganador</p>
      <h1 className="text-3xl font-black uppercase font-display mb-8 text-neon-green">
        {ganador?.nombre || 'Sin ganador'}
      </h1>

      <div className="w-full flex flex-col gap-2.5 mb-10">
        {tablaFinal.map((j, idx) => (
          <div
            key={j.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-805/85"
          >
            <span className="font-bold text-sm">
              #{idx + 1} {j.nombre}
            </span>
            <span className="text-sm font-black">{j.puntos} pts</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2"
        onClick={volverAlInicio}
      >
        <Home className="w-4 h-4" /> Menú Principal
      </button>
    </div>
  );
}
