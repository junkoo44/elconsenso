import { useCallback, useRef } from 'react';
import * as Tone from 'tone';

export const useAudio = () => {
  // Referencias para sintetizadores y osciladores de Tone.js
  const synthRef = useRef(null);
  const noiseRef = useRef(null);

  /**
   * Inicializa el audio context de Tone.js (requiere interacción previa del usuario)
   */
  const initAudioContext = useCallback(async () => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("Tone.js Audio Context iniciado con éxito.");
      }
      
      // Crear los sintetizadores si no existen
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.1 }
        }).toDestination();
      }

      if (!noiseRef.current) {
        // Ruido blanco para el sonido del tictac sutil
        noiseRef.current = new Tone.NoiseSynth({
          noise: { type: 'white' },
          envelope: { attack: 0.001, decay: 0.03, sustain: 0 }
        }).toDestination();
      }
    } catch (e) {
      console.warn("Fallo al iniciar Tone.js Audio Context:", e);
    }
  }, []);

  /**
   * Reproduce un beep para la cuenta regresiva inicial (frecuencia en Hz)
   */
  const playCountdownBeep = useCallback((freq = 440) => {
    try {
      initAudioContext().then(() => {
        if (synthRef.current) {
          synthRef.current.triggerAttackRelease(freq, "0.08");
        }
      });
    } catch (e) {
      console.warn("Error al reproducir beep:", e);
    }
  }, [initAudioContext]);

  /**
   * Sonido sutil de tictac
   */
  const playTick = useCallback(() => {
    try {
      initAudioContext().then(() => {
        if (noiseRef.current) {
          // El tictac es un click sutil de ruido blanco
          noiseRef.current.triggerAttack("8n");
        }
      });
    } catch (e) {
      console.warn("Error al reproducir tictac:", e);
    }
  }, [initAudioContext]);

  /**
   * Buzzer / Alarma al finalizar el temporizador (sawtooth de baja frecuencia)
   */
  const playBuzzer = useCallback(() => {
    try {
      initAudioContext().then(() => {
        // Creamos un sintetizador pesado de sierra para el buzzer
        const buzzSynth = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.3 }
        }).toDestination();
        
        buzzSynth.triggerAttackRelease(["G2", "C3"], "0.6");
        
        // Liberar memoria del sintetizador temporal después de sonar
        setTimeout(() => buzzSynth.dispose(), 1500);
      });
    } catch (e) {
      console.warn("Error al reproducir buzzer:", e);
    }
  }, [initAudioContext]);

  /**
   * Fanfarria triunfal para el podio
   */
  const playFanfarria = useCallback(() => {
    try {
      initAudioContext().then(() => {
        const poly = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05, decay: 0.2, sustain: 0.3, release: 0.3 }
        }).toDestination();
        
        const ahora = Tone.now();
        // Sucesión rápida de acordes triunfales
        poly.triggerAttackRelease(["C4", "E4", "G4"], "0.15", ahora);
        poly.triggerAttackRelease(["E4", "G4", "C5"], "0.15", ahora + 0.15);
        poly.triggerAttackRelease(["G4", "C5", "E5"], "0.4", ahora + 0.3);
        
        setTimeout(() => poly.dispose(), 2000);
      });
    } catch (e) {
      console.warn("Error al reproducir fanfarria:", e);
    }
  }, [initAudioContext]);

  /**
   * Sonido sintético "Plop" ameno de gota/burbuja ascendente utilizando rampas Tone.js
   */
  const playPlop = useCallback(() => {
    try {
      initAudioContext().then(() => {
        const osc = new Tone.Oscillator(350, "sine");
        const ampEnvelope = new Tone.AmplitudeEnvelope({
          attack: 0.001,
          decay: 0.03,
          sustain: 0,
          release: 0.015
        }).toDestination();
        
        osc.connect(ampEnvelope);
        
        const ahora = Tone.now();
        osc.start(ahora);
        // Rampa de frecuencia ascendente de 350Hz a 1000Hz (gota ascendente)
        osc.frequency.setValueAtTime(350, ahora); 
        osc.frequency.exponentialRampToValueAtTime(1000, ahora + 0.025); 
        
        ampEnvelope.triggerAttackRelease(0.03, ahora);
        osc.stop(ahora + 0.05);
        
        setTimeout(() => {
          osc.dispose();
          ampEnvelope.dispose();
        }, 150);
      });
    } catch (e) {
      console.warn("Error al reproducir plop:", e);
    }
  }, [initAudioContext]);

  // Forzar la precarga de voces en dispositivos móviles para evitar retrasos en la primera llamada
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }

  /**
   * Utiliza la Web Speech API para leer el texto en voz alta
   * Busca y prioritiza una voz masculina y cálida en español
   */
  const speakCategory = useCallback((text) => {
    try {
      if (!('speechSynthesis' in window)) {
        console.warn("Web Speech API no está soportada en este navegador.");
        return;
      }
      
      // Cancelar cualquier lectura activa para evitar superposiciones
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.95; // Ligeramente más lenta para que suene más natural y cálida
      utterance.pitch = 0.9; // Tono ligeramente más bajo para mayor calidez masculina
      
      const voices = window.speechSynthesis.getVoices();
      
      // 1. Filtrar todas las voces en español
      const spanishVoices = voices.filter(v => v.lang.startsWith('es'));
      
      // 2. Intentar buscar una voz masculina específica
      // Nombres comunes masculinos en Microsoft, Google o Apple para español
      const maleKeywords = ['pablo', 'jorge', 'male', 'masc', 'hombre', 'guy', 'david'];
      
      let selectedVoice = spanishVoices.find(voice => {
        const nameLower = voice.name.toLowerCase();
        return maleKeywords.some(keyword => nameLower.includes(keyword));
      });
      
      // 3. Fallback: Si no se encuentra una explícitamente masculina, usar la primera en español
      if (!selectedVoice && spanishVoices.length > 0) {
        selectedVoice = spanishVoices[0];
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`Voz seleccionada: ${selectedVoice.name} (${selectedVoice.lang})`);
      }
      
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Error al sintetizar voz:", e);
    }
  }, []);

  return {
    initAudioContext,
    playCountdownBeep,
    playTick,
    playBuzzer,
    playFanfarria,
    playPlop,
    speakCategory
  };
};
