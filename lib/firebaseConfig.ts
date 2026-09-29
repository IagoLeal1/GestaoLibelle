// src/lib/firebaseConfig.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Sua configuração do Firebase, lendo das variáveis de ambiente
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase de forma segura
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);

// Emulador local (npm run dev:emulator e npm run test:firebase).
// Só aceita projetos "demo-", que nunca acessam a nuvem. As portas são as do firebase.json.
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true') {
  if (!firebaseConfig.projectId?.startsWith('demo-')) {
    throw new Error('O emulador do Firebase exige um projectId que comece com "demo-".');
  }

  // O hot reload reexecuta este módulo; conectar duas vezes lança erro.
  const globalState = globalThis as typeof globalThis & { __firebaseEmulatorsConnected?: boolean };
  if (!globalState.__firebaseEmulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    globalState.__firebaseEmulatorsConnected = true;
  }
}

export { app, auth, db };