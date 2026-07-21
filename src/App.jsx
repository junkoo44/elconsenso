import React, { useEffect } from 'react';
import { useGame } from './context/GameContext';
import { useOnlineGame } from './context/OnlineGameContext';
import Home from './screens/Home';
import Setup from './screens/Setup';
import Game from './screens/Game';
import Score from './screens/Score';
import Podium from './screens/Podium';

// Vistas del modo online
import OnlineHome from './screens/online/OnlineHome';
import CrearSala from './screens/online/CrearSala';
import UnirseSala from './screens/online/UnirseSala';
import LobbySala from './screens/online/LobbySala';
import RondaOnline from './screens/online/RondaOnline';
import RevelacionOnline from './screens/online/RevelacionOnline';
import PodiumOnline from './screens/online/PodiumOnline';

function App() {
  const { vistaActual, navegarA, temaActual, modalSalirOpen, setModalSalirOpen } = useGame();
  const { setCodigoSala } = useOnlineGame();

  useEffect(() => {
    const root = document.documentElement;
    // Limpiar clases de tema anteriores
    root.className = root.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
    // Agregar la clase de tema activo
    root.classList.add(`theme-${temaActual}`);
  }, [temaActual]);

  // Detector de links (Deep Link). Usamos un useRef para garantizar que SOLO corra al abrir la app.
  const deepLinkRevisado = React.useRef(false);

  useEffect(() => {
    if (deepLinkRevisado.current) return;
    
    // Lo cerramos permanentemente en la primera carga de la App
    deepLinkRevisado.current = true;
    
    const path = window.location.pathname;
    const match = path.match(/^\/sala\/([a-zA-Z0-9]{5})$/);
    if (match) {
      const codigo = match[1].toUpperCase();
      setCodigoSala(codigo);
      // Limpiamos la URL inmediatamente para evitar bucles si el usuario navega hacia atrás
      window.history.replaceState({ base: true }, '', '/');
      navegarA('online-unirse');
    }
  }, [navegarA, setCodigoSala]);

  const renderVista = () => {
    switch (vistaActual) {
      case 'home':
        return <Home />;
      case 'setup':
        return <Setup />;
      case 'game':
        return <Game />;
      case 'score':
        return <Score />;
      case 'podium':
        return <Podium />;
      // Ruteo Modo Online
      case 'online-home':
        return <OnlineHome />;
      case 'online-crear':
        return <CrearSala />;
      case 'online-unirse':
        return <UnirseSala />;
      case 'online-lobby':
        return <LobbySala />;
      case 'online-ronda':
        return <RondaOnline />;
      case 'online-revelacion':
        return <RevelacionOnline />;
      case 'online-podium':
        return <PodiumOnline />;
      default:
        return <Home />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-space-dark text-white overflow-x-hidden select-none theme-${temaActual} transition-all duration-500`}>
      {renderVista()}

      {/* Cartel Anti-Salidas Accidentales */}
      {modalSalirOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-scale-up">
          <div className="bg-space-dark border-2 border-neon-red rounded-2xl max-w-xs w-full p-6 shadow-2xl text-center">
            <h3 className="text-sm font-black tracking-widest uppercase text-neon-red mb-3 font-display">
              ¿Abandonar Partida?
            </h3>
            <p className="text-text-sub text-xs mb-6 font-bold leading-relaxed">
              Estás en medio de un juego. Si sales ahora, perderás todo el progreso de esta partida.
            </p>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setModalSalirOpen(false)}
                className="btn-touch flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-widest"
              >
                Quedarme
              </button>
              <button 
                type="button"
                onClick={() => {
                  setModalSalirOpen(false);
                  const esOnline = vistaActual.startsWith('online-');
                  navegarA(esOnline ? 'online-home' : 'home');
                }}
                className="btn-touch flex-1 py-3.5 bg-neon-red hover:bg-red-500 text-white font-extrabold rounded-xl text-[10px] uppercase tracking-widest"
              >
                Sí, Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
