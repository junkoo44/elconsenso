import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { useAudio } from '../../hooks/useAudio';
import { Copy, Check, Users, LogOut, Eye, EyeOff, Minus, Plus, BellRing } from 'lucide-react';

export default function LobbySala() {
  const { navegarA, todasCategorias } = useGame();
  const { playBuzzer, playPlop } = useAudio();
  const {
    codigoSala,
    sala,
    soyHost,
    listaJugadores,
    actualizarConfig,
    iniciarPartida,
    salir,
    mandarReaccion,
  } = useOnlineGame();

  const [copiado, setCopiado] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState(false);
  const [reaccionesFlotantes, setReaccionesFlotantes] = useState([]);
  const ultimaReaccionProcesadaRef = useRef({});
  const [apurando, setApurando] = useState(false);

  useEffect(() => {
    if (!sala?.jugadores) return;

    const ahora = Date.now();
    const nuevasReacciones = [];

    Object.entries(sala.jugadores).forEach(([id, datos]) => {
      if (datos.reaccion && datos.reaccionTime) {
        const ultimoProcesado = ultimaReaccionProcesadaRef.current[id] || 0;
        const diferenciaTiempo = datos.reaccionTime - ultimoProcesado;

        if (datos.reaccionTime > ultimoProcesado && diferenciaTiempo > 800) {
          ultimaReaccionProcesadaRef.current[id] = datos.reaccionTime;

          if (ahora - datos.reaccionTime < 4000) {
            nuevasReacciones.push({
              id: `${id}_${datos.reaccionTime}`,
              emoji: datos.reaccion,
              nombre: datos.nombre,
              x: Math.floor(Math.random() * 60) + 20,
            });
            if (soyHost && datos.reaccion === '⏰') {
              playBuzzer();
            } else {
              playPlop();
            }
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
  }, [sala?.jugadores, soyHost, playBuzzer, playPlop]);

  const copiarCodigo = async (e) => {
    if (e) e.preventDefault();
    try {
      await navigator.clipboard.writeText(codigoSala);
      setCodigoCopiado(true);
      setTimeout(() => setCodigoCopiado(false), 1500);
    } catch {
      // Fallback
    }
  };

  if (!sala) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-sub text-sm font-bold">
        Entrando en la sala...
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

  const apurarHost = () => {
    setApurando(true);
    mandarReaccion('⏰');
    setTimeout(() => setApurando(false), 1200);
  };

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full overflow-y-auto relative">
      {/* Reacciones Flotantes */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {reaccionesFlotantes.map((reac) => (
          <div
            key={reac.id}
            className="absolute bottom-24 pointer-events-none flex flex-col items-center animate-float-up text-center"
            style={{
              left: `${reac.x}%`,
              animationDuration: '2.2s'
            }}
          >
            <span className="text-4xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-bounce">
              {reac.emoji}
            </span>
            <span className="text-[8px] font-black text-white/90 uppercase tracking-widest bg-slate-950/90 px-2 py-0.5 rounded-full border border-white/10 whitespace-nowrap mt-1 shadow-lg">
              {reac.emoji === '⏰' ? `¡${reac.nombre} ESTÁ APURANDO!` : reac.nombre}
            </span>
          </div>
        ))}
      </div>

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
        <div
          onClick={copiarCodigo}
          onContextMenu={copiarCodigo}
          className="cursor-pointer group relative inline-block my-1 px-4 py-1 rounded-xl hover:bg-slate-800/50 transition-colors select-none"
          title="Tocá, mantené presionado o da click derecho para copiar"
        >
          <p className="text-4xl font-black tracking-[0.3em] text-neon-purple font-display active:scale-95 transition-transform select-none">
            {codigoSala}
          </p>
          {codigoCopiado && (
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neon-green text-black font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-lg animate-bounce whitespace-nowrap">
              ¡Código Copiado!
            </span>
          )}
        </div>
        <p className="text-[10px] text-text-sub/70 font-semibold mb-4">
          (Tocá, mantené presionado o click derecho para copiar el código)
        </p>

        <button
          type="button"
          className="btn-touch w-full py-3 bg-slate-800/80 hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
          onClick={copiarLink}
        >
          {copiado ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
          {copiado ? 'Link Copiado' : 'Copiar Link para Invitar'}
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
              className={`px-4 py-3 rounded-xl border flex items-center justify-between text-sm font-bold ${j.conectado ? 'border-slate-805/85 bg-slate-900/50' : 'border-slate-850 bg-slate-950/30 opacity-40'
                }`}
            >
              <span>{j.nombre}</span>
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-text-sub">
                {(j.esHost || j.id === sala.host) && <span className="text-neon-purple font-black">Host</span>}
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
                Revelar progresivamente
              </span>
              <span
                className={`w-10 h-5.5 rounded-full p-0.5 transition-colors ${sala.config.revelarGradual ? 'bg-neon-green' : 'bg-slate-700'
                  }`}
              >
                <span
                  className={`block w-4.5 h-4.5 bg-white rounded-full transition-transform ${sala.config.revelarGradual ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                />
              </span>
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub mb-2">
                Velocidad de revelación
              </p>
              <div className="flex gap-2">
                {[
                  { label: 'Normal (1x)', val: 1 },
                  { label: 'Rápida (1.5x)', val: 1.5 },
                  { label: 'Relámpago (2x)', val: 2 }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    className={`btn-touch flex-1 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-colors ${(sala.config.velocidadRevelacion || 1) === opt.val
                        ? 'bg-neon-purple text-white border-neon-purple shadow-[0_0_10px_rgba(124,58,237,0.3)]'
                        : 'bg-slate-900/60 text-text-sub border-slate-805/85 hover:text-white hover:border-slate-700'
                      }`}
                    onClick={() => actualizarConfig({ velocidadRevelacion: opt.val })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

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
                      className={`btn-touch px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${activa
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
        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 gap-6 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center mx-auto animate-pulse">
            <BellRing className="w-8 h-8 text-neon-purple" />
          </div>
          <div>
            <h3 className="text-base font-black uppercase text-white tracking-wider mb-1 font-display">
              Esperando al anfitrión
            </h3>
            <p className="text-text-sub text-xs font-bold uppercase tracking-widest">
              El anfitrión está configurando la partida...
            </p>
          </div>

          <button
            type="button"
            disabled={apurando}
            onClick={apurarHost}
            className="btn-touch px-6 py-4 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 border-b-4 border-amber-700 tracking-widest text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-95"
          >
            <BellRing className={`w-4 h-4 ${apurando ? 'animate-spin' : 'animate-bounce'}`} />
            {apurando ? '¡Apurando al Host! ⏰' : '⏰ ¡Apurar al Anfitrión!'}
          </button>
        </div>
      )}
    </div>
  );
}
