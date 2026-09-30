// __tests__/firebase/vinculo.rules.test.ts
// Regras do Firestore: cada papel vê e altera só o que é seu (raio-X, etapa 2).
// Cada pessoa acessa o banco direto, sem passar pelo app, como faria quem tenta burlar as regras.
// Roda contra o emulador: npm run test:firebase
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { encerrarAmbiente, iniciarAmbiente } from './helpers';

const PESSOAS = {
  admin: { displayName: 'Ana Admin', role: 'admin', status: 'aprovado' },
  coordenacao: { displayName: 'Carla Coordenadora', role: 'coordenador', status: 'aprovado' },
  recepcao: { displayName: 'Rafa Recepção', role: 'funcionario', status: 'aprovado' },
  terapeuta: { displayName: 'Paula Fonoaudióloga', role: 'profissional', status: 'aprovado' },
  familia: { displayName: 'Maria Souza', role: 'familiar', status: 'aprovado' },
  'outra-familia': { displayName: 'João Lima', role: 'familiar', status: 'aprovado' },
  'familia-pendente': { displayName: 'Renata Martins', role: 'familiar', status: 'pendente' },
};
type Pessoa = keyof typeof PESSOAS;

const REPASSE = 'Repasse de Profissional';
const amanha = Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000);

let testEnv: RulesTestEnvironment;

// O login leva o e-mail da pessoa, como no app (o vínculo automático usa o e-mail)
const bancoDe = (uid: Pessoa) => testEnv.authenticatedContext(uid, { email: `${uid}@libelle.test` }).firestore();

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    for (const [uid, pessoa] of Object.entries(PESSOAS)) {
      await setDoc(doc(banco, 'users', uid), {
        uid,
        displayName: pessoa.displayName,
        email: `${uid}@libelle.test`,
        profile: { role: pessoa.role, status: pessoa.status, cpf: '000.000.000-00', telefone: '(21) 90000-0000' },
      });
    }
    // Crianças: Lucas já ligado à Maria; Duda ainda não ligada, mas com o e-mail da Maria;
    // Bia de outra família; Theo com o e-mail da família que ainda espera aprovação
    await setDoc(doc(banco, 'patients', 'paciente-lucas'), { fullName: 'Lucas Souza', userId: 'familia', emailCadastro: 'familia@libelle.test', cpf: '111' });
    await setDoc(doc(banco, 'patients', 'paciente-duda'), { fullName: 'Duda Souza', emailCadastro: 'familia@libelle.test', cpf: '222' });
    await setDoc(doc(banco, 'patients', 'paciente-bia'), { fullName: 'Bia Lima', userId: 'outra-familia', emailCadastro: 'outra-familia@libelle.test', cpf: '333' });
    await setDoc(doc(banco, 'patients', 'paciente-theo'), { fullName: 'Theo Martins', emailCadastro: 'familia-pendente@libelle.test', cpf: '444' });

    await setDoc(doc(banco, 'professionals', 'prof-paula'), { userId: 'terapeuta', fullName: 'Paula Fonoaudióloga', cpf: '555', financeiro: { tipoPagamento: 'repasse', percentualRepasse: 50 } });

    for (const [id, pacienteId] of [['ag-lucas', 'paciente-lucas'], ['ag-bia', 'paciente-bia']]) {
      await setDoc(doc(banco, 'appointments', id), { patientId: pacienteId, professionalId: 'prof-paula', start: amanha, end: amanha, status: 'agendado', observacoes: '' });
    }

    await setDoc(doc(banco, 'transactions', 'repasse-pendente'), { category: REPASSE, appointmentId: 'ag-lucas', status: 'pendente', value: 50 });
    await setDoc(doc(banco, 'transactions', 'repasse-pago'), { category: REPASSE, appointmentId: 'ag-antigo', status: 'pago', value: 50 });
    await setDoc(doc(banco, 'transactions', 'aluguel'), { category: 'Aluguel', status: 'pago', value: 3000 });
    await setDoc(doc(banco, 'bankAccounts', 'conta-padrao'), { name: 'Conta principal', isDefault: true, currentBalance: 10000 });
    await setDoc(doc(banco, 'bankAccounts', 'conta-reserva'), { name: 'Reserva', isDefault: false, currentBalance: 50000 });
    await setDoc(doc(banco, 'accountPlans', 'plano-repasse'), { name: REPASSE, category: 'despesa', code: '2.1' });
    await setDoc(doc(banco, 'accountPlans', 'plano-aluguel'), { name: 'Aluguel', category: 'despesa', code: '2.2' });
    await setDoc(doc(banco, 'costCenters', 'cc-fono'), { name: 'Fonoaudiologia' });
    await setDoc(doc(banco, 'covenants', 'conv-unimed'), { name: 'Unimed' });
    await setDoc(doc(banco, 'suppliers', 'forn-1'), { name: 'Papelaria' });
    await setDoc(doc(banco, 'settings', 'companyInfo'), { name: 'Casa Libelle' });
    await setDoc(doc(banco, 'budgets', 'orc-1'), { name: 'Orçamento 2026' });
  });
});

describe('cadastros de usuários', () => {
  it('cada pessoa lê o próprio cadastro', async () => {
    await assertSucceeds(getDoc(doc(bancoDe('familia'), 'users', 'familia')));
  });

  it('a família não lê o cadastro de outra pessoa', async () => {
    await assertFails(getDoc(doc(bancoDe('familia'), 'users', 'terapeuta')));
  });

  it('a família não lista os cadastros', async () => {
    await assertFails(getDocs(collection(bancoDe('familia'), 'users')));
  });

  it('o terapeuta não lê o cadastro das famílias', async () => {
    await assertFails(getDoc(doc(bancoDe('terapeuta'), 'users', 'familia')));
  });

  it('a recepção lê os cadastros', async () => {
    await assertSucceeds(getDocs(collection(bancoDe('recepcao'), 'users')));
  });
});

describe('pacientes', () => {
  it('a família lê a criança ligada a ela', async () => {
    await assertSucceeds(getDoc(doc(bancoDe('familia'), 'patients', 'paciente-lucas')));
  });

  it('a família não lê a criança de outra família', async () => {
    await assertFails(getDoc(doc(bancoDe('familia'), 'patients', 'paciente-bia')));
  });

  it('a família lista as crianças ligadas a ela', async () => {
    const banco = bancoDe('familia');
    await assertSucceeds(getDocs(query(collection(banco, 'patients'), where('userId', '==', 'familia'))));
  });

  it('a família acha pelo e-mail do cadastro a criança ainda não ligada', async () => {
    const banco = bancoDe('familia');
    await assertSucceeds(getDocs(query(collection(banco, 'patients'), where('emailCadastro', '==', 'familia@libelle.test'))));
  });

  it('a família não lista todas as crianças', async () => {
    await assertFails(getDocs(collection(bancoDe('familia'), 'patients')));
  });

  it('o terapeuta lê todas as crianças', async () => {
    await assertSucceeds(getDocs(collection(bancoDe('terapeuta'), 'patients')));
  });

  it('a família aprovada se liga à criança cadastrada com o e-mail dela', async () => {
    await assertSucceeds(updateDoc(doc(bancoDe('familia'), 'patients', 'paciente-duda'), { userId: 'familia' }));
  });

  it('a família ainda pendente não se liga à criança', async () => {
    await assertFails(updateDoc(doc(bancoDe('familia-pendente'), 'patients', 'paciente-theo'), { userId: 'familia-pendente' }));
  });
});

describe('atendimentos', () => {
  it('a família lê os atendimentos da criança dela', async () => {
    const banco = bancoDe('familia');
    await assertSucceeds(getDocs(query(collection(banco, 'appointments'), where('patientId', '==', 'paciente-lucas'))));
  });

  it('a família busca de uma vez os próximos atendimentos das crianças, como no painel', async () => {
    const banco = bancoDe('familia');
    await assertSucceeds(getDocs(query(
      collection(banco, 'appointments'),
      where('patientId', 'in', ['paciente-lucas']),
      where('start', '>=', Timestamp.now()),
      orderBy('start', 'asc'),
      limit(5)
    )));
  });

  it('a família não lê os atendimentos de outra criança', async () => {
    const banco = bancoDe('familia');
    await assertFails(getDoc(doc(banco, 'appointments', 'ag-bia')));
    await assertFails(getDocs(query(collection(banco, 'appointments'), where('patientId', '==', 'paciente-bia'))));
  });

  it('o terapeuta lê a agenda da clínica', async () => {
    await assertSucceeds(getDocs(collection(bancoDe('terapeuta'), 'appointments')));
  });

  it('o terapeuta não altera nem apaga atendimentos', async () => {
    const banco = bancoDe('terapeuta');
    await assertFails(updateDoc(doc(banco, 'appointments', 'ag-lucas'), { status: 'finalizado' }));
    await assertFails(deleteDoc(doc(banco, 'appointments', 'ag-lucas')));
  });

  it('a recepção altera atendimentos', async () => {
    await assertSucceeds(updateDoc(doc(bancoDe('recepcao'), 'appointments', 'ag-lucas'), { status: 'finalizado' }));
  });
});

describe('profissionais', () => {
  it('a família não lê o cadastro dos profissionais', async () => {
    await assertFails(getDoc(doc(bancoDe('familia'), 'professionals', 'prof-paula')));
  });

  it('o terapeuta lê os profissionais', async () => {
    await assertSucceeds(getDocs(collection(bancoDe('terapeuta'), 'professionals')));
  });
});

describe('financeiro', () => {
  const repassesDo = (pessoa: Pessoa, atendimento: string) =>
    getDocs(query(
      collection(bancoDe(pessoa), 'transactions'),
      where('appointmentId', '==', atendimento),
      where('category', '==', REPASSE)
    ));

  it('o admin lê e altera todo o financeiro', async () => {
    const banco = bancoDe('admin');
    await assertSucceeds(getDocs(collection(banco, 'transactions')));
    await assertSucceeds(getDocs(collection(banco, 'bankAccounts')));
    await assertSucceeds(updateDoc(doc(banco, 'transactions', 'aluguel'), { value: 3100 }));
  });

  it('a recepção não lê todos os lançamentos', async () => {
    await assertFails(getDocs(collection(bancoDe('recepcao'), 'transactions')));
  });

  it('a coordenação também não lê todos os lançamentos', async () => {
    await assertFails(getDocs(collection(bancoDe('coordenacao'), 'transactions')));
  });

  it('a recepção lê os repasses de um atendimento', async () => {
    await assertSucceeds(repassesDo('recepcao', 'ag-lucas'));
  });

  it('a recepção cria o repasse ao finalizar um atendimento', async () => {
    await assertSucceeds(setDoc(doc(bancoDe('recepcao'), 'transactions', 'repasse-novo'), {
      category: REPASSE, appointmentId: 'ag-lucas', status: 'pendente', value: 50, type: 'despesa',
    }));
  });

  it('a recepção não cria outro tipo de lançamento', async () => {
    await assertFails(setDoc(doc(bancoDe('recepcao'), 'transactions', 'outro'), {
      category: 'Aluguel', status: 'pendente', value: 3000, type: 'despesa',
    }));
  });

  it('a recepção apaga um repasse pendente, mas não um já pago', async () => {
    const banco = bancoDe('recepcao');
    await assertSucceeds(deleteDoc(doc(banco, 'transactions', 'repasse-pendente')));
    await assertFails(deleteDoc(doc(banco, 'transactions', 'repasse-pago')));
  });

  it('a recepção não altera um repasse', async () => {
    await assertFails(updateDoc(doc(bancoDe('recepcao'), 'transactions', 'repasse-pendente'), { value: 999 }));
  });

  it('a recepção lê só a conta bancária padrão', async () => {
    const banco = bancoDe('recepcao');
    await assertSucceeds(getDocs(query(collection(banco, 'bankAccounts'), where('isDefault', '==', true), limit(1))));
    await assertFails(getDocs(collection(banco, 'bankAccounts')));
  });

  it('a recepção lê e cria só o plano de contas do repasse', async () => {
    const banco = bancoDe('recepcao');
    await assertSucceeds(getDocs(query(collection(banco, 'accountPlans'), where('name', '==', REPASSE), where('category', '==', 'despesa'), limit(1))));
    await assertSucceeds(addDoc(collection(banco, 'accountPlans'), { name: REPASSE, category: 'despesa', code: '2.9' }));
    await assertFails(getDocs(collection(banco, 'accountPlans')));
    await assertFails(addDoc(collection(banco, 'accountPlans'), { name: 'Aluguel', category: 'despesa', code: '2.9' }));
  });

  it('a recepção lê e cria centros de custo, mas não apaga', async () => {
    const banco = bancoDe('recepcao');
    await assertSucceeds(getDocs(collection(banco, 'costCenters')));
    await assertSucceeds(addDoc(collection(banco, 'costCenters'), { name: 'Psicologia' }));
    await assertFails(deleteDoc(doc(banco, 'costCenters', 'cc-fono')));
  });

  it('convênios, fornecedores, configurações e orçamentos ficam só com o admin', async () => {
    for (const colecao of ['covenants', 'suppliers', 'settings', 'budgets']) {
      await assertFails(getDocs(collection(bancoDe('recepcao'), colecao)));
      await assertFails(getDocs(collection(bancoDe('coordenacao'), colecao)));
      await assertSucceeds(getDocs(collection(bancoDe('admin'), colecao)));
    }
  });
});
