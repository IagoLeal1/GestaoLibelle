// __tests__/firebase/avisos.rules.test.ts
// Regras do Firestore para os avisos (communications/{id}). Antes, qualquer pessoa aprovada lia
// todos os avisos (uma família lia os internos da equipe), editar era recusado para todo mundo
// e a recepção apagava o aviso de qualquer pessoa.
// Cada pessoa acessa o banco direto, sem passar pelo app. Roda contra o emulador: npm run test:firebase
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where,
} from 'firebase/firestore';
import { encerrarAmbiente, iniciarAmbiente } from './helpers';

let testEnv: RulesTestEnvironment;

const bancoDe = (uid: string) => testEnv.authenticatedContext(uid).firestore();

const PESSOAS = {
  ana: 'admin',
  carla: 'coordenador',
  rafa: 'funcionario',
  bia: 'funcionario',
  paula: 'profissional',
  maria: 'familiar',
} as const;

const AVISOS = {
  'aviso-equipe': { targetRole: 'equipe', authorId: 'carla' },
  'aviso-terapeutas': { targetRole: 'terapeutas', authorId: 'carla' },
  'aviso-antigo': { targetRole: 'profissional', authorId: 'ana' },
  'aviso-coordenacao': { targetRole: 'coordenador', authorId: 'ana' },
  'aviso-familias': { targetRole: 'familiar', authorId: 'rafa' },
};

/** O documento que o app grava ao enviar um aviso (createCommunication). */
const novoAviso = (authorId: string, extra: Record<string, unknown> = {}) => ({
  title: 'Feriado de 12/10',
  message: 'Não haverá atendimentos.',
  isImportant: false,
  targetRole: 'familiar',
  authorId,
  authorName: authorId,
  createdAt: Timestamp.now(),
  readBy: {},
  ...extra,
});

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    for (const [uid, role] of Object.entries(PESSOAS)) {
      await setDoc(doc(banco, 'users', uid), { uid, displayName: uid, email: `${uid}@libelle.test`, profile: { role, status: 'aprovado' } });
    }
    for (const [id, { targetRole, authorId }] of Object.entries(AVISOS)) {
      await setDoc(doc(banco, 'communications', id), novoAviso(authorId, { targetRole, title: id }));
    }
  });
});

const ler = (uid: string, avisoId: string) => getDoc(doc(bancoDe(uid), 'communications', avisoId));

describe('quem lê cada aviso', () => {
  it('a família lê só os avisos das famílias', async () => {
    await assertSucceeds(ler('maria', 'aviso-familias'));
    for (const id of ['aviso-equipe', 'aviso-terapeutas', 'aviso-antigo', 'aviso-coordenacao']) {
      await assertFails(ler('maria', id));
    }
  });

  it('o terapeuta lê os da equipe, os dos terapeutas e os internos antigos, e não os da coordenação nem os das famílias', async () => {
    for (const id of ['aviso-equipe', 'aviso-terapeutas', 'aviso-antigo']) await assertSucceeds(ler('paula', id));
    for (const id of ['aviso-coordenacao', 'aviso-familias']) await assertFails(ler('paula', id));
  });

  it('a recepção, como toda a gestão, lê todos os avisos', async () => {
    for (const id of Object.keys(AVISOS)) await assertSucceeds(ler('rafa', id));
  });

  it('cada um só busca a lista do seu público', async () => {
    const avisos = (uid: string) => collection(bancoDe(uid), 'communications');

    await assertSucceeds(getDocs(query(avisos('maria'), where('targetRole', '==', 'familiar'))));
    await assertFails(getDocs(avisos('maria')));
    await assertSucceeds(getDocs(query(avisos('paula'), where('targetRole', 'in', ['equipe', 'terapeutas', 'profissional']))));
    await assertFails(getDocs(avisos('paula')));
    await assertSucceeds(getDocs(avisos('carla')));
  });
});

describe('confirmar a leitura', () => {
  it('cada um marca só a própria leitura, e só nos avisos que pode ler', async () => {
    const avisoDasFamilias = doc(bancoDe('maria'), 'communications', 'aviso-familias');

    await assertSucceeds(updateDoc(avisoDasFamilias, { 'readBy.maria': serverTimestamp() }));
    await assertFails(updateDoc(avisoDasFamilias, { 'readBy.joao': serverTimestamp() }));
    await assertFails(updateDoc(doc(bancoDe('maria'), 'communications', 'aviso-equipe'), { 'readBy.maria': serverTimestamp() }));
  });
});

describe('escrever, editar e excluir', () => {
  it('a gestão envia em seu próprio nome, para um dos públicos', async () => {
    const avisos = (uid: string) => doc(collection(bancoDe(uid), 'communications'));

    await assertSucceeds(setDoc(avisos('rafa'), novoAviso('rafa', { targetRole: 'equipe' })));
    await assertFails(setDoc(avisos('rafa'), novoAviso('carla')));
    await assertFails(setDoc(avisos('rafa'), novoAviso('rafa', { targetRole: 'todo-mundo' })));
    await assertFails(setDoc(avisos('rafa'), novoAviso('rafa', { readBy: { rafa: Timestamp.now() } })));
    await assertFails(setDoc(avisos('paula'), novoAviso('paula')));
    await assertFails(setDoc(avisos('maria'), novoAviso('maria')));
  });

  it('quem escreveu edita o título e o texto; a coordenação edita qualquer aviso', async () => {
    const doRafa = (uid: string) => doc(bancoDe(uid), 'communications', 'aviso-familias');

    await assertSucceeds(updateDoc(doRafa('rafa'), { title: 'Feriado: a clínica não abre' }));
    await assertFails(updateDoc(doRafa('rafa'), { targetRole: 'equipe' }));
    await assertFails(updateDoc(doRafa('bia'), { title: 'Outro título' }));
    await assertFails(updateDoc(doRafa('maria'), { title: 'Outro título' }));
    await assertSucceeds(updateDoc(doRafa('carla'), { message: 'Remarcamos pela recepção.' }));
  });

  it('a recepção apaga o próprio aviso e não o dos outros; coordenação e administração apagam qualquer um', async () => {
    await assertFails(deleteDoc(doc(bancoDe('bia'), 'communications', 'aviso-familias')));
    await assertFails(deleteDoc(doc(bancoDe('rafa'), 'communications', 'aviso-equipe')));
    await assertFails(deleteDoc(doc(bancoDe('paula'), 'communications', 'aviso-terapeutas')));
    await assertSucceeds(deleteDoc(doc(bancoDe('rafa'), 'communications', 'aviso-familias')));
    await assertSucceeds(deleteDoc(doc(bancoDe('carla'), 'communications', 'aviso-coordenacao')));
    await assertSucceeds(deleteDoc(doc(bancoDe('ana'), 'communications', 'aviso-equipe')));
  });
});
