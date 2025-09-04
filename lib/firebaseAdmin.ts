// lib/firebaseAdmin.ts

import admin from 'firebase-admin';

// Verifica se as variáveis de ambiente necessárias estão presentes para evitar erros
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('A variável de ambiente FIREBASE_PROJECT_ID não está definida.');
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('A variável de ambiente FIREBASE_CLIENT_EMAIL não está definida.');
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('A variável de ambiente FIREBASE_PRIVATE_KEY não está definida.');
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // APLICANDO A SOLUÇÃO QUE VOCÊ ENCONTROU!
  privateKey: process.env.FIREBASE_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
};

export const initAdmin = () => {
  // Inicializa o app apenas se ainda não foi inicializado para evitar erros
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  // Retorna a instância do Firestore com permissões de admin
  return admin.firestore();
};