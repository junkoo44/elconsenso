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
  const { vistaActual, navegarA, temaActual } = useGame();
  const { setCodigoSala } = useOnlineGame();

  useEffect(() => {
    const root = document.documentElement;
    // Limpiar clases de tema anteriores
    root.className = root.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
    // Agregar la clase de tema activo
    root.classList.add(`theme-${temaActual}`);
  }, [temaActual]);

  // Deep Link de Sala: si la URL es /sala/ABCDE, ingresar directo a la pantalla de unirse
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/sala\/([a-zA-Z0-9]{5})$/);
    if (match) {
      const codigo = match[1].toUpperCase();
      setCodigoSala(codigo);
      navegarA('online-unirse');
    }
  }, [navegarA, setCodigoSala]);

  // Limpiar la URL de la barra si volvemos a una pantalla local del juego
  useEffect(() => {
    const esVistaOnline = vistaActual.startsWith('online-');
    if (!esVistaOnline && window.location.pathname.includes('/sala/')) {
      window.history.pushState({}, '', '/');
    }
  }, [vistaActual]);

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
    </div>
  );
}

export default App;
