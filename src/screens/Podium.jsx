import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { useAudio } from '../hooks/useAudio';
import {
  Trophy,
  Crown,
  RotateCcw,
  Home as HomeIcon,
  Sparkles,
  Award
} from 'lucide-react';

export default function Podium() {
  const {
    jugadores,
    puntajes,
    iniciarNuevaPartida,
    config,
    navegarA
  } = useGame();

  const { playFanfarria } = useAudio();
  const canvasRef = useRef(null);

  // Ordenar la lista final de posiciones
  const podioOrdenado = Object.entries(puntajes)
    .map(([nombre, puntos]) => ({ nombre, puntos }))
    .sort((a, b) => b.puntos - a.puntos);

  const ganador = podioOrdenado[0];

  // --- 1. Audio Fanfarria al montar ---
  useEffect(() => {
    playFanfarria();
  }, [playFanfarria]);

  // --- 2. Canvas Confetti ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = ['#7C3AED', '#06D6A0', '#FF6B6B', '#FFD166', '#118AB2', '#F72585'];
    const particleCount = 120;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 6 + 4,
        d: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += p.d;
        p.x += Math.sin(p.tiltAngle) * 0.5;
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > canvas.height) {
          particles[idx] = {
            ...p,
            x: Math.random() * canvas.width,
            y: -20,
            tilt: Math.random() * 10 - 5
          };
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleRevancha = () => {
    const exito = iniciarNuevaPartida(jugadores, config);
    if (exito) {
      navegarA('game');
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-between py-6 px-4 relative z-10 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* Trophy Cabecera */}
      <div className="text-center my-6 flex flex-col items-center gap-2 select-none relative z-10">
        <div className="mx-auto mb-2 animate-bounce w-20 h-20 bg-yellow-500/10 border border-yellow-500/30 rounded-3xl flex items-center justify-center shadow-[0_8px_20px_rgba(251,191,36,0.2)]">
          <Trophy className="w-10 h-10 text-yellow-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
        </div>
        <h1 className="text-4xl font-black tracking-widest text-white uppercase drop-shadow-[0_4px_12px_rgba(124,58,237,0.3)] font-display">
          Fin del Juego
        </h1>
        <div className="text-[10px] font-black tracking-widest text-neon-green uppercase">
          ¡Tenemos un Consenso!
        </div>
      </div>

      {/* Podio */}
      <div className="flex-1 flex flex-col justify-center gap-4 py-4 relative z-10">

        {/* Ganador Principal */}
        {ganador && (
          <div className="bg-gradient-to-br from-violet-950/70 to-slate-900/90 border-2 border-yellow-500/80 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden animate-scale-up">
            <div className="absolute top-3 right-4 text-[9px] font-black text-yellow-500 uppercase tracking-widest animate-pulse flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-yellow-500" /> 1° Puesto
            </div>

            <div className="text-[10px] font-bold text-text-sub uppercase tracking-wider mb-1.5">
              Ganador
            </div>
            <div className="text-3xl font-black text-yellow-400 tracking-wide mb-3 truncate font-display">
              {ganador.nombre}
            </div>

            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl text-yellow-400 font-extrabold text-xs tracking-widest uppercase">
              <Sparkles className="w-4 h-4 text-yellow-500" /> {ganador.puntos} puntos
            </div>
          </div>
        )}

        {/* Demás posiciones */}
        {podioOrdenado.length > 1 && (
          <div className="bg-slate-900/40 border border-slate-805/85 rounded-2xl p-4 flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
            {podioOrdenado.slice(1).map((jug, idx) => {
              const puesto = idx + 2;
              return (
                <div
                  key={jug.nombre}
                  className="bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-3 flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-black w-5 text-center text-xs ${puesto === 2 ? 'text-slate-400' : puesto === 3 ? 'text-amber-600' : 'text-text-sub'
                      }`}>
                      {puesto}°
                    </span>
                    <span className="font-extrabold text-white">{jug.nombre}</span>
                  </div>
                  <span className="font-black text-text-sub text-xs">
                    {jug.puntos} pts
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botonera inferior */}
      <div className="flex flex-col gap-3 mt-6 relative z-10">
        <button
          type="button"
          className="btn-touch w-full py-4.5 bg-neon-purple hover:bg-violet-750 text-white font-extrabold rounded-2xl shadow-xl shadow-neon-purple/20 border-b-4 border-violet-900 tracking-widest text-sm uppercase flex items-center justify-center gap-2 cursor-pointer"
          onClick={handleRevancha}
        >
          <RotateCcw className="w-5 h-5" /> Jugar Revancha
        </button>

        <button
          type="button"
          className="btn-touch w-full py-4 bg-slate-900/60 hover:bg-slate-900/90 text-text-sub hover:text-white font-bold rounded-2xl border-2 border-slate-800 tracking-widest text-xs uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          onClick={() => navegarA('home')}
        >
          <HomeIcon className="w-4 h-4" /> Volver al Inicio
        </button>
      </div>
    </div>
  );
}
