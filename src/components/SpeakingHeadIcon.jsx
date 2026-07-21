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
      {/* Contorno del perfil de cabeza hablando mirando a la izquierda */}
      <path d="M 18 3.5 C 12.5 3.5 9 7 9 11 L 7.2 12.8 C 6.9 13.1 7.1 13.6 7.6 13.6 H 9 L 8.2 15 C 7.9 15.4 8.2 16 8.7 16 H 10 C 11.5 18.2 13.8 19.5 16.8 19.5 C 20.2 19.5 21.5 16.5 21.5 11.5 C 21.5 6.5 19.8 3.5 18 3.5 Z" />
      
      {!muted ? (
        <>
          {/* Ondas sonoras saliendo de la boca hacia la izquierda */}
          <path d="M 5.2 9.5 C 4.1 11 4.1 13 5.2 14.5" />
          <path d="M 3.2 7.5 C 1.5 10 1.5 14 3.2 16.5" />
          <path d="M 1.2 5.5 C -0.5 9 -0.5 15 1.2 18.5" />
        </>
      ) : (
        /* Barra roja o diagonal de silenciado */
        <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      )}
    </svg>
  );
}
