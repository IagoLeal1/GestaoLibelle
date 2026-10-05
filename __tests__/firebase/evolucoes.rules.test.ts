// __tests__/firebase/evolucoes.rules.test.ts
// Regras do Firestore para as evoluções (patients/{id}/evolucoes/{atendimentoId}) e para a equipe
// de cada criança (patients/{id}/equipe/{uid}). São dados de saúde: leem o admin, a coordenação e
// os terapeutas que atendem a criança. A recepção e a família não leem. Só o terapeuta da sessão
// escreve a evolução dela, e só quem escreveu corrige. Junto, a sessão da agenda ganha a marca da
// evolução (sem o texto): é a única coisa da sessão que o terapeuta pode mudar.
// Cada pessoa acessa o banco direto, sem passar pelo app. Roda contra o emulador: npm run test:firebase
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection, deleteDoc, deleteField, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, writeBatch,
} from 'firebase/firestore';
import { encerrarAmbiente, iniciarAmbiente } from './helpers';

let testEnv: RulesTestEnvironment;

const bancoDe = (uid: string) => testEnv.authenticatedContext(uid).firestore();

const PESSOAS = {
  ana: 'admin',
  carla: 'coordenador',
  rafa: 'funcionario',
  paula: 'profissional', // atende o Lucas (fono)
  rui: 'profissional', // atende o Lucas (psico)
  lia: 'profissional', // atende só a Bia
  maria: 'familiar', // mãe do Lucas
} as const;

const INICIO = Timestamp.fromMillis(Date.UTC(2026, 9, 5, 12, 0));
const FIM = Timestamp.fromMillis(Date.UTC(2026, 9, 5, 12, 50));

const SESSOES = {
  'sessao-paula-lucas': { patientId: 'lucas', professionalId: 'prof-paula', status: 'finalizado' },
  'sessao-rui-lucas': { patientId: 'lucas', professionalId: 'prof-rui', status: 'agendado', evolucao: 'escrita' },
  'sessao-lia-bia': { patientId: 'bia', professionalId: 'prof-lia', status: 'agendado' },
  'sessao-cancelada': { patientId: 'lucas', professionalId: 'prof-paula', status: 'cancelado' },
};

/** O documento que o app grava ao escrever a evolução (escreverEvolucao). */
const evolucao = (sessaoId: keyof typeof SESSOES, autorId: string, extra: Record<string, unknown> = {}) => ({
  appointmentId: sessaoId,
  patientId: SESSOES[sessaoId].patientId,
  patientName: 'Lucas Souza',
  professionalId: SESSOES[sessaoId].professionalId,
  professionalName: autorId,
  terapia: 'Fonoaudiologia',
  dataDaSessao: INICIO,
  autorId,
  autorNome: autorId,
  aconteceu: true,
  texto: 'Fonema /r/ com apoio visual. Participou bem. Treinar o /r/ em casa.',
  criadoEm: serverTimestamp(),
  ...extra,
});

/** Escreve como o app: a evolução, a entrada do terapeuta na equipe e a marca na sessão, juntas. */
const escrever = (uid: string, sessaoId: keyof typeof SESSOES, extra: Record<string, unknown> = {}, marca?: Record<string, string>) => {
  const banco = bancoDe(uid);
  const { patientId } = SESSOES[sessaoId];
  const dados = evolucao(sessaoId, uid, extra);
  const lote = writeBatch(banco);
  lote.set(doc(banco, 'patients', patientId, 'equipe', uid), { atendimentoId: sessaoId, criadoEm: serverTimestamp() });
  lote.set(doc(banco, 'patients', patientId, 'evolucoes', sessaoId), dados);
  lote.update(doc(banco, 'appointments', sessaoId), marca ?? { evolucao: dados.aconteceu ? 'escrita' : 'nao_aconteceu' });
  return lote.commit();
};

const evolucaoDe = (uid: string, patientId: string, sessaoId: string) => doc(bancoDe(uid), 'patients', patientId, 'evolucoes', sessaoId);

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
      await setDoc(doc(banco, 'appointments', id), { ...sessao, start: INICIO, end: FIM, tipo: 'Fonoaudiologia' });
    }
    // O Rui já escreveu a dele e está na equipe do Lucas; a Lia está na equipe da Bia
    await setDoc(doc(banco, 'patients', 'lucas', 'equipe', 'rui'), { atendimentoId: 'sessao-rui-lucas', criadoEm: INICIO });
    await setDoc(doc(banco, 'patients', 'bia', 'equipe', 'lia'), { atendimentoId: 'sessao-lia-bia', criadoEm: INICIO });
    await setDoc(doc(banco, 'patients', 'lucas', 'evolucoes', 'sessao-rui-lucas'), { ...evolucao('sessao-rui-lucas', 'rui'), criadoEm: INICIO });
  });
});

describe('quem escreve', () => {
  it('o terapeuta da sessão escreve a evolução dela', async () => {
    await assertSucceeds(escrever('paula', 'sessao-paula-lucas'));
  });

  it('o terapeuta informa que a sessão não aconteceu', async () => {
    await assertSucceeds(escrever('paula', 'sessao-paula-lucas', { aconteceu: false, texto: '' }));
  });

  it('outro terapeuta não escreve a evolução de uma sessão que não é dele', async () => {
    await assertFails(escrever('lia', 'sessao-paula-lucas'));
    await assertFails(escrever('rui', 'sessao-paula-lucas'));
    // Nem gravando só a evolução, sem a entrada na equipe
    await assertFails(setDoc(evolucaoDe('lia', 'lucas', 'sessao-paula-lucas'), evolucao('sessao-paula-lucas', 'lia', { professionalName: 'paula' })));
  });

  it('a recepção, a coordenação e a família não escrevem evolução', async () => {
    for (const uid of ['rafa', 'carla', 'maria']) await assertFails(escrever(uid, 'sessao-paula-lucas'));
  });

  it('não dá para escrever em nome de outra pessoa nem trocar a criança, o profissional ou a data da sessão', async () => {
    await assertFails(escrever('paula', 'sessao-paula-lucas', { autorId: 'rui' }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { patientId: 'bia' }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { professionalId: 'prof-rui' }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { dataDaSessao: Timestamp.fromMillis(Date.UTC(2026, 9, 6, 12)) }));
  });

  it('sessão cancelada não recebe evolução', async () => {
    await assertFails(escrever('paula', 'sessao-cancelada'));
  });

  it('o texto é um campo só, com limite de tamanho, e não aceita campos a mais', async () => {
    await assertFails(escrever('paula', 'sessao-paula-lucas', { texto: 'a'.repeat(8001) }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { nota: 10 }));
    await assertFails(escrever('paula', 'sessao-paula-lucas', { trabalhado: 'Campo separado' }));
  });
});

describe('quem entra na equipe da criança', () => {
  const entrar = (uid: string, patientId: string, atendimentoId: string) =>
    setDoc(doc(bancoDe(uid), 'patients', patientId, 'equipe', uid), { atendimentoId, criadoEm: serverTimestamp() });

  it('o terapeuta entra com uma sessão dele com a criança', async () => {
    await assertSucceeds(entrar('paula', 'lucas', 'sessao-paula-lucas'));
  });

  it('não entra com a sessão de outro terapeuta nem na equipe de outra criança', async () => {
    await assertFails(entrar('lia', 'lucas', 'sessao-paula-lucas'));
    await assertFails(entrar('lia', 'lucas', 'sessao-lia-bia'));
  });

  it('não coloca outra pessoa na equipe', async () => {
    await assertFails(setDoc(doc(bancoDe('paula'), 'patients', 'lucas', 'equipe', 'lia'), { atendimentoId: 'sessao-paula-lucas', criadoEm: serverTimestamp() }));
  });
});

describe('a marca da evolução na sessão da agenda', () => {
  const sessaoDe = (uid: string, sessaoId: string) => doc(bancoDe(uid), 'appointments', sessaoId);

  it('não marca a sessão sem escrever a evolução', async () => {
    await assertFails(updateDoc(sessaoDe('paula', 'sessao-paula-lucas'), { evolucao: 'escrita' }));
  });

  it('a marca tem que bater com a evolução', async () => {
    await assertFails(escrever('paula', 'sessao-paula-lucas', {}, { evolucao: 'nao_aconteceu' }));
  });

  it('não mexe na marca da sessão de outro terapeuta, nem repetindo a mesma', async () => {
    await assertFails(updateDoc(sessaoDe('paula', 'sessao-rui-lucas'), { evolucao: 'escrita' }));
  });

  it('junto com a marca, o terapeuta não muda mais nada da sessão', async () => {
    await assertFails(escrever('paula', 'sessao-paula-lucas', {}, { evolucao: 'escrita', status: 'nao_compareceu' }));
  });

  it('ao apagar a evolução, a marca sai junto; com a evolução lá, a marca não sai', async () => {
    await assertFails(updateDoc(sessaoDe('rui', 'sessao-rui-lucas'), { evolucao: deleteField() }));
    const banco = bancoDe('rui');
    const lote = writeBatch(banco);
    lote.delete(doc(banco, 'patients', 'lucas', 'evolucoes', 'sessao-rui-lucas'));
    lote.update(doc(banco, 'appointments', 'sessao-rui-lucas'), { evolucao: deleteField() });
    await assertSucceeds(lote.commit());
  });
});

describe('quem lê', () => {
  it('o admin e a coordenação leem todas', async () => {
    for (const uid of ['ana', 'carla']) await assertSucceeds(getDoc(evolucaoDe(uid, 'lucas', 'sessao-rui-lucas')));
  });

  it('o terapeuta que atende a criança lê a história inteira, de todas as terapias', async () => {
    await assertSucceeds(escrever('paula', 'sessao-paula-lucas'));
    await assertSucceeds(getDoc(evolucaoDe('paula', 'lucas', 'sessao-rui-lucas')));
    await assertSucceeds(getDocs(query(collection(bancoDe('paula'), 'patients', 'lucas', 'evolucoes'), orderBy('dataDaSessao', 'desc'))));
  });

  it('o terapeuta que não atende a criança não lê', async () => {
    await assertFails(getDoc(evolucaoDe('lia', 'lucas', 'sessao-rui-lucas')));
    await assertFails(getDocs(collection(bancoDe('lia'), 'patients', 'lucas', 'evolucoes')));
  });

  it('a recepção e a família não leem', async () => {
    for (const uid of ['rafa', 'maria']) {
      await assertFails(getDoc(evolucaoDe(uid, 'lucas', 'sessao-rui-lucas')));
      await assertFails(getDocs(collection(bancoDe(uid), 'patients', 'lucas', 'evolucoes')));
    }
  });
});

describe('quem corrige e apaga', () => {
  it('quem escreveu corrige o texto, e fica marcado como editada', async () => {
    await assertSucceeds(updateDoc(evolucaoDe('rui', 'lucas', 'sessao-rui-lucas'), { texto: 'Texto corrigido.', editadoEm: serverTimestamp() }));
  });

  it('a correção não troca a criança, a sessão nem o autor', async () => {
    await assertFails(updateDoc(evolucaoDe('rui', 'lucas', 'sessao-rui-lucas'), { patientId: 'bia', editadoEm: serverTimestamp() }));
    await assertFails(updateDoc(evolucaoDe('rui', 'lucas', 'sessao-rui-lucas'), { autorId: 'paula', editadoEm: serverTimestamp() }));
  });

  it('outro terapeuta e a coordenação não corrigem a evolução de alguém', async () => {
    await assertSucceeds(escrever('paula', 'sessao-paula-lucas'));
    for (const uid of ['paula', 'carla']) {
      await assertFails(updateDoc(evolucaoDe(uid, 'lucas', 'sessao-rui-lucas'), { texto: 'Outro texto.', editadoEm: serverTimestamp() }));
    }
  });

  it('quem escreveu, o admin e a coordenação apagam; outro terapeuta não', async () => {
    await assertSucceeds(escrever('paula', 'sessao-paula-lucas'));
    await assertFails(deleteDoc(evolucaoDe('paula', 'lucas', 'sessao-rui-lucas')));
    await assertSucceeds(deleteDoc(evolucaoDe('rui', 'lucas', 'sessao-rui-lucas')));
    await assertSucceeds(deleteDoc(evolucaoDe('carla', 'lucas', 'sessao-paula-lucas')));
  });
});
