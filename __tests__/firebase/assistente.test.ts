// __tests__/firebase/assistente.test.ts
// O assistente de encaixe de ponta a ponta: a rota lê a agenda no banco e devolve as opções de
// horário. As regras do cálculo estão em __tests__/lib/encaixes.test.ts; aqui, que a rota lê os
// atendimentos certos (datas, profissional, criança, cancelados), respeita o que a coordenação
// recusou e só responde à gestão.
// Roda contra o emulador: npm run test:firebase
import admin from 'firebase-admin';
import { NextRequest } from 'next/server';
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebaseConfig';
import { POST } from '@/app/api/schedule-assistant/route';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(async () => {
  await Promise.all(admin.apps.map((app) => app?.delete()));
  await encerrarAmbiente();
});

const UM_DIA = 24 * 60 * 60 * 1000;
const diaNaClinica = (ms: number) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date(ms));

/** As próximas quintas-feiras (aaaa-mm-dd), a partir de amanhã, no calendário da clínica. */
const proximasQuintas = (quantas: number) => {
  let ms = Date.now() + UM_DIA;
  while (new Date(`${diaNaClinica(ms)}T12:00:00-03:00`).getUTCDay() !== 4) ms += UM_DIA;
  return Array.from({ length: quantas }, (_, i) => diaNaClinica(ms + i * 7 * UM_DIA));
};

beforeEach(async () => {
  await limparDados();
  const [primeira, segunda, terceira] = proximasQuintas(3);
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    // A Paula só atende às quintas, das 8h às 9h: o único horário dela é o das 08:10
    await setDoc(doc(banco, 'professionals', 'prof-paula'), {
      fullName: 'Paula Fonoaudióloga', especialidade: 'Fonoaudiologia', status: 'ativo',
      diasAtendimento: ['quinta'], horarioInicio: '08:00', horarioFim: '09:00',
    });
    const atendimentos = [
      ['ag-paula', primeira, 'prof-paula', 'paciente-bia', 'agendado'],
      ['ag-cancelado', segunda, 'prof-paula', 'paciente-bia', 'cancelado'],
      ['ag-do-lucas', terceira, 'prof-rui', 'paciente-lucas', 'agendado'], // a criança, com outro profissional
    ];
    for (const [id, dia, professionalId, patientId, status] of atendimentos) {
      await setDoc(doc(banco, 'appointments', id), {
        professionalId, patientId, status,
        start: Timestamp.fromDate(new Date(`${dia}T08:10:00-03:00`)),
        end: Timestamp.fromDate(new Date(`${dia}T09:00:00-03:00`)),
      });
    }
  });
});

/** O cabeçalho que a tela manda: o login atual da pessoa. */
const loginDe = async (usuario: UsuarioDeTeste) => {
  await entrarComo(usuario);
  return `Bearer ${await auth.currentUser!.getIdToken()}`;
};

const pedir = (login: string | null) =>
  POST(new NextRequest('http://localhost/api/schedule-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(login ? { Authorization: login } : {}) },
    body: JSON.stringify({
      pacienteId: 'paciente-lucas',
      necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 1 }],
      familia: { dias: ['quinta'] },
      emendar: true,
    }),
  }));

describe('assistente de agendamento', () => {
  it('conta a agenda do profissional e a da criança, sem os cancelados', async () => {
    const recepcao = await criarUsuario('Rafa Recepção', { role: 'funcionario' });

    const resposta = await pedir(await loginDe(recepcao));

    expect(resposta.status).toBe(200);
    const { opcoes } = await resposta.json();
    expect(opcoes[0].sessoes).toEqual([
      expect.objectContaining({ dia: 'quinta', horario: '08:10', semanasLivres: 10, comTroca: false }),
    ]);
  });

  it('não oferece o que a coordenação recusou', async () => {
    const recepcao = await criarUsuario('Rafa Recepção', { role: 'funcionario' });
    await testEnv.withSecurityRulesDisabled(async (contexto) => {
      await setDoc(doc(contexto.firestore(), 'encaixes', 'recusa-1'), {
        status: 'recusado',
        bloqueios: [{ tipo: 'horario', pacienteId: 'paciente-lucas', dia: 'quinta', horario: '08:10' }],
      });
    });

    const { opcoes } = await (await pedir(await loginDe(recepcao))).json();

    expect(opcoes).toEqual([]);
  });

  it('só responde à gestão', async () => {
    const maria = await criarUsuario('Maria Souza', { role: 'familiar' });

    expect((await pedir(null)).status).toBe(401);
    expect((await pedir(await loginDe(maria))).status).toBe(403);
  });
});
