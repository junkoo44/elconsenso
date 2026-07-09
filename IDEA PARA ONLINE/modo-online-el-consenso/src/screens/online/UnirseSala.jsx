import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function UnirseSala({ codigoInicial = '' }) {
  const { navegarA } = useGame();
  const { unirse, cargando, error } = useOnlineGame();
  const [codigo, setCodigo] = useState(codigoInicial);
  const [nombre, setNombre] = useState('');

  useEffect(() => {
    if (codigoInicial) setCodigo(codigoInicial);
  }, [codigoInicial]);

  const handleUnirse = async () => {
    if (!codigo.trim() || !nombre.trim()) return;
    try {
      await unirse(codigo.trim(), nombre.trim());
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

      <h1 className="text-xl font-black tracking-widest uppercase font-display mb-1">Unirme a una Sala</h1>
      <p className="text-text-sub text-xs font-semibold mb-8">
        Pedile el código al anfitrión, o abrí el link que te mandó.
      </p>

      <label className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">
        Código de sala
      </label>
      <input
        type="text"
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.toUpperCase())}
        placeholder="ABCDE"
        maxLength={5}
        className="w-full bg-slate-900/60 border border-slate-805/85 rounded-xl px-4 py-3.5 text-white font-black text-center text-2xl tracking-[0.4em] mb-6 outline-none focus:border-neon-purple uppercase"
      />

      <label className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">
        Tu nombre
      </label>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="¿Cómo te llamás?"
        maxLength={20}
        className="w-full bg-slate-900/60 border border-slate-805/85 rounded-xl px-4 py-3.5 text-white font-bold mb-6 outline-none focus:border-neon-purple"
      />

      {error && (
        <p className="text-neon-red text-xs font-bold mb-4 text-center">{error}</p>
      )}

      <button
        type="button"
        disabled={!codigo.trim() || !nombre.trim() || cargando}
        className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2"
        onClick={handleUnirse}
      >
        {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Entrar a la Sala
      </button>
    </div>
  );
}
