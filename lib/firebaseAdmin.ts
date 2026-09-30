// lib/firebaseAdmin.ts
// Acesso de administrador ao Firebase, só para as rotas do servidor: ele ignora as regras do banco.

import admin from 'firebase-admin';

// No emulador (desenvolvimento e testes) não há credencial: basta o id do projeto de demonstração
const usandoEmulador = () => !!process.env.FIRESTORE_EMULATOR_HOST;

const credencialDeProducao = () => {
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
  return admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.split(String.raw`\n`).join('\n'),
  });
};

// Inicializa o app apenas se ainda não foi inicializado para evitar erros
const iniciarAdmin = () => {
  if (admin.apps.length) return;
  if (usandoEmulador()) {
    admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
  } else {
    admin.initializeApp({ credential: credencialDeProducao() });
  }
};

// Retorna a instância do Firestore com permissões de admin
export const initAdmin = () => {
  iniciarAdmin();
  return admin.firestore();
};

// Confere os logins que as telas mandam para as rotas do servidor
export const adminAuth = () => {
  iniciarAdmin();
  return admin.auth();
};
