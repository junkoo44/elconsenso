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

// Solo inicializar si todas las credenciales críticas de Firebase están configuradas y son válidas
const tieneCredenciales =
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'undefined' &&
  firebaseConfig.databaseURL &&
  firebaseConfig.databaseURL !== 'undefined' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'undefined' &&
  firebaseConfig.appId &&
  firebaseConfig.appId !== 'undefined';

const app = tieneCredenciales
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

const db = app ? getDatabase(app) : null;

if (db) {
  console.log("Firebase inicializado con éxito.");
} else {
  console.warn("Firebase: Faltan variables de entorno. El modo online estará desactivado.");
}

export { db };
export default app;
