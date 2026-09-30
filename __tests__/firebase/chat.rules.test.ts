// __tests__/firebase/chat.rules.test.ts
// Regras do Firestore para as conversas. Cada pessoa acessa o banco direto,
// sem passar pelo app, que é o caminho de quem tenta burlar as regras.
// Roda contra o emulador: npm run test:firebase
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { encerrarAmbiente, iniciarAmbiente } from './helpers';

const GRUPO = 'grupo-maria';

const PESSOAS = {
  familia: { uid: 'familia', displayName: 'Maria Souza', role: 'familiar', status: 'aprovado' },
  terapeuta: { uid: 'terapeuta', displayName: 'Paula Fonoaudióloga', role: 'profissional', status: 'aprovado' },
  coordenacao: { uid: 'coordenacao', displayName: 'Carla Coordenadora', role: 'coordenador', status: 'aprovado' },
  outraFamilia: { uid: 'outra-familia', displayName: 'João Lima', role: 'familiar', status: 'aprovado' },
  pendente: { uid: 'pendente', displayName: 'Pedro Pendente', role: 'familiar', status: 'pendente' },
  // Não participa do grupo: acompanha como supervisão
  admin: { uid: 'admin', displayName: 'Ana Admin', role: 'admin', status: 'aprovado' },
};
// Está no grupo, mas o documento em users foi apagado (é o que o "excluir usuário" faz)
const REMOVIDO = 'removido';

let testEnv: RulesTestEnvironment;

const bancoDe = (uid: string) => testEnv.authenticatedContext(uid).firestore();

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    for (const pessoa of Object.values(PESSOAS)) {
      await setDoc(doc(banco, 'users', pessoa.uid), {
        uid: pessoa.uid,
        displayName: pessoa.displayName,
        email: `${pessoa.uid}@libelle.test`,
        profile: { role: pessoa.role, status: pessoa.status },
      });
    }
    const criadoEm = Timestamp.fromMillis(Date.UTC(2026, 0, 1));
    await setDoc(doc(banco, 'chat_groups', GRUPO), {
      pacienteId: 'familia',
      pacienteNome: 'Maria Souza',
      responsavelId: 'familia',
      responsavelNome: 'Maria Souza',
      terapeutaIds: ['terapeuta'],
      terapeutaNomes: ['Paula Fonoaudióloga'],
      memberIds: ['familia', 'terapeuta', 'coordenacao', 'pendente', REMOVIDO],
      createdBy: 'coordenacao',
      createdAt: criadoEm,
      updatedAt: criadoEm,
      unreadCounts: {},
      lastMessage: null,
    });
    await setDoc(doc(banco, 'chat_groups', GRUPO, 'messages', 'msg-1'), {
      senderId: 'terapeuta',
      senderName: 'Paula Fonoaudióloga',
      senderRole: 'profissional',
      content: 'Bom dia!',
      createdAt: criadoEm,
      readBy: ['terapeuta'],
      type: 'text',
    });
  });
});

describe('leitura da conversa', () => {
  it('membro aprovado lê o grupo', async () => {
    await assertSucceeds(getDoc(doc(bancoDe('familia'), 'chat_groups', GRUPO)));
  });

  it('quem não participa não lê o grupo', async () => {
    await assertFails(getDoc(doc(bancoDe('outra-familia'), 'chat_groups', GRUPO)));
  });

  it('membro com cadastro pendente não lê o grupo', async () => {
    await assertFails(getDoc(doc(bancoDe('pendente'), 'chat_groups', GRUPO)));
  });

  it('usuário removido não lê o grupo, mesmo continuando na lista de membros', async () => {
    await assertFails(getDoc(doc(bancoDe(REMOVIDO), 'chat_groups', GRUPO)));
  });

  it('membro aprovado lê as mensagens', async () => {
    await assertSucceeds(getDocs(collection(bancoDe('familia'), 'chat_groups', GRUPO, 'messages')));
  });

  it('membro com cadastro pendente não lê as mensagens', async () => {
    await assertFails(getDocs(collection(bancoDe('pendente'), 'chat_groups', GRUPO, 'messages')));
  });
});

/** A prévia que o app grava junto com cada mensagem enviada. */
const previaDe = (uid: string, nome: string) => ({
  lastMessage: { content: 'Oi', senderId: uid, senderName: nome, createdAt: serverTimestamp() },
  updatedAt: serverTimestamp(),
});

describe('atualização do grupo', () => {
  it('membro atualiza a prévia com a própria mensagem', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    await assertSucceeds(updateDoc(grupo, previaDe('familia', 'Maria Souza')));
  });

  it('membro não altera os participantes', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, { memberIds: arrayUnion('outra-familia') }));
  });

  it('membro não grava a prévia em nome de outra pessoa', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, previaDe('terapeuta', 'Paula Fonoaudióloga')));
  });

  it('membro não grava a prévia com um nome diferente do cadastro', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, previaDe('familia', 'Paula Fonoaudióloga')));
  });

  it('a prévia só aceita os campos da mensagem', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    const previa = previaDe('familia', 'Maria Souza');
    await assertFails(updateDoc(grupo, { ...previa, lastMessage: { ...previa.lastMessage, destaque: true } }));
  });

  it('a prévia não aceita texto com mais de 2000 caracteres', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    const previa = previaDe('familia', 'Maria Souza');
    await assertFails(updateDoc(grupo, { ...previa, lastMessage: { ...previa.lastMessage, content: 'a'.repeat(2001) } }));
  });

  it('membro não grava a prévia com o horário do aparelho', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    const horarioDoAparelho = Timestamp.fromMillis(Date.UTC(2020, 0, 1));
    await assertFails(updateDoc(grupo, {
      lastMessage: { content: 'Oi', senderId: 'familia', senderName: 'Maria Souza', createdAt: horarioDoAparelho },
      updatedAt: horarioDoAparelho,
    }));
  });

  it('membro marca a própria leitura da conversa', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    await assertSucceeds(updateDoc(grupo, { 'lastReadAt.familia': serverTimestamp() }));
  });

  it('membro não marca a leitura de outra pessoa', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, { 'lastReadAt.terapeuta': serverTimestamp() }));
  });

  it('a leitura usa o horário do servidor, não o do aparelho', async () => {
    const grupo = doc(bancoDe('familia'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, { 'lastReadAt.familia': Timestamp.fromMillis(Date.UTC(2030, 0, 1)) }));
  });

  it('coordenação altera os participantes', async () => {
    const grupo = doc(bancoDe('coordenacao'), 'chat_groups', GRUPO);
    await assertSucceeds(updateDoc(grupo, { memberIds: arrayUnion('outra-familia') }));
  });

  it('coordenação liga o grupo à criança', async () => {
    const grupo = doc(bancoDe('coordenacao'), 'chat_groups', GRUPO);
    await assertSucceeds(updateDoc(grupo, { pacienteId: 'paciente-lucas', pacienteNome: 'Lucas Souza' }));
  });

  it('coordenação não marca a leitura de outra pessoa', async () => {
    const grupo = doc(bancoDe('coordenacao'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, { 'lastReadAt.familia': serverTimestamp() }));
  });

  it('coordenação não grava a prévia em nome de outra pessoa', async () => {
    const grupo = doc(bancoDe('coordenacao'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, previaDe('familia', 'Maria Souza')));
  });

  it('coordenação não altera outros dados do grupo, como quem o criou', async () => {
    const grupo = doc(bancoDe('coordenacao'), 'chat_groups', GRUPO);
    await assertFails(updateDoc(grupo, { createdBy: 'outra-familia' }));
  });

  it('a supervisão marca a própria leitura numa conversa de que não participa', async () => {
    const grupo = doc(bancoDe('admin'), 'chat_groups', GRUPO);
    await assertSucceeds(updateDoc(grupo, { 'lastReadAt.admin': serverTimestamp() }));
  });

  it('a supervisão atualiza a prévia com a própria mensagem numa conversa de que não participa', async () => {
    const grupo = doc(bancoDe('admin'), 'chat_groups', GRUPO);
    await assertSucceeds(updateDoc(grupo, previaDe('admin', 'Ana Admin')));
  });
});

/** A mensagem que o app grava quando Maria (família) envia "Oi". */
const mensagemDaMaria = (alteracoes: Record<string, unknown> = {}) => ({
  senderId: 'familia',
  senderName: 'Maria Souza',
  senderRole: 'familiar',
  content: 'Oi',
  type: 'text',
  createdAt: serverTimestamp(),
  ...alteracoes,
});

const enviarComoMaria = (alteracoes: Record<string, unknown> = {}) =>
  addDoc(collection(bancoDe('familia'), 'chat_groups', GRUPO, 'messages'), mensagemDaMaria(alteracoes));

describe('envio de mensagem', () => {
  it('membro envia uma mensagem válida', async () => {
    await assertSucceeds(enviarComoMaria());
  });

  it('ninguém envia em nome de outra pessoa', async () => {
    await assertFails(enviarComoMaria({ senderId: 'terapeuta' }));
  });

  it('o nome do remetente é o do cadastro', async () => {
    await assertFails(enviarComoMaria({ senderName: 'Dra. Paula' }));
  });

  it('o papel do remetente é o do cadastro', async () => {
    await assertFails(enviarComoMaria({ senderRole: 'profissional' }));
  });

  it('o horário é o do servidor, não o do aparelho', async () => {
    await assertFails(enviarComoMaria({ createdAt: Timestamp.fromMillis(Date.UTC(2020, 0, 1)) }));
  });

  it('mensagem vazia é recusada', async () => {
    await assertFails(enviarComoMaria({ content: '' }));
  });

  it('mensagem com mais de 2000 caracteres é recusada', async () => {
    await assertFails(enviarComoMaria({ content: 'a'.repeat(2001) }));
  });

  it('só aceita mensagens de texto', async () => {
    await assertFails(enviarComoMaria({ type: 'image' }));
  });

  it('campos fora do formato da mensagem são recusados', async () => {
    await assertFails(enviarComoMaria({ destaque: true }));
  });

  it('quem não participa não envia', async () => {
    const mensagens = collection(bancoDe('outra-familia'), 'chat_groups', GRUPO, 'messages');
    await assertFails(addDoc(mensagens, {
      ...mensagemDaMaria(),
      senderId: 'outra-familia',
      senderName: 'João Lima',
    }));
  });

  it('membro com cadastro pendente não envia', async () => {
    const mensagens = collection(bancoDe('pendente'), 'chat_groups', GRUPO, 'messages');
    await assertFails(addDoc(mensagens, {
      ...mensagemDaMaria(),
      senderId: 'pendente',
      senderName: 'Pedro Pendente',
    }));
  });
});

describe('histórico', () => {
  it('ninguém edita uma mensagem enviada', async () => {
    const mensagem = doc(bancoDe('terapeuta'), 'chat_groups', GRUPO, 'messages', 'msg-1');
    await assertFails(updateDoc(mensagem, { content: 'Texto trocado' }));
  });

  it('ninguém apaga uma mensagem enviada, nem a coordenação', async () => {
    const mensagem = doc(bancoDe('coordenacao'), 'chat_groups', GRUPO, 'messages', 'msg-1');
    await assertFails(deleteDoc(mensagem));
  });
});
