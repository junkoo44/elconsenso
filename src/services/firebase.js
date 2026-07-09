import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

/**
 * Configuración de Firebase.
 * Todas las claves se leen de variables de entorno de Vite (prefijo VITE_).
 *
 * Estas claves de Firebase son públicas por diseño (viajan al cliente);
 * la seguridad real la dan las Realtime Database Rules.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Evita reinicializar la app si el módulo se vuelve a evaluar (HMR de Vite)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getDatabase(app);
export default app;
