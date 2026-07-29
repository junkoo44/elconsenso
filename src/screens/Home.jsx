import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { useOnlineGame } from '../context/OnlineGameContext';
import { getHistory } from '../services/categories';
import {
  Target,
  Gamepad2,
  Globe,
  History,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Crown,
  Calendar,
  Trophy,
  X,
  ArrowRight,
  Info,
  Palette,
  HelpCircle
} from 'lucide-react';
import SpeakingHeadIcon from '../components/SpeakingHeadIcon';

export default function Home() {
  const {
    navegarA,
    muteSonidos,
    muteVoz,
    toggleMuteSonidos,
    toggleMuteVoz,
    temaActual,
    setTemaActual
  } = useGame();

  const {
    propuestaReconexion,
    confirmarReconexion,
    descartarReconexion
  } = useOnlineGame();

  const [historial, setHistorial] = useState([]);
  const [modalAyudaOpen, setModalAyudaOpen] = useState(false);
  const [menuTemasOpen, setMenuTemasOpen] = useState(false);
  const [partidaSeleccionada, setPartidaSeleccionada] = useState(null);

  const listaTemas = [
    { id: 'neon', nombre: 'Cyber Neon', color: 'bg-[#9061F9]' },
    { id: 'crimson', nombre: 'Among Crimson', color: 'bg-[#FF2A5F]' },
    { id: 'ocean', nombre: 'Ocean Breeze', color: 'bg-[#00B4D8]' },
    { id: 'forest', nombre: 'Forest Gold', color: 'bg-[#00E676]' },
    { id: 'arcade', nombre: 'Retro Arcade', color: 'bg-[#F72585]' }
  ];

  // Cargar el historial al montar la pantalla
  useEffect(() => {
    setHistorial(getHistory());

    // Escuchar la orden global de cerrar modales (cuando el usuario presiona Atrás en Android)
    const handleCloseModals = () => {
      setModalAyudaOpen(false);
      setMenuTemasOpen(false);
      setPartidaSeleccionada(null);
    };

    window.addEventListener('close-modals', handleCloseModals);
    return () => window.removeEventListener('close-modals', handleCloseModals);
  }, []);

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between py-6 px-4 relative">

      {/* 🔇 Controles rápidos flotantes de Sonido y Paleta Global */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
        {/* Panel Selector de Temas Horizontal */}
        {menuTemasOpen && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-slate-950/90 border border-slate-850 shadow-2xl animate-scale-up">
            {listaTemas.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`w-5 h-5 rounded-full ${t.color} cursor-pointer transition-all hover:scale-110 active:scale-95 ${temaActual === t.id
                    ? 'ring-2 ring-white scale-105 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                    : 'opacity-65 hover:opacity-100'
                  }`}
                onClick={() => setTemaActual(t.id)}
                title={t.nombre}
              />
            ))}
          </div>
        )}

        <button
          type="button"
          className={`btn-touch w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center cursor-pointer transition-colors shadow-md ${menuTemasOpen ? 'border-neon-purple text-neon-purple shadow-neon-purple/10' : 'text-text-sub hover:text-white hover:border-slate-700'
            }`}
          onClick={() => setMenuTemasOpen(prev => !prev)}
          title="Seleccionar paleta de colores"
        >
          <Palette className="w-4 h-4 text-neon-purple animate-pulse" />
        </button>
        <button
          type="button"
          className="btn-touch w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-text-sub hover:text-white hover:border-slate-700 shadow-md cursor-pointer transition-colors"
          onClick={toggleMuteSonidos}
          title={muteSonidos ? "Activar efectos de sonido" : "Silenciar efectos de sonido"}
        >
          {muteSonidos ? <VolumeX className="w-4 h-4 text-neon-red" /> : <Volume2 className="w-4 h-4 text-neon-green" />}
        </button>
        <button
          type="button"
          className="btn-touch w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-text-sub hover:text-white hover:border-slate-700 shadow-md cursor-pointer transition-colors"
          onClick={toggleMuteVoz}
          title={muteVoz ? "Activar lector de voz" : "Silenciar lector de voz"}
        >
          <SpeakingHeadIcon className={`w-4 h-4 ${muteVoz ? 'text-neon-red' : 'text-neon-purple'}`} muted={muteVoz} />
        </button>
      </div>

      {/* 🚀 Encabezado y Logo */}
      <div className="flex-1 flex flex-col justify-center my-8 text-center">
        <div className="mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-950/40 to-slate-900 border border-neon-purple/30 shadow-[0_0_20px_rgba(124,58,237,0.2)] animate-pulse">
          <Target className="w-10 h-10 text-neon-purple drop-shadow-[0_0_8px_rgba(124,58,237,0.6)]" />
        </div>
        <h1 className="text-5xl font-black tracking-widest text-white uppercase select-none drop-shadow-[0_4px_15px_rgba(124,58,237,0.4)] font-display">
          EL CONSENSO
        </h1>
        <div className="mt-1.5 inline-flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-ping"></span>
          <span className="text-text-sub text-[11px] font-bold tracking-widest uppercase">
            Pensá igual que el resto y ganá
          </span>
        </div>
      </div>

      {/* 🎮 Botonera Principal */}
      <div className="flex flex-col gap-4 my-8">
        <button
          type="button"
          className="btn-touch w-full py-5 px-6 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl shadow-xl shadow-neon-purple/20 border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2.5"
          onClick={() => navegarA('online-home')}
        >
          <Globe className="w-5 h-5" /> Jugar Online
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="btn-touch py-3.5 px-4 bg-slate-900/60 hover:bg-slate-900/90 text-text-sub hover:text-white font-bold rounded-2xl border border-slate-805/85 tracking-widest text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            onClick={() => navegarA('setup')}
          >
            <Gamepad2 className="w-3.5 h-3.5" /> En la Mesa
          </button>

          <button
            type="button"
            className="btn-touch py-3.5 px-4 bg-slate-900/60 hover:bg-slate-900/90 text-text-sub hover:text-white font-bold rounded-2xl border border-slate-805/85 tracking-widest text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            onClick={() => setModalAyudaOpen(true)}
          >
            <HelpCircle className="w-3.5 h-3.5 text-neon-green animate-pulse" /> ¿Cómo Jugar?
          </button>
        </div>
      </div>

      {/* 📜 Sección de Historial */}
      <div className="flex-1 min-h-[200px] flex flex-col">
        <h2 className="text-xs font-black tracking-widest uppercase text-neon-green mb-3.5 flex items-center gap-2 border-b border-slate-900 pb-2">
          <History className="w-4 h-4" /> Historial de Partidas
        </h2>

        {historial.length === 0 ? (
          <div className="flex-1 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-950/20">
            <Gamepad2 className="w-8 h-8 text-slate-800 mb-2.5 animate-bounce" />
            <p className="text-text-sub text-[11px] font-bold max-w-[200px] leading-relaxed">
              No hay partidas registradas. ¡Invitá amigos y empezá a jugar!
            </p>
          </div>
        ) : (
          <div className="flex-1 max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2.5">
            {historial.map((partida, index) => (
              <div
                key={index}
                className="btn-touch bg-slate-900/50 hover:bg-slate-900/90 border border-slate-850/80 rounded-xl p-3 flex.5 justify-between items-center cursor-pointer transition-colors flex gap-4"
                onClick={() => setPartidaSeleccionada(partida)}
              >
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[10px] text-text-sub font-semibold tracking-wider">
                    <Calendar className="w-3 h-3 text-neon-purple" />
                    <span>{partida.fecha} • {partida.hora}</span>
                  </div>
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Ganador: <span className="text-neon-green">{partida.ganador}</span></span>
                  </div>
                </div>
                <div className="text-neon-purple text-[10px] font-black tracking-wider uppercase flex items-center gap-1 whitespace-nowrap">
                  Ver Podio <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* 🏆 Modal Detalles Historial / Podio */}
      {partidaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-space-dark border-2 border-neon-green rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up">
            {/* Botón cerrar flotante */}
            <button
              type="button"
              className="absolute top-3 right-3 text-text-sub hover:text-white p-1 hover:bg-slate-900 rounded-lg cursor-pointer"
              onClick={() => setPartidaSeleccionada(null)}
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black tracking-widest uppercase text-center text-neon-green border-b border-slate-900 pb-3 mb-4 flex items-center justify-center gap-1.5 font-display">
              <Trophy className="w-4 h-4 text-neon-green" /> Tabla de Posiciones
            </h3>
            <div className="text-center text-[10px] text-text-sub font-bold tracking-wider mb-5 flex items-center justify-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Partida del {partidaSeleccionada.fecha} a las {partidaSeleccionada.hora}</span>
            </div>

            {/* Ranking de jugadores */}
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 mb-6">
              {partidaSeleccionada.tablaFinal.map((jug, idx) => {
                const esGanador = idx === 0;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${esGanador
                        ? 'bg-neon-green/10 border-neon-green text-neon-green'
                        : 'bg-slate-900/60 border-slate-805/80 text-white'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black w-4">
                        {idx + 1}°
                      </span>
                      <span className="font-extrabold flex items-center gap-1">
                        {jug.nombre} {esGanador && <Crown className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />}
                      </span>
                    </div>
                    <span className="font-black tracking-wider text-xs">
                      {jug.puntos} pts
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-touch w-full py-3 bg-slate-900 hover:bg-slate-950 text-white border-2 border-slate-805/85 font-extrabold rounded-xl text-xs uppercase tracking-widest cursor-pointer"
              onClick={() => setPartidaSeleccionada(null)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 📘 Modal: ¿Cómo Jugar? */}
      {modalAyudaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-space-dark border-2 border-neon-purple rounded-3xl max-w-sm w-full p-5 shadow-2xl relative animate-scale-up my-auto">
            {/* Botón cerrar flotante */}
            <button
              type="button"
              className="absolute top-3 right-3 text-text-sub hover:text-white p-1 hover:bg-slate-900 rounded-lg cursor-pointer transition-colors"
              onClick={() => setModalAyudaOpen(false)}
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-black tracking-widest uppercase text-center text-white mb-2 flex items-center justify-center gap-1.5 font-display">
              <HelpCircle className="w-4 h-4 text-neon-green" /> ¿Cómo Jugar?
            </h3>

            <p className="text-text-sub text-[10.5px] leading-relaxed text-center font-bold italic mb-3 px-1">
              "Pone a prueba tu conexión con los demás escribiendo las palabras que todos piensen."
            </p>

            <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
              <div className="flex flex-col gap-1 text-[10.5px] leading-relaxed">
                <p>
                  <strong className="text-white">Preparación:</strong> En una hoja, cada jugador debe dibujar una grilla con columnas para las rondas de la partida (con 8 palabras por ronda y un casillero para el total abajo):
                </p>

                {/* 📝 Grilla de Hoja Digital Blanca */}
                <div className="bg-white border border-slate-200 rounded-2xl p-3 my-2 shadow-inner text-slate-800 font-sans shadow-slate-200/50">
                  <div className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1.5 text-center">Hoja de Juego</div>
                  <div className="grid grid-cols-3 gap-2 text-[8px] font-bold">
                    {[1, 2, 3].map((ronda) => (
                      <div key={ronda} className="border border-slate-200 rounded-xl p-1.5 flex flex-col gap-1 bg-slate-50/50">
                        <div className="text-center font-black border-b border-slate-200 pb-0.5 text-slate-700">Ronda {ronda}</div>
                        <div className="flex flex-col gap-1 mt-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                            <div key={num} className="flex items-center justify-between gap-1 text-[7px] text-slate-600">
                              <span className="font-extrabold w-2 text-left">{num}</span>
                              <div className="flex-1 border-b border-dashed border-slate-300 h-2"></div>
                              <div className="w-3.5 h-3.5 border border-slate-300 rounded-[4px] bg-white shrink-0 shadow-sm"></div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-1.5 pt-1 border-t border-slate-200 flex justify-between items-center text-[7px] font-extrabold text-slate-700">
                          <span>Total:</span>
                          <div className="w-4 h-4 border border-slate-400 rounded-[5px] bg-slate-50 flex items-center justify-center text-[6px] font-black"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-1">
                  <strong className="text-white">Escribir:</strong> Al iniciar cada ronda se revela una categoría y palabra al azar. Tenés un límite de tiempo para escribir 8 palabras relacionadas en tu hoja que creas que los otros también escribirán.
                </p>
                <p className="mt-1">
                  <strong className="text-white">Puntuar:</strong> Se leen las palabras. Si otra persona anotó lo mismo, suman 1 punto por coincidencia (ej: si 3 escribieron lo mismo, son 3 puntos para cada uno). Palabras únicas valen 0.
                </p>
                <p className="mt-1">
                  <strong className="text-white">Ganar:</strong> Al finalizar todas las rondas de la partida, ¡quien tenga más puntos acumulados en la grilla gana!
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn-touch w-full mt-4 py-3 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest border-b-4 border-violet-900 cursor-pointer"
              onClick={() => setModalAyudaOpen(false)}
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}

      {/* 🔄 Modal Propuesta de Reconexión a Sala Activa */}
      {propuestaReconexion && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-scale-up">
          <div className="bg-space-dark border-2 border-neon-purple rounded-2xl max-w-xs w-full p-6 shadow-2xl text-center">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl bg-neon-purple/20 border border-neon-purple/40 flex items-center justify-center">
              <Globe className="w-6 h-6 text-neon-purple animate-pulse" />
            </div>
            <h3 className="text-sm font-black tracking-widest uppercase text-white mb-2 font-display">
              Partida en Curso
            </h3>
            <p className="text-text-sub text-xs mb-6 font-bold leading-relaxed">
              Detectamos que tenés una partida activa en la sala <span className="text-neon-purple font-black">{propuestaReconexion.codigo}</span>. ¿Querés reincorporarte?
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={confirmarReconexion}
                className="btn-touch w-full py-3.5 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest border-b-4 border-violet-900 cursor-pointer"
              >
                Sí, Reincorporarme
              </button>
              <button
                type="button"
                onClick={descartarReconexion}
                className="btn-touch w-full py-3 bg-slate-900 hover:bg-slate-950 text-text-sub hover:text-white font-bold rounded-xl text-xs uppercase tracking-widest border border-slate-800 cursor-pointer"
              >
                No, Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
