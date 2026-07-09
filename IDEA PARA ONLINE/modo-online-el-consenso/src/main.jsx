import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GameProvider } from './context/GameContext.jsx'
import { OnlineGameProvider } from './context/OnlineGameContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <OnlineGameProvider>
        <App />
      </OnlineGameProvider>
    </GameProvider>
  </StrictMode>,
)

