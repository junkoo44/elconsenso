import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CrearSala() {
  const { navegarA, todasCategorias } = useGame();
  const { crear, cargando, error } = useOnlineGame();
  const [nombre, setNombre] = useState('');

  const handleCrear = async () => {
    if (!nombre.trim()) return;
    try {
      const todosLosIds = todasCategorias.map(c => c.id);
      await crear(nombre.trim(), {
        rondas: 5,
        tiempo: 75,
        revelarGradual: true,
        categoriasActivas: todosLosIds, // por defecto todas las categorías marcadas
      });
      navegarA('online-lobby');
    } catch (e) {
      // el error ya queda expuesto en el contexto (useOnlineGame().error)
    }
  };

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full">
      <button
        type="button"
        className="btn-touch self-start mb-6 flex items-center gap-1.5 text-text-sub hover:text-white text-xs font-bold uppercase tracking-widest"
        onClick={() => navegarA('online-home')}
      >
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <h1 className="text-xl font-black tracking-widest uppercase font-display mb-1">Crear Sala</h1>
      <p className="text-text-sub text-xs font-semibold mb-8">
        Vas a ser el anfitrión. Después te paso el link para que se sumen los demás.
      </p>

      <label className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">
        Tu nombre
      </label>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value.replace(/\s/g, ''))}
        placeholder="¿Cómo te llamás?"
        maxLength={20}
        className="w-full bg-slate-900/60 border border-slate-805/85 rounded-xl px-4 py-3.5 text-white font-bold mb-6 outline-none focus:border-neon-purple"
      />

      {error && (
        <p className="text-neon-red text-xs font-bold mb-4 text-center">{error}</p>
      )}

      <button
        type="button"
        disabled={!nombre.trim() || cargando}
        className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2"
        onClick={handleCrear}
      >
        {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Crear Sala
      </button>
    </div>
  );
}
