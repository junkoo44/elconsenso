import React from 'react';

/**
 * Icono de Lector de Voz por Perfil Parlando / Speaking Head
 */
export default function SpeakingHeadIcon({ className = "w-4 h-4", muted = false }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      {/* Cabeza con nariz definida y boca ampliamente abierta */}
      <g transform="translate(0, 2)">
        <path 
          fill="currentColor" 
          stroke="none"
          d="M 0,0 L 8,0 C 9.5,2 10.2,4.5 11,6.5 C 11.8,7.2 13.5,8.2 13.5,9.5 C 13.5,10.5 12,11.2 10.5,11.8 L 5.5,13.5 L 10,16.2 C 11.2,16.8 11.8,17.8 10.8,18.8 C 9.8,19.8 7.5,19.8 5,19.8 L 0,19.8 Z" 
        />
      </g>

      {!muted ? (
        <g className="sound-waves">
          {/* Onda 1 (Interna) */}
          <path d="M 13.8,9 C 15.2,11 15.2,14 13.8,16" />
          {/* Onda 2 (Media) */}
          <path d="M 16.5,7 C 18.8,9.8 18.8,15.2 16.5,18" />
          {/* Onda 3 (Externa) */}
          <path d="M 19.2,5 C 22.5,8.5 22.5,16.5 19.2,20" />
        </g>
      ) : (
        /* Barra roja o diagonal de silenciado */
        <line x1="2" y1="22" x2="22" y2="2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      )}
    </svg>
  );
}
