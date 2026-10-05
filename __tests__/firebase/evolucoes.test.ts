// __tests__/firebase/evolucoes.test.ts
// O serviço das evoluções contra o emulador, com login de verdade: o terapeuta escreve, entra na
// equipe da criança e lê a história dela; a coordenação acompanha. Roda com npm run test:firebase.
import {
  apagarEvolucao, corrigirEvolucao, entrarNaEquipeDaCrianca, entrarNasEquipes, escreverEvolucao, getEvolucao, getHistoriaDaCrianca,
  getSessoesPorId, getUltimaEvolucao,
} from '@/services/evolucaoService';
import {
  criarAgendamento, criarPaciente, criarProfissional, criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados,
} from './helpers';

const CAMPOS = { aconteceu: true, trabalhado: '  Fonema /r/ com apoio visual.  ', resposta: 'Participou bem.', orientacao: '', proximaSessao: '' };

beforeAll(iniciarAmbiente);
afterAll(encerrarAmbiente);
beforeEach(limparDados);

async function montarClinica() {
  const paula = await criarUsuario('Paula Fonoaudióloga', { role: 'profissional' });
  const rui = await criarUsuario('Rui Psicólogo', { role: 'profissional' });
  const carla = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
  await criarProfissional('prof-paula', paula);
  await criarProfissional('prof-rui', rui);
  await criarPaciente('lucas', 'Lucas Souza');
  await criarAgendamento('lucas', 'prof-paula', -1);
  await criarAgendamento('lucas', 'prof-rui', -2);
  return { paula, rui, carla };
}

it('o terapeuta escreve a evolução e a coordenação lê na história da criança', async () => {
  const { paula, carla } = await montarClinica();

  await entrarComo(paula);
  await escreverEvolucao('ag-lucas-prof-paula--1', { uid: paula.uid, nome: paula.displayName }, CAMPOS);

  await entrarComo(carla);
  const { evolucoes } = await getHistoriaDaCrianca('lucas');
  expect(evolucoes).toHaveLength(1);
  expect(evolucoes[0]).toMatchObject({ autorNome: 'Paula Fonoaudióloga', professionalId: 'prof-paula', trabalhado: 'Fonema /r/ com apoio visual.' });
});

it('o terapeuta entra na equipe das crianças que atende e lê também as evoluções das outras terapias', async () => {
  const { paula, rui } = await montarClinica();
  await entrarComo(rui);
  await escreverEvolucao('ag-lucas-prof-rui--2', { uid: rui.uid, nome: rui.displayName }, CAMPOS);

  await entrarComo(paula);
  await entrarNasEquipes(paula.uid, [{ id: 'ag-lucas-prof-paula--1', patientId: 'lucas', status: 'agendado' }]);
  const { evolucoes } = await getHistoriaDaCrianca('lucas');
  expect(evolucoes.map((e) => e.autorNome)).toEqual(['Rui Psicólogo']);

  // A sessão dela, de ontem, ainda está sem evolução
  expect(await getEvolucao('lucas', 'ag-lucas-prof-paula--1')).toBeNull();
});

it('a sessão da agenda ganha a marca da evolução, e perde quando a evolução é apagada', async () => {
  const { paula } = await montarClinica();
  await entrarComo(paula);
  const sessao = 'ag-lucas-prof-paula--1';

  await escreverEvolucao(sessao, { uid: paula.uid, nome: paula.displayName }, CAMPOS);
  expect((await getSessoesPorId([sessao])).get(sessao)?.evolucao).toBe('escrita');

  await corrigirEvolucao('lucas', sessao, { ...CAMPOS, aconteceu: false });
  expect((await getSessoesPorId([sessao])).get(sessao)?.evolucao).toBe('nao_aconteceu');

  await apagarEvolucao('lucas', sessao);
  expect((await getSessoesPorId([sessao])).get(sessao)?.evolucao).toBeUndefined();
});

it('a última evolução da mesma terapia aparece para dar continuidade', async () => {
  const { paula } = await montarClinica();
  await criarAgendamento('lucas', 'prof-paula', -8);
  await entrarComo(paula);
  await escreverEvolucao('ag-lucas-prof-paula--8', { uid: paula.uid, nome: paula.displayName }, { ...CAMPOS, trabalhado: 'Sessão da semana passada.' });

  const ultima = await getUltimaEvolucao('lucas', { terapia: '', antesDe: new Date() });
  expect(ultima?.trabalhado).toBe('Sessão da semana passada.');
});

it('quem não atende a criança não entra na equipe dela', async () => {
  await montarClinica();
  const lia = await criarUsuario('Lia Terapeuta Ocupacional', { role: 'profissional' });
  await criarProfissional('prof-lia', lia);

  await entrarComo(lia);
  expect(await entrarNaEquipeDaCrianca(lia.uid, 'lucas', 'prof-lia')).toBe(false);
  await expect(getHistoriaDaCrianca('lucas')).rejects.toThrow();
});

it('corrigir deixa a evolução marcada como editada', async () => {
  const { paula } = await montarClinica();
  await entrarComo(paula);
  await escreverEvolucao('ag-lucas-prof-paula--1', { uid: paula.uid, nome: paula.displayName }, CAMPOS);

  await corrigirEvolucao('lucas', 'ag-lucas-prof-paula--1', { ...CAMPOS, trabalhado: 'Texto corrigido.' });

  const [evolucao] = (await getHistoriaDaCrianca('lucas')).evolucoes;
  expect(evolucao.trabalhado).toBe('Texto corrigido.');
  expect(evolucao.editadoEm).toBeInstanceOf(Date);
});
