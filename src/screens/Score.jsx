import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { 
  Plus, 
  Trash2, 
  Users, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowRight,
  Check,
  X,
  FileSpreadsheet,
  Mic
} from 'lucide-react';

export default function Score() {
  const {
    jugadores,
    config,
    rondaActual,
    categoriaActual,
    palabraActual,
    puntajes,
    registrarPuntajesRonda,
    avanzarSiguienteRonda,
    finalizarPartida,
    obtenerTendenciaJugador,
    navegarA,
    lectorRonda
  } = useGame();

  // Lista de coincidencias registradas en esta ronda
  const [coincidencias, setCoincidencias] = useState([]);
  
  // Estado para el modal de agregar coincidencia
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  // --- Manejo del Modal de Coincidencias ---
  const toggleSeleccionJugador = (nombre) => {
    setSeleccionados(prev => {
      if (prev.includes(nombre)) {
        return prev.filter(x => x !== nombre);
      } else {
        return [...prev, nombre];
      }
    });
  };

  const handleAgregarCoincidencia = () => {
    if (seleccionados.length < 2) return;
    
    const puntosParaCadaUno = seleccionados.length;
    const nuevaCoincidencia = {
      id: `coin-${Date.now()}`,
      jugadoresSeleccionados: [...seleccionados],
      puntos: puntosParaCadaUno
    };

    setCoincidencias(prev => [...prev, nuevaCoincidencia]);
    setSeleccionados([]);
    setModalOpen(false);
  };

  const handleEliminarCoincidencia = (id) => {
    setCoincidencias(prev => prev.filter(c => c.id !== id));
  };

  // --- Calcular Puntajes Proyectados ---
  const calcularPuntajesDeRonda = () => {
    const puntosRonda = {};
    jugadores.forEach(j => {
      puntosRonda[j] = 0;
    });

    coincidencias.forEach(c => {
      c.jugadoresSeleccionados.forEach(jug => {
        puntosRonda[jug] = (puntosRonda[jug] || 0) + c.puntos;
      });
    });

    return puntosRonda;
  };

  const puntosDeEstaRonda = calcularPuntajesDeRonda();

  const calcularAcumuladoProyectado = () => {
    const proyectado = {};
    jugadores.forEach(j => {
      proyectado[j] = (puntajes[j] || 0) + (puntosDeEstaRonda[j] || 0);
    });
    return proyectado;
  };

  const acumuladoProyectado = calcularAcumuladoProyectado();

  const tablaProyectadaOrdenada = Object.entries(acumuladoProyectado)
    .map(([nombre, puntos]) => ({ nombre, puntos }))
    .sort((a, b) => b.puntos - a.puntos);

  // --- Confirmar Ronda y Guardar ---
  const handleConfirmarRonda = () => {
    registrarPuntajesRonda(puntosDeEstaRonda);

    const limiteSuperado = config.rondas !== 'infinito' && rondaActual >= config.rondas;

    if (limiteSuperado) {
      finalizarPartida();
    } else {
      avanzarSiguienteRonda();
      navegarA('game');
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col gap-5 py-6 px-4">
      {/* 🧾 Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="w-12"></div>
        <h2 className="text-sm font-black tracking-widest uppercase text-white font-display">
          Conteo de Puntos
        </h2>
        <div className="text-xs font-black text-neon-purple uppercase">
          Ronda {rondaActual}
        </div>
      </div>

      {/* 🎯 Info Categoría y Palabra */}
      <div className="bg-slate-900/30 border border-slate-805/80 rounded-2xl p-4 text-center">
        <span className="text-[10px] font-black tracking-widest text-text-sub uppercase">
          Categoría: {categoriaActual?.nombre}
        </span>
        <h3 className="text-2xl font-black text-neon-green uppercase tracking-wide mt-1 font-display">
          {palabraActual}
        </h3>
      </div>

      {/* 🗣️ Lector de Ronda */}
      <div className="bg-neon-purple/10 border border-neon-purple/35 rounded-2xl py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold text-white shadow-md shadow-neon-purple/5">
        <Mic className="w-4 h-4 text-neon-purple animate-pulse shrink-0" />
        <span>Comienza leyendo: <span className="text-neon-purple font-black">{lectorRonda}</span></span>
      </div>

      {/* 🤝 Coincidencias de la Ronda */}
      <section className="flex-1 flex flex-col min-h-[160px]">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-xs font-black tracking-widest uppercase text-white flex items-center gap-1.5">
            <Users className="w-4 h-4 text-neon-green" /> Coincidencias ({coincidencias.length})
          </h4>
          <button
            type="button"
            className="btn-touch px-3 py-1.5 bg-neon-purple hover:bg-violet-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg border-b-2 border-violet-900 flex items-center gap-1 cursor-pointer"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>

        {coincidencias.length === 0 ? (
          <div className="flex-1 border-2 border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-950/20">
            <Users className="w-8 h-8 text-slate-800 mb-2" />
            <p className="text-text-sub text-[11px] font-bold max-w-[200px] leading-relaxed">
              Presioná "Agregar" cada vez que dos o más jugadores coincidan en una palabra.
            </p>
          </div>
        ) : (
          <div className="flex-1 max-h-[180px] overflow-y-auto pr-1 flex flex-col gap-2">
            {coincidencias.map((c) => (
              <div
                key={c.id}
                className="bg-slate-900/60 border border-slate-850 rounded-xl p-3 flex justify-between items-center text-xs animate-scale-up"
              >
                <div className="flex flex-col gap-1 pr-4">
                  <div className="flex flex-wrap gap-1">
                    {c.jugadoresSeleccionados.map(jug => (
                      <span key={jug} className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 font-bold text-[10px] flex items-center gap-0.5">
                        <User className="w-2.5 h-2.5 text-text-sub" /> {jug}
                      </span>
                    ))}
                  </div>
                  <span className="text-[10px] text-text-sub font-bold tracking-wide uppercase">
                    Coincidencia de {c.jugadoresSeleccionados.length} jugadores
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-neon-green tracking-wider text-xs whitespace-nowrap">
                    +{c.puntos} pts
                  </span>
                  <button
                    type="button"
                    className="text-neon-red hover:text-red-500 font-black text-base w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-950 btn-touch cursor-pointer"
                    onClick={() => handleEliminarCoincidencia(c.id)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 📊 Marcador General Acumulado Proyectado */}
      <section className="bg-slate-900/40 border border-slate-805/85 rounded-2xl p-4 flex flex-col gap-3">
        <h4 className="text-xs font-black tracking-widest uppercase text-neon-purple flex items-center gap-1.5 border-b border-slate-850 pb-2">
          <FileSpreadsheet className="w-4 h-4 text-neon-purple" /> Posiciones Proyectadas
        </h4>

        <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
          {tablaProyectadaOrdenada.map((jug, idx) => {
            const deltaRonda = puntosDeEstaRonda[jug.nombre] || 0;
            const tendencia = obtenerTendenciaJugador(jug.nombre);
            
            return (
              <div
                key={jug.nombre}
                className="flex items-center justify-between bg-slate-950/60 border border-slate-850 rounded-xl px-3 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black w-4 text-text-sub">
                    {idx + 1}°
                  </span>
                  <span className="font-extrabold">{jug.nombre}</span>
                  
                  {/* Iconos de tendencia de posición */}
                  {rondaActual > 1 && (
                    <span className="inline-flex items-center" title="Tendencia de posición">
                      {tendencia === 'subio' && <TrendingUp className="w-3.5 h-3.5 text-neon-green" />}
                      {tendencia === 'bajo' && <TrendingDown className="w-3.5 h-3.5 text-neon-red" />}
                      {tendencia === 'mantuvo' && <Minus className="w-3.5 h-3.5 text-yellow-500" />}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {deltaRonda > 0 && (
                    <span className="text-[10px] text-neon-green font-bold">
                      +{deltaRonda}
                    </span>
                  )}
                  <span className="font-black text-white">
                    {jug.puntos} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 🚀 Botón de Confirmación de Ronda */}
      <div className="mt-1">
        <button
          type="button"
          className="btn-touch w-full py-4.5 bg-neon-green hover:bg-emerald-500 text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-neon-green/10 tracking-widest text-sm uppercase cursor-pointer flex items-center justify-center gap-2"
          onClick={handleConfirmarRonda}
        >
          {config.rondas !== 'infinito' && rondaActual >= config.rondas 
            ? <>Finalizar Partida <Check className="w-4 h-4 text-slate-950" /></>
            : <>Confirmar y Avanzar <ArrowRight className="w-4 h-4 text-slate-950" /></>}
        </button>
      </div>

      {/* ➕ Modal: Agregar Coincidencia */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-space-dark border-2 border-neon-purple rounded-2xl max-w-xs w-full p-6 shadow-2xl relative animate-scale-up">
            
            <button
              type="button"
              className="absolute top-3 right-3 text-text-sub hover:text-white p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
              onClick={() => {
                setSeleccionados([]);
                setModalOpen(false);
              }}
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black tracking-widest uppercase text-white mb-1 font-display pr-6">
              Nueva Coincidencia
            </h3>
            <p className="text-[9px] text-text-sub font-bold uppercase tracking-wider mb-4">
              Marcá quiénes escribieron la misma palabra.
            </p>

            {/* Checkbox de jugadores */}
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 mb-6">
              {jugadores.map((nombre) => {
                const checked = seleccionados.includes(nombre);
                return (
                  <button
                    key={nombre}
                    type="button"
                    className={`btn-touch w-full p-3 rounded-xl border text-xs font-bold text-left flex justify-between items-center transition-colors cursor-pointer ${
                      checked
                        ? 'bg-neon-purple border-neon-purple text-white'
                        : 'bg-slate-900/60 border-slate-800 text-text-sub hover:border-slate-700'
                    }`}
                    onClick={() => toggleSeleccionJugador(nombre)}
                  >
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-text-sub" /> {nombre}</span>
                    {checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Visualización de puntos calculados */}
            <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-center mb-6">
              <span className="text-[9px] text-text-sub font-bold uppercase tracking-wider block mb-1">
                Puntos a sumar a cada uno
              </span>
              <span className="text-2xl font-black text-neon-green tracking-wider">
                {seleccionados.length >= 2 ? `+${seleccionados.length} pts` : '0 pts'}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="btn-touch flex-1 py-3 bg-slate-900 border border-slate-850 text-text-sub font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                onClick={() => {
                  setSeleccionados([]);
                  setModalOpen(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={seleccionados.length < 2}
                className={`btn-touch flex-1 py-3 font-extrabold text-xs uppercase tracking-wider rounded-xl border-b-4 flex items-center justify-center gap-1 ${
                  seleccionados.length < 2
                    ? 'bg-slate-800 border-slate-850 text-slate-500 cursor-not-allowed opacity-50'
                    : 'bg-neon-purple hover:bg-violet-750 text-white border-violet-900 cursor-pointer'
                }`}
                onClick={handleAgregarCoincidencia}
              >
                Sumar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
