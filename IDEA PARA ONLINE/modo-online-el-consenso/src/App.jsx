import React, { useEffect, useState } from 'react';
import { useGame } from './context/GameContext';
import Home from './screens/Home';
import Setup from './screens/Setup';
import Game from './screens/Game';
import Score from './screens/Score';
import Podium from './screens/Podium';
import OnlineHome from './screens/online/OnlineHome';
import CrearSala from './screens/online/CrearSala';
import UnirseSala from './screens/online/UnirseSala';
import LobbySala from './screens/online/LobbySala';
import RondaOnline from './screens/online/RondaOnline';
import RevelacionOnline from './screens/online/RevelacionOnline';
import PodiumOnline from './screens/online/PodiumOnline';

function App() {
  const { vistaActual, navegarA, temaActual } = useGame();
  const [codigoDesdeLink, setCodigoDesdeLink] = useState('');

  useEffect(() => {
    const root = document.documentElement;
    // Limpiar clases de tema anteriores
    root.className = root.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
    // Agregar la clase de tema activo
    root.classList.add(`theme-${temaActual}`);
  }, [temaActual]);

  // Deep link: si alguien abre /sala/ABCDE directamente, lo llevamos al form de unirse con el código precargado
  useEffect(() => {
    const match = window.location.pathname.match(/^\/sala\/([A-Za-z0-9]+)$/);
    if (match) {
      setCodigoDesdeLink(match[1].toUpperCase());
      navegarA('online-unirse');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      case 'online-home':
        return <OnlineHome />;
      case 'online-crear':
        return <CrearSala />;
      case 'online-unirse':
        return <UnirseSala codigoInicial={codigoDesdeLink} />;
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
