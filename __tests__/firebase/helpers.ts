// __tests__/firebase/helpers.ts
// Apoio para os testes que rodam contra o emulador do Firebase (npm run test:firebase).
import { readFileSync } from 'fs';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteApp } from 'firebase/app';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { deleteDoc, doc, setDoc, terminate, Timestamp, writeBatch } from 'firebase/firestore';
import { app, auth, db } from '@/lib/firebaseConfig';
import { ChatGroup, ChatMessage, Papel, subscribeToChatMessages, subscribeToUserGroups } from '@/services/chatService';

const PROJECT_ID = 'demo-libelle';
const SENHA = 'senha-de-teste';

export interface UsuarioDeTeste {
  uid: string;
  email: string;
  displayName: string;
  role: Papel;
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

/**
 * Assina a conversa e resolve com a primeira lista que atende a condição.
 * Se ela não aparecer no prazo, falha mostrando como terminava a última lista recebida.
 */
export function aguardarLeitura(
  grupoId: string,
  condicao: (mensagens: ChatMessage[]) => boolean = () => true,
  prazoMs = 3000
): Promise<ChatMessage[]> {
  return new Promise((resolve, reject) => {
    let ultima: ChatMessage[] = [];
    const prazo = setTimeout(() => {
      cancelar();
      reject(new Error(`Condição não atendida em ${prazoMs} ms; a última lista terminava em "${ultima.at(-1)?.content}"`));
    }, prazoMs);
    const cancelar = subscribeToChatMessages(grupoId, (mensagens) => {
      ultima = mensagens;
      if (condicao(mensagens)) {
        clearTimeout(prazo);
        cancelar();
        resolve(mensagens);
      }
    });
  });
}

/** Igual a aguardarLeitura, mas para a lista de conversas do usuário. */
export function aguardarGrupos(
  uid: string,
  condicao: (grupos: ChatGroup[]) => boolean,
  prazoMs = 3000
): Promise<ChatGroup[]> {
  return new Promise((resolve, reject) => {
    let ultima: ChatGroup[] = [];
    const prazo = setTimeout(() => {
      cancelar();
      reject(new Error(`Condição não atendida em ${prazoMs} ms; última prévia: ${JSON.stringify(ultima[0]?.lastMessage)}`));
    }, prazoMs);
    const cancelar = subscribeToUserGroups(uid, (grupos) => {
      ultima = grupos;
      if (condicao(grupos)) {
        clearTimeout(prazo);
        cancelar();
        resolve(grupos);
      }
    });
  });
}

/** Cria a conta de login e o documento em users, como no cadastro do app. */
export async function criarUsuario(
  displayName: string,
  { role, status = 'aprovado' }: { role: Papel; status?: string }
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

/** Apaga o documento em users e mantém o login, como faz o "excluir usuário" do app. */
export async function removerCadastro(usuario: UsuarioDeTeste) {
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await deleteDoc(doc(contexto.firestore(), 'users', usuario.uid));
  });
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

/** Cadastra um paciente (patients/{id}), opcionalmente já vinculado à conta da família. */
export async function criarPaciente(id: string, fullName: string, familia?: UsuarioDeTeste) {
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), 'patients', id), {
      fullName,
      status: 'ativo',
      cpf: '000.000.000-00',
      dataNascimento: Timestamp.fromMillis(Date.UTC(2019, 4, 10)),
      dataCadastro: Timestamp.now(),
      responsavel: { nome: familia?.displayName ?? '' },
      ...(familia ? { userId: familia.uid, emailCadastro: familia.email } : {}),
    });
  });
  return { id, nome: fullName };
}

/** Cadastra um profissional (professionals/{id}) ligado à conta de um usuário. */
export async function criarProfissional(id: string, usuario: UsuarioDeTeste) {
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), 'professionals', id), {
      userId: usuario.uid,
      fullName: usuario.displayName,
      status: 'ativo',
    });
  });
}

/** Marca um atendimento do paciente com o profissional, `dias` a partir de hoje (negativo = passado). */
export async function criarAgendamento(patientId: string, professionalId: string, dias: number) {
  const inicio = Date.now() + dias * 24 * 60 * 60 * 1000;
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), 'appointments', `ag-${patientId}-${professionalId}-${dias}`), {
      patientId,
      professionalId,
      start: Timestamp.fromMillis(inicio),
      end: Timestamp.fromMillis(inicio + 50 * 60 * 1000),
      status: 'agendado',
    });
  });
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
