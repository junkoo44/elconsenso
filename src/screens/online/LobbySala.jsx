import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { Copy, Check, Users, LogOut, Eye, EyeOff, Minus, Plus } from 'lucide-react';

export default function LobbySala() {
  const { navegarA, todasCategorias } = useGame();
  const {
    codigoSala,
    sala,
    soyHost,
    listaJugadores,
    actualizarConfig,
    iniciarPartida,
    salir,
  } = useOnlineGame();

  const [copiado, setCopiado] = useState(false);

  // Escuchar el cambio de estado de la sala para navegar de forma sincrónica y automática
  useEffect(() => {
    if (sala) {
      if (sala.estado === 'jugando') {
        navegarA('online-ronda');
      } else if (sala.estado === 'revelando') {
        navegarA('online-revelacion');
      } else if (sala.estado === 'finalizada') {
        navegarA('online-podium');
      }
    }
  }, [sala, navegarA]);

  if (!sala) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-sub text-sm font-bold">
        Conectando con la sala...
      </div>
    );
  }

  const link = `${window.location.origin}/sala/${codigoSala}`;

  const copiarLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // Fallback
    }
  };

  const toggleCategoria = (id) => {
    const activas = sala.config.categoriasActivas || [];
    const nuevas = activas.includes(id) ? activas.filter((c) => c !== id) : [...activas, id];
    actualizarConfig({ categoriasActivas: nuevas });
  };

  const jugadoresConectados = listaJugadores.filter((j) => j.conectado);
  const puedeIniciar = jugadoresConectados.length >= 2 && (sala.config.categoriasActivas || []).length > 0;

  const salirYVolver = async () => {
    await salir();
    navegarA('home');
  };

  const iniciar = async () => {
    await iniciarPartida(todasCategorias);
    navegarA('online-ronda');
  };

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full overflow-y-auto">
      <button
        type="button"
        className="btn-touch self-start mb-6 flex items-center gap-1.5 text-neon-red hover:text-red-400 text-xs font-bold uppercase tracking-widest"
        onClick={salirYVolver}
      >
        <LogOut className="w-4 h-4" /> Salir de la sala
      </button>

      {/* Código y link para compartir */}
      <div className="bg-slate-900/60 border border-neon-purple/40 rounded-2xl p-5 text-center mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">Código de sala</p>
        <p className="text-4xl font-black tracking-[0.3em] text-neon-purple mb-4 font-display">{codigoSala}</p>
        <button
          type="button"
          className="btn-touch w-full py-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          onClick={copiarLink}
        >
          {copiado ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
          {copiado ? 'Copiado' : 'Copiar Link para Invitar'}
        </button>
      </div>

      {/* Jugadores conectados */}
      <div className="mb-6">
        <h2 className="text-xs font-black tracking-widest uppercase text-neon-green mb-3 flex items-center gap-2">
          <Users className="w-4 h-4" /> Jugadores ({jugadoresConectados.length})
        </h2>
        <div className="flex flex-col gap-2">
          {listaJugadores.map((j) => (
            <div
              key={j.id}
              className={`px-4 py-3 rounded-xl border flex items-center justify-between text-sm font-bold ${
                j.conectado ? 'border-slate-805/85 bg-slate-900/50' : 'border-slate-850 bg-slate-950/30 opacity-40'
              }`}
            >
              <span>{j.nombre}</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-sub">
                {j.esHost && <span className="text-neon-purple">Host</span>}
                {!j.conectado && '(desconectado)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {soyHost ? (
        <>
          {/* Configuración del host */}
          <div className="mb-6 flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">Rondas</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn-touch w-10 h-10 rounded-full bg-slate-900/60 border border-slate-805/85 flex items-center justify-center"
                  onClick={() => actualizarConfig({ rondas: Math.max(1, (sala.config.rondas || 5) - 1) })}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-black w-8 text-center">{sala.config.rondas}</span>
                <button
                  type="button"
                  className="btn-touch w-10 h-10 rounded-full bg-slate-900/60 border border-slate-805/85 flex items-center justify-center"
                  onClick={() => actualizarConfig({ rondas: Math.min(15, (sala.config.rondas || 5) + 1) })}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">Tiempo por ronda (s)</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="btn-touch w-10 h-10 rounded-full bg-slate-900/60 border border-slate-805/85 flex items-center justify-center"
                  onClick={() => actualizarConfig({ tiempo: Math.max(30, (sala.config.tiempo || 75) - 5) })}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-lg font-black w-10 text-center">{sala.config.tiempo}</span>
                <button
                  type="button"
                  className="btn-touch w-10 h-10 rounded-full bg-slate-900/60 border border-slate-805/85 flex items-center justify-center"
                  onClick={() => actualizarConfig({ tiempo: Math.min(180, (sala.config.tiempo || 75) + 5) })}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn-touch flex items-center justify-between w-full px-4 py-3.5 bg-slate-900/60 border border-slate-805/85 rounded-xl"
              onClick={() => actualizarConfig({ revelarGradual: !sala.config.revelarGradual })}
            >
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                {sala.config.revelarGradual ? (
                  <Eye className="w-4 h-4 text-neon-green" />
                ) : (
                  <EyeOff className="w-4 h-4 text-text-sub" />
                )}
                Revelar con Velo (de a uno)
              </span>
              <span
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${
                  sala.config.revelarGradual ? 'bg-neon-green' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4.5 h-4.5 bg-white rounded-full transition-transform ${
                    sala.config.revelarGradual ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">
                Categorías ({(sala.config.categoriasActivas || []).length} activas)
              </p>
              <div className="flex flex-wrap gap-2">
                {todasCategorias.map((cat) => {
                  const activa = (sala.config.categoriasActivas || []).includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategoria(cat.id)}
                      className={`btn-touch px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                        activa
                          ? 'bg-neon-purple/20 border-neon-purple text-white'
                          : 'bg-slate-900/40 border-slate-805/85 text-text-sub'
                      }`}
                    >
                      {cat.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={!puedeIniciar}
            className="btn-touch w-full py-5 px-6 bg-neon-purple hover:bg-violet-750 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold rounded-2xl shadow-xl shadow-neon-purple/20 border-b-4 border-violet-900 tracking-widest text-sm uppercase cursor-pointer"
            onClick={iniciar}
          >
            Iniciar Partida
          </button>
          {!puedeIniciar && (
            <p className="text-text-sub text-[10px] font-semibold text-center mt-2">
              Necesitás mínimo 2 jugadores conectados y al menos 1 categoría activa.
            </p>
          )}
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
          <p className="text-text-sub text-xs font-bold uppercase tracking-widest animate-pulse">
            Esperando a que el anfitrión inicie la partida...
          </p>
        </div>
      )}
    </div>
  );
}
