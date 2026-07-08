import { useCallback, useRef, useState } from 'react';

/**
 * Custom hook to detect long press events on both desktop (mouse) and mobile (touch) devices.
 * Sells scrolling issues by cancelling the timer on move.
 * 
 * @param {Function} onLongPress Callback triggered when long press duration is met
 * @param {Function} onClick Optional callback for standard clicks
 * @param {Object} options Configuration options
 * @param {number} options.delay Duration in ms (default 600)
 */
export const useLongPress = (onLongPress, onClick, { delay = 600 } = {}) => {
  const timeoutRef = useRef(null);
  const isLongPressActive = useRef(false);
  const startEventRef = useRef(null);

  const start = useCallback((event) => {
    // Evitar que haga click derecho por defecto
    if (event.type === 'click' && event.button !== 0) return;
    
    // Almacenar el evento inicial
    event.persist && event.persist();
    startEventRef.current = event;
    isLongPressActive.current = false;

    // Iniciar temporizador
    timeoutRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      onLongPress(event);
    }, delay);
  }, [onLongPress, delay]);

  const clear = useCallback((event, shouldTriggerClick = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (shouldTriggerClick && !isLongPressActive.current && onClick) {
      onClick(event);
    }
    
    isLongPressActive.current = false;
  }, [onClick]);

  const move = useCallback(() => {
    // Si el usuario mueve el dedo (scroll) o el mouse, cancelamos el long press
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: (e) => clear(e, true),
    onMouseLeave: (e) => clear(e, false),
    onTouchStart: start,
    onTouchEnd: (e) => {
      // Prevenir el comportamiento de simulación de click del navegador
      if (e.cancelable) {
        e.preventDefault();
      }
      clear(e, true);
    },
    onTouchMove: move
  };
};
