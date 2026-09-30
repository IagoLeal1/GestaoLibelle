// __tests__/firebase/users.rules.test.ts
// Regras do Firestore para o cadastro de usuários (users/{uid}).
// Cada pessoa acessa o banco direto, sem passar pelo app, como faria quem tenta burlar as regras.
// Roda contra o emulador: npm run test:firebase
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { encerrarAmbiente, iniciarAmbiente } from './helpers';

let testEnv: RulesTestEnvironment;

const bancoDe = (uid: string) => testEnv.authenticatedContext(uid).firestore();

/** O documento que o cadastro do app (signUpAndCreateProfile) grava para uma família. */
const cadastroDeFamilia = (uid: string, perfil: Record<string, unknown> = {}) => ({
  uid,
  displayName: 'Nova Família',
  email: `${uid}@libelle.test`,
  profile: {
    role: 'familiar',
    status: 'pendente',
    cpf: null,
    telefone: null,
    vinculo: 'Responsável',
    observations: '',
    createdAt: Timestamp.now(),
    historyHidden: false,
    ...perfil,
  },
});

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    await setDoc(doc(banco, 'users', 'admin'), {
      uid: 'admin',
      displayName: 'Ana Admin',
      email: 'admin@libelle.test',
      profile: { role: 'admin', status: 'aprovado' },
    });
    await setDoc(doc(banco, 'users', 'familia'), {
      uid: 'familia',
      displayName: 'Maria Souza',
      email: 'familia@libelle.test',
      profile: { role: 'familiar', status: 'aprovado' },
    });
    await setDoc(doc(banco, 'users', 'pendente'), {
      uid: 'pendente',
      displayName: 'Pedro Pendente',
      email: 'pendente@libelle.test',
      profile: { role: 'familiar', status: 'pendente' },
    });
  });
});

describe('cadastro', () => {
  it('família se cadastra como pendente', async () => {
    await assertSucceeds(setDoc(doc(bancoDe('nova'), 'users', 'nova'), cadastroDeFamilia('nova')));
  });

  it('ninguém se cadastra já aprovado', async () => {
    await assertFails(setDoc(doc(bancoDe('nova'), 'users', 'nova'), cadastroDeFamilia('nova', { status: 'aprovado' })));
  });

  it('ninguém se cadastra como admin ou coordenação', async () => {
    await assertFails(setDoc(doc(bancoDe('nova'), 'users', 'nova'), cadastroDeFamilia('nova', { role: 'admin' })));
  });

  it('o cadastro guarda o uid da própria conta', async () => {
    await assertFails(setDoc(doc(bancoDe('nova'), 'users', 'nova'), { ...cadastroDeFamilia('nova'), uid: 'admin' }));
  });
});

describe('leitura do cadastro', () => {
  it('quem está pendente lê o próprio cadastro (para o login avisar que falta aprovação)', async () => {
    await assertSucceeds(getDoc(doc(bancoDe('pendente'), 'users', 'pendente')));
  });

  it('quem está pendente não lê o cadastro dos outros', async () => {
    await assertFails(getDoc(doc(bancoDe('pendente'), 'users', 'familia')));
  });
});

describe('edição do cadastro', () => {
  it('a pessoa troca o próprio nome', async () => {
    await assertSucceeds(updateDoc(doc(bancoDe('familia'), 'users', 'familia'), { displayName: 'Maria S. Souza' }));
  });

  it('a pessoa não muda o próprio papel', async () => {
    await assertFails(updateDoc(doc(bancoDe('familia'), 'users', 'familia'), { 'profile.role': 'admin' }));
  });

  it('o admin aprova um cadastro pendente', async () => {
    await assertSucceeds(updateDoc(doc(bancoDe('admin'), 'users', 'pendente'), { 'profile.status': 'aprovado' }));
  });

  it('o nome não pode ficar em branco', async () => {
    await assertFails(updateDoc(doc(bancoDe('familia'), 'users', 'familia'), { displayName: '' }));
  });

  it('um cadastro pendente não se aprova sozinho', async () => {
    await assertFails(updateDoc(doc(bancoDe('pendente'), 'users', 'pendente'), { 'profile.status': 'aprovado' }));
  });

  it('quem foi removido não volta aprovado recriando o cadastro', async () => {
    // "removido" tem login, mas o documento em users foi apagado pelo admin
    await assertFails(setDoc(doc(bancoDe('removido'), 'users', 'removido'), cadastroDeFamilia('removido', { status: 'aprovado' })));
  });

  it('quem foi removido volta como pendente, esperando o admin aprovar', async () => {
    await assertSucceeds(setDoc(doc(bancoDe('removido'), 'users', 'removido'), cadastroDeFamilia('removido')));
  });
});
