// __tests__/firebase/encaixes.test.ts
// Os encaixes do assistente: a coordenação manda para a recepção (a criança pode ainda não ter
// cadastro) ou diz "Não" com o motivo; a recepção vê, toca em "Já agendei" e pode excluir. Só a gestão
// lê e escreve; ninguém assina por outra pessoa, e depois de criado só se marca o que foi agendado.
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { addDoc, collection, doc, getDocs, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { OpcaoDeEncaixe } from '@/lib/encaixes';
import {
  contarParaAgendar, dizerNao, excluirEncaixe, listarParaAgendar, listarRecusados, mandarParaRecepcao, marcarComoAgendado,
} from '@/services/encaixeService';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, type UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;
let coordenacao: UsuarioDeTeste;
let recepcao: UsuarioDeTeste;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await limparDados();
  coordenacao = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
  recepcao = await criarUsuario('Rafa Recepção', { role: 'funcionario' });
});

const ana = { id: 'prof-ana', nome: 'Ana Costa' };
const sessao = (dia: string, horario: string, fim: string) => ({
  terapia: 'Fonoaudiologia', profissional: ana, dia, horario, fim, semanasLivres: 12, sala: null, preferida: true, comTroca: false,
});
const opcao: OpcaoDeEncaixe = {
  chave: 'opcao-1',
  sessoes: [sessao('terca', '14:10', '15:00'), { ...sessao('quinta', '14:10', '15:00'), comTroca: true }],
  troca: {
    chave: 'troca-lucas', paciente: { id: 'paciente-lucas', nome: 'Lucas Souza' }, profissional: ana, terapia: 'Fonoaudiologia',
    dia: 'quinta', de: '14:10', para: '15:00', sala: null, emendaCom: { horario: '15:50', terapia: 'Terapia Ocupacional' },
  },
  semanasLivres: 12,
  diasEmendados: [],
  faltam: [],
};
const theo = { id: 'paciente-theo', nome: 'Theo Martins' };
const autor = (u: UsuarioDeTeste) => ({ uid: u.uid, nome: u.displayName });

it('a coordenação manda para a recepção, que vê o encaixe com a data e o recado', async () => {
  await entrarComo(coordenacao);
  await mandarParaRecepcao({ paciente: theo, opcao, comecaEm: '2026-10-13', recado: ' Avisar pelo WhatsApp ', autor: autor(coordenacao) });

  await entrarComo(recepcao);
  const [encaixe] = await listarParaAgendar();

  expect(encaixe).toEqual(expect.objectContaining({
    status: 'para_agendar', paciente: theo, comecaEm: '2026-10-13', recado: 'Avisar pelo WhatsApp',
    criadoPor: { uid: coordenacao.uid, nome: 'Carla Coordenadora' },
  }));
  expect(encaixe.opcao.troca?.paciente.nome).toBe('Lucas Souza');
  expect(await contarParaAgendar()).toBe(1);
});

it('"Já agendei": o encaixe vira "Agendado" e sai da conta laranja', async () => {
  await entrarComo(coordenacao);
  await mandarParaRecepcao({ paciente: theo, opcao, comecaEm: '2026-10-13', autor: autor(coordenacao) });
  await entrarComo(recepcao);
  const [encaixe] = await listarParaAgendar();

  await marcarComoAgendado(encaixe.id);

  const [agendado] = await listarParaAgendar();
  expect(agendado.status).toBe('agendado');
  expect(agendado.agendadoEm).toBeInstanceOf(Timestamp);
  expect(await contarParaAgendar()).toBe(0);
});

it('a criança pode ainda não ter cadastro: vão o nome e o convênio', async () => {
  const nova = { id: 'sem-cadastro:laura-pires', nome: 'Laura Pires', semCadastro: true, convenio: 'Unimed' };
  await entrarComo(coordenacao);
  await mandarParaRecepcao({ paciente: nova, opcao, comecaEm: '2026-10-13', autor: autor(coordenacao) });

  await entrarComo(recepcao);
  expect((await listarParaAgendar())[0].paciente).toEqual(nova);
});

it('agendado há mais de 7 dias sai da lista', async () => {
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    await setDoc(doc(banco, 'encaixes', 'velho'), { status: 'agendado', paciente: theo, opcao, agendadoEm: Timestamp.fromMillis(Date.now() - 8 * 86400000) });
    await setDoc(doc(banco, 'encaixes', 'novo'), { status: 'agendado', paciente: theo, opcao, agendadoEm: Timestamp.fromMillis(Date.now() - 2 * 86400000) });
  });
  await entrarComo(recepcao);

  expect((await listarParaAgendar()).map((e) => e.id)).toEqual(['novo']);
  expect((await listarParaAgendar()).map((e) => e.id)).toEqual(['novo']);
});

it('o "Não" guarda o motivo e o que ele bloqueia; desfazer apaga', async () => {
  await entrarComo(coordenacao);
  const id = await dizerNao({ paciente: theo, opcao, motivo: 'familia_da_troca', texto: 'A mãe do Lucas não pode', autor: autor(coordenacao) });

  const [recusado] = await listarRecusados();
  expect(recusado).toEqual(expect.objectContaining({
    status: 'recusado',
    motivo: { tipo: 'familia_da_troca', texto: 'A mãe do Lucas não pode' },
    bloqueios: [{ tipo: 'nao_mexer', pacienteId: 'paciente-lucas' }],
  }));
  expect(await contarParaAgendar()).toBe(0);

  await excluirEncaixe(id);
  expect(await listarRecusados()).toEqual([]);
});

it('a recepção exclui um encaixe da lista', async () => {
  await entrarComo(coordenacao);
  const id = await mandarParaRecepcao({ paciente: theo, opcao, comecaEm: '2026-10-13', autor: autor(coordenacao) });

  await entrarComo(recepcao);
  await excluirEncaixe(id);

  expect(await listarParaAgendar()).toEqual([]);
});

describe('regras', () => {
  it('terapeuta e família não leem nem escrevem encaixes', async () => {
    await entrarComo(coordenacao);
    await mandarParaRecepcao({ paciente: theo, opcao, comecaEm: '2026-10-13', autor: autor(coordenacao) });

    for (const papel of ['profissional', 'familiar'] as const) {
      const pessoa = await criarUsuario(`Pessoa ${papel}`, { role: papel });
      await entrarComo(pessoa);
      await expect(getDocs(collection(db, 'encaixes'))).rejects.toThrow();
      await expect(mandarParaRecepcao({ paciente: theo, opcao, comecaEm: '2026-10-13', autor: autor(pessoa) })).rejects.toThrow();
    }
  });

  it('ninguém cria em nome de outra pessoa', async () => {
    await entrarComo(recepcao);

    await expect(mandarParaRecepcao({ paciente: theo, opcao, comecaEm: '2026-10-13', autor: autor(coordenacao) })).rejects.toThrow();
  });

  it('depois de criado, só se marca o que foi agendado', async () => {
    await entrarComo(coordenacao);
    const id = await mandarParaRecepcao({ paciente: theo, opcao, comecaEm: '2026-10-13', autor: autor(coordenacao) });
    const recusa = await dizerNao({ paciente: theo, opcao, motivo: 'outro', autor: autor(coordenacao) });

    await entrarComo(recepcao);
    await expect(updateDoc(doc(db, 'encaixes', id), { comecaEm: '2026-12-01' })).rejects.toThrow();
    await expect(updateDoc(doc(db, 'encaixes', id), { status: 'recusado' })).rejects.toThrow();
    await expect(updateDoc(doc(db, 'encaixes', recusa), { status: 'para_agendar' })).rejects.toThrow();
    await expect(addDoc(collection(db, 'encaixes'), { status: 'agendado', criadoPor: autor(recepcao) })).rejects.toThrow();
  });
});
