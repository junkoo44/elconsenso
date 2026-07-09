import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { useOnlineGame } from '../../context/OnlineGameContext';
import { useAudio } from '../../hooks/useAudio';
import { Sparkles, ArrowRight, Trophy } from 'lucide-react';

export default function RevelacionOnline() {
  const { navegarA, todasCategorias } = useGame();
  const { sala, soyHost, listaJugadores, siguienteTurnoRevelacion, cerrarRondaYAvanzar } = useOnlineGame();
  const { speakCategory } = useAudio();

  useEffect(() => {
    if (sala?.estado === 'jugando') navegarA('online-ronda');
    if (sala?.estado === 'finalizada') navegarA('online-podium');
  }, [sala?.estado, navegarA]);

  const revelarGradual = sala?.config?.revelarGradual;
  const orden = sala?.ordenRevelacion || [];
  const turno = sala?.turnoRevelacion || 0;
  const yaTerminoRevelacion = !revelarGradual || turno >= orden.length;

  const nombreDe = (id) => listaJugadores.find((j) => j.id === id)?.nombre || '???';
  const detalle = sala?.detalleCoincidencias || [];
  const palabrasCoincidentesDe = (jugadorId) =>
    detalle.filter((d) => d.jugadoresIds.includes(jugadorId));

  const jugadorIdActual = orden[turno];
  const nombreActual = nombreDe(jugadorIdActual);

  // El anfitrión lee en voz alta el nombre del jugador que se está revelando
  useEffect(() => {
    if (revelarGradual && !yaTerminoRevelacion && soyHost && nombreActual && nombreActual !== '???') {
      speakCategory(`Revelando a ${nombreActual}`);
    }
  }, [turno, revelarGradual, yaTerminoRevelacion, soyHost, nombreActual, speakCategory]);

  if (!sala) return null;

  const avanzar = () => {
    if (turno < orden.length) {
      siguienteTurnoRevelacion();
    }
  };

  const continuarASiguienteRonda = () => {
    cerrarRondaYAvanzar(todasCategorias);
  };

  // --- Vista "de a uno" (velo activado), mientras quedan jugadores por revelar ---
  if (revelarGradual && !yaTerminoRevelacion) {
    const puntosJugador = sala.puntosRondaActual?.[jugadorIdActual] || 0;
    const coincidencias = palabrasCoincidentesDe(jugadorIdActual);
    const palabras = sala.palabrasEnviadas?.[jugadorIdActual] || [];

    return (
      <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub text-center mb-1">
          Revelando · {turno + 1} / {orden.length}
        </p>
        <h1 className="text-2xl font-black uppercase text-center font-display mb-6">{nombreActual}</h1>

        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {palabras.map((palabra, idx) => {
            const coincide = coincidencias.some(
              (c) => c.palabra.toLowerCase() === palabra.toLowerCase()
            );
            return (
              <div
                key={idx}
                className={`px-3 py-2.5 rounded-lg text-sm font-bold text-center border transition-colors ${
                  coincide
                    ? 'bg-neon-green/15 border-neon-green text-neon-green'
                    : 'bg-slate-900/50 border-slate-805/85 text-text-sub'
                }`}
              >
                {palabra}
              </div>
            );
          })}
        </div>

        <div className="text-center mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-text-sub">Puntos de la ronda</p>
          <p className="text-3xl font-black text-neon-green font-display">+{puntosJugador}</p>
        </div>

        {soyHost ? (
          <button
            type="button"
            className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2 cursor-pointer"
            onClick={avanzar}
          >
            <Sparkles className="w-4 h-4" /> Siguiente Jugador <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
            Esperando al anfitrión...
          </p>
        )}
      </div>
    );
  }

  // --- Tabla completa de la ronda (velo desactivado, o ya se reveló a todos) ---
  const posiciones = Object.entries(sala.puntosRondaActual || {})
    .map(([id, puntos]) => ({ id, puntos, total: (sala.puntajes?.[id] || 0) + puntos }))
    .sort((a, b) => b.total - a.total);

  const esUltimaRonda =
    sala.config.rondas !== 'infinito' && sala.rondaActual >= sala.config.rondas;

  return (
    <div className="flex flex-col flex-1 p-6 max-w-md mx-auto w-full">
      <h1 className="text-xl font-black uppercase text-center font-display mb-6 flex items-center justify-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-500" /> Resultado de la Ronda {sala.rondaActual}
      </h1>

      <div className="flex flex-col gap-2.5 mb-8">
        {posiciones.map((p, idx) => (
          <div
            key={p.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-805/85"
          >
            <span className="font-bold text-sm">
              #{idx + 1} {nombreDe(p.id)}
            </span>
            <span className="text-sm font-black">
              {p.total} pts <span className="text-neon-green">(+{p.puntos})</span>
            </span>
          </div>
        ))}
      </div>

      {soyHost ? (
        <button
          type="button"
          className="btn-touch w-full py-4 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl border-b-4 border-violet-900 tracking-widest text-sm uppercase cursor-pointer"
          onClick={continuarASiguienteRonda}
        >
          {esUltimaRonda ? 'Ver Podio Final' : 'Siguiente Ronda'}
        </button>
      ) : (
        <p className="text-text-sub text-[10px] font-bold uppercase tracking-widest text-center animate-pulse">
          Esperando al anfitrión...
        </p>
      )}
    </div>
  );
}
