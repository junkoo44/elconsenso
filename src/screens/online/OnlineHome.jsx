import React from 'react';
import { useGame } from '../../context/GameContext';
import { PlusCircle, LogIn, ArrowLeft, Globe } from 'lucide-react';

export default function OnlineHome() {
  const { navegarA } = useGame();

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full">
      <button
        type="button"
        className="btn-touch self-start mb-6 flex items-center gap-1.5 text-text-sub hover:text-white text-xs font-bold uppercase tracking-widest"
        onClick={() => navegarA('home')}
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="text-center mb-10">
        <div className="mx-auto mb-4 w-14 h-14 bg-neon-purple/10 border border-neon-purple/30 rounded-2xl flex items-center justify-center">
          <Globe className="w-7 h-7 text-neon-purple" />
        </div>
        <h1 className="text-2xl font-black tracking-widest uppercase font-display">Modo Online</h1>
        <p className="text-text-sub text-xs font-semibold mt-2 leading-relaxed">
          Cada jugador con su celu. Nada de hoja de papel: las palabras y los puntos se cargan solos.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          className="btn-touch w-full py-5 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl shadow-xl shadow-neon-purple/20 border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2.5"
          onClick={() => navegarA('online-crear')}
        >
          <PlusCircle className="w-5 h-5" /> Crear una Sala
        </button>

        <button
          type="button"
          className="btn-touch w-full py-5 px-6 bg-slate-900/60 hover:bg-slate-900/90 text-white font-extrabold rounded-2xl border border-slate-805/85 tracking-widest text-sm uppercase flex items-center justify-center gap-2.5"
          onClick={() => navegarA('online-unirse')}
        >
          <LogIn className="w-5 h-5" /> Unirme con un Código
        </button>
      </div>
    </div>
  );
}
