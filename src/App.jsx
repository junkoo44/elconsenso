import React, { useEffect } from 'react';
import { useGame } from './context/GameContext';
import Home from './screens/Home';
import Setup from './screens/Setup';
import Game from './screens/Game';
import Score from './screens/Score';
import Podium from './screens/Podium';

function App() {
  const { vistaActual, temaActual } = useGame();

  useEffect(() => {
    const root = document.documentElement;
    // Limpiar clases de tema anteriores
    root.className = root.className.split(' ').filter(c => !c.startsWith('theme-')).join(' ');
    // Agregar la clase de tema activo
    root.classList.add(`theme-${temaActual}`);
  }, [temaActual]);

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
