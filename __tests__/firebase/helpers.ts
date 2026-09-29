// __tests__/firebase/helpers.ts
// Apoio para os testes que rodam contra o emulador do Firebase (npm run test:firebase).
import { readFileSync } from 'fs';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, terminate, Timestamp, writeBatch } from 'firebase/firestore';
import { app, auth, db } from '@/lib/firebaseConfig';

const PROJECT_ID = 'demo-libelle';
const SENHA = 'senha-de-teste';

export interface UsuarioDeTeste {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

let testEnv: RulesTestEnvironment;
let contador = 0;

/** Sobe o ambiente com as regras atuais do firestore.rules. */
export async function iniciarAmbiente() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
  return testEnv;
}

/** Apaga todos os documentos e contas do emulador. */
export async function limparDados() {
  await signOut(auth);
  await testEnv.clearFirestore();
  await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/accounts`,
    { method: 'DELETE' }
  );
}

export async function encerrarAmbiente() {
  await signOut(auth);
  await testEnv.cleanup();
  await terminate(db);
  await deleteApp(app);
}

/** Cria a conta de login e o documento em users, como no cadastro do app. */
export async function criarUsuario(
  displayName: string,
  { role, status = 'aprovado' }: { role: string; status?: string }
): Promise<UsuarioDeTeste> {
  const email = `usuario${++contador}@libelle.test`;
  const { user } = await createUserWithEmailAndPassword(auth, email, SENHA);
  await signOut(auth);

  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), 'users', user.uid), {
      uid: user.uid,
      displayName,
      email,
      profile: { role, status },
    });
  });

  return { uid: user.uid, email, displayName, role };
}

export async function entrarComo(usuario: UsuarioDeTeste) {
  await signInWithEmailAndPassword(auth, usuario.email, SENHA);
}

/** Cria um grupo no mesmo formato gravado hoje por createChatGroup. */
export async function criarGrupo(membros: UsuarioDeTeste[], criadoPor: UsuarioDeTeste) {
  const familia = membros.find((m) => m.role === 'familiar') ?? membros[0];
  const terapeutas = membros.filter((m) => m.role === 'profissional');
  const grupoId = `grupo-${++contador}`;

  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), 'chat_groups', grupoId), {
      pacienteId: familia.uid,
      pacienteNome: familia.displayName,
      responsavelId: familia.uid,
      responsavelNome: familia.displayName,
      terapeutaIds: terapeutas.map((t) => t.uid),
      terapeutaNomes: terapeutas.map((t) => t.displayName),
      memberIds: membros.map((m) => m.uid),
      createdBy: criadoPor.uid,
      createdAt: Timestamp.fromMillis(Date.UTC(2026, 0, 1)),
      updatedAt: Timestamp.fromMillis(Date.UTC(2026, 0, 1)),
      unreadCounts: {},
      lastMessage: null,
    });
  });

  return grupoId;
}

/**
 * Grava "Mensagem 1" ... "Mensagem N", um minuto uma da outra,
 * alternando os autores, no formato atual de produção.
 */
export async function criarMensagens(grupoId: string, autores: UsuarioDeTeste[], total: number) {
  const inicio = Date.UTC(2026, 0, 1);

  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const firestore = contexto.firestore();
    const batch = writeBatch(firestore);
    for (let i = 1; i <= total; i++) {
      const autor = autores[i % autores.length];
      batch.set(doc(firestore, 'chat_groups', grupoId, 'messages', `msg-${String(i).padStart(3, '0')}`), {
        senderId: autor.uid,
        senderName: autor.displayName,
        senderRole: autor.role,
        content: `Mensagem ${i}`,
        createdAt: Timestamp.fromMillis(inicio + i * 60_000),
        readBy: [autor.uid],
        type: 'text',
      });
    }
    await batch.commit();
  });
}
