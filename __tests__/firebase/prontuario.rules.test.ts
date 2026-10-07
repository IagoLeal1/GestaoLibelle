// __tests__/firebase/prontuario.rules.test.ts
// Regras do Firestore para as anotações do prontuário (patients/{id}/anotacoes/{id}). São dados de saúde,
// como as evoluções: leem o admin, a coordenação e os terapeutas que atendem a criança; a recepção e a
// família não leem. Cada terapeuta escreve só na terapia dele, provando com uma sessão sua com a criança.
// Só quem escreveu corrige (o texto e o "Para lembrar"), e ninguém apaga: o prontuário fica guardado.
// Cada pessoa acessa o banco direto, sem passar pelo app. Roda contra o emulador: npm run test:firebase
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where,
} from 'firebase/firestore';
import { encerrarAmbiente, iniciarAmbiente } from './helpers';

let testEnv: RulesTestEnvironment;
const bancoDe = (uid: string) => testEnv.authenticatedContext(uid).firestore();

const PESSOAS = {
  ana: 'admin',
  carla: 'coordenador',
  rafa: 'funcionario',
  paula: 'profissional', // fono do Lucas
  rui: 'profissional', // psico do Lucas
  lia: 'profissional', // só da Bia
  maria: 'familiar', // mãe do Lucas
} as const;

const INICIO = Timestamp.fromMillis(Date.UTC(2026, 9, 5, 12, 0));
const SESSOES = {
  'sessao-paula-lucas': { patientId: 'lucas', professionalId: 'prof-paula', status: 'finalizado', tipo: 'Fonoaudiologia' },
  'sessao-rui-lucas': { patientId: 'lucas', professionalId: 'prof-rui', status: 'agendado', tipo: 'Psicologia' },
  'sessao-lia-bia': { patientId: 'bia', professionalId: 'prof-lia', status: 'agendado', tipo: 'Terapia Ocupacional' },
  'sessao-paula-cancelada': { patientId: 'lucas', professionalId: 'prof-paula', status: 'cancelado', tipo: 'Fonoaudiologia' },
};

/** A anotação que o app grava (escreverAnotacao). */
const anotacao = (autorId: string, atendimentoId: string, extra: Record<string, unknown> = {}) => ({
  terapia: 'Fonoaudiologia',
  texto: 'Objetivo do semestre: frases de 3 palavras.',
  fixada: true,
  autorId,
  autorNome: autorId,
  atendimentoId,
  criadoEm: serverTimestamp(),
  ...extra,
});
const anotacoesDe = (uid: string, patientId = 'lucas') => collection(bancoDe(uid), 'patients', patientId, 'anotacoes');
const escrever = (uid: string, atendimentoId: string, extra: Record<string, unknown> = {}, patientId = 'lucas') =>
  addDoc(anotacoesDe(uid, patientId), anotacao(uid, atendimentoId, extra));

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
    for (const uid of ['paula', 'rui', 'lia']) {
      await setDoc(doc(banco, 'professionals', `prof-${uid}`), { userId: uid, fullName: uid, status: 'ativo' });
    }
    await setDoc(doc(banco, 'patients', 'lucas'), { fullName: 'Lucas Souza', status: 'ativo', userId: 'maria' });
    await setDoc(doc(banco, 'patients', 'bia'), { fullName: 'Bia Lima', status: 'ativo' });
    for (const [id, sessao] of Object.entries(SESSOES)) {
      await setDoc(doc(banco, 'appointments', id), { ...sessao, start: INICIO, end: INICIO });
    }
    await setDoc(doc(banco, 'patients', 'lucas', 'equipe', 'paula'), { atendimentoId: 'sessao-paula-lucas', criadoEm: INICIO });
    await setDoc(doc(banco, 'patients', 'lucas', 'equipe', 'rui'), { atendimentoId: 'sessao-rui-lucas', criadoEm: INICIO });
    await setDoc(doc(banco, 'patients', 'bia', 'equipe', 'lia'), { atendimentoId: 'sessao-lia-bia', criadoEm: INICIO });
    await setDoc(doc(banco, 'patients', 'lucas', 'anotacoes', 'da-paula'), { ...anotacao('paula', 'sessao-paula-lucas'), criadoEm: INICIO });
  });
});

describe('quem lê', () => {
  it('o admin, a coordenação e os terapeutas da criança', async () => {
    for (const uid of ['ana', 'carla', 'paula', 'rui']) await assertSucceeds(getDocs(anotacoesDe(uid)));
  });

  it('a recepção, a família e um terapeuta que não atende a criança não leem', async () => {
    for (const uid of ['rafa', 'maria', 'lia']) await assertFails(getDocs(anotacoesDe(uid)));
  });

  it('dá para buscar o "Para lembrar" de uma terapia sem índice novo', async () => {
    const consulta = query(anotacoesDe('rui'), where('terapia', '==', 'Fonoaudiologia'), where('fixada', '==', true));
    expect((await assertSucceeds(getDocs(consulta))).size).toBe(1);
  });
});

describe('quem escreve', () => {
  it('o terapeuta escreve na terapia dele, com uma sessão sua com a criança', async () => {
    await assertSucceeds(escrever('paula', 'sessao-paula-lucas'));
    await assertSucceeds(escrever('rui', 'sessao-rui-lucas', { terapia: 'Psicologia', fixada: false }));
  });

  it('não escreve na terapia de outro, nem com a sessão de outro, nem em criança que não atende', async () => {
    await assertFails(escrever('paula', 'sessao-paula-lucas', { terapia: 'Psicologia' }));
    await assertFails(escrever('paula', 'sessao-rui-lucas', { terapia: 'Psicologia' }));
    await assertFails(escrever('lia', 'sessao-lia-bia', { terapia: 'Terapia Ocupacional' }));
    await assertFails(escrever('paula', 'sessao-paula-cancelada'));
  });

  it('a gestão e a família não escrevem', async () => {
    for (const uid of ['ana', 'carla', 'rafa', 'maria']) await assertFails(escrever(uid, 'sessao-paula-lucas'));
  });

  it('recusa autor trocado, campos a mais, texto vazio ou longo demais e data inventada', async () => {
    await assertFails(addDoc(anotacoesDe('paula'), anotacao('rui', 'sessao-paula-lucas')));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { extra: 'x' }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { texto: '' }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { texto: 'x'.repeat(8001) }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { criadoEm: INICIO }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { fixada: 'sim' }));
  });
});

describe('corrigir e apagar', () => {
  const daPaula = (uid: string) => doc(bancoDe(uid), 'patients', 'lucas', 'anotacoes', 'da-paula');

  it('quem escreveu corrige o texto e tira ou põe em "Para lembrar"', async () => {
    await assertSucceeds(updateDoc(daPaula('paula'), { texto: 'Objetivo novo: perguntas com "onde".', fixada: false, editadoEm: serverTimestamp() }));
  });

  it('corrigir sem marcar a data da correção, ou mudando a terapia, não vale', async () => {
    await assertFails(updateDoc(daPaula('paula'), { texto: 'Sem data da correção' }));
    await assertFails(updateDoc(daPaula('paula'), { terapia: 'Psicologia', editadoEm: serverTimestamp() }));
  });

  it('ninguém corrige a anotação de outra pessoa', async () => {
    for (const uid of ['rui', 'ana', 'carla']) {
      await assertFails(updateDoc(daPaula(uid), { texto: 'Mudei', editadoEm: serverTimestamp() }));
    }
  });

  it('ninguém apaga, nem quem escreveu, nem o admin', async () => {
    for (const uid of ['paula', 'ana', 'carla']) await assertFails(deleteDoc(daPaula(uid)));
  });
});
