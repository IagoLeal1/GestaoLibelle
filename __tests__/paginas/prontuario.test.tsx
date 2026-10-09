// __tests__/paginas/prontuario.test.tsx
// O prontuário da criança, seguindo o desenho aprovado: uma aba por terapia (a do terapeuta marcada
// "sua"), o "Para lembrar", as anotações, escrever e corrigir, e a aba Evoluções.
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useEvolucoes } from '@/context/EvolucoesContext';
import { corrigirAnotacao, escreverAnotacao, getAnotacoes } from '@/services/prontuarioService';
import { entrarNaEquipeDaCrianca, esquecerEquipe } from '@/services/evolucaoService';
import { getPatientById } from '@/services/patientService';
import { getSessoesDaEquipe } from '@/services/diagnosticoService';
import { ProntuarioDaCrianca } from '@/components/prontuario/prontuario-da-crianca';
import type { Anotacao } from '@/lib/prontuario';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/context/EvolucoesContext', () => ({ useEvolucoes: jest.fn() }));
jest.mock('@/services/prontuarioService', () => ({ getAnotacoes: jest.fn(), escreverAnotacao: jest.fn(), corrigirAnotacao: jest.fn() }));
jest.mock('@/services/evolucaoService', () => ({ entrarNaEquipeDaCrianca: jest.fn(), esquecerEquipe: jest.fn() }));
jest.mock('@/services/patientService', () => ({ getPatientById: jest.fn() }));
jest.mock('@/services/diagnosticoService', () => ({ getSessoesDaEquipe: jest.fn() }));
jest.mock('@/components/evolucoes/folha-da-evolucao', () => ({ FolhaDaEvolucao: () => null }));
// A história de verdade lê o banco: aqui ela só conta as terapias que achou e mostra qual está filtrando
jest.mock('@/components/evolucoes/historia-da-crianca', () => ({
  HistoriaDaCrianca: ({ terapia, onTerapias }: { terapia?: string; onTerapias?: (t: string[]) => void }) => {
    useEffect(() => onTerapias?.(['Psicologia']), [onTerapias]);
    return <p>história de {terapia}</p>;
  },
}));

const nota = (id: string, extra: Partial<Anotacao> = {}): Anotacao => ({
  id, terapia: 'Fonoaudiologia', texto: `Texto ${id}`, fixada: false, autorId: 'paula', autorNome: 'Paula Fono',
  criadoEm: new Date(2026, 9, 6), ...extra,
});
const NOTAS = [
  nota('objetivo', { texto: 'Objetivo do semestre: frases de 3 palavras.', fixada: true }),
  nota('casa', { texto: 'Mãe contou que ele nomeia as cores em casa.', criadoEm: new Date(2026, 9, 5) }),
  nota('to', { terapia: 'Terapia Ocupacional', autorId: 'lia', autorNome: 'Lia TO', texto: 'Usa bem a tesoura adaptada.' }),
];

function comoTerapeuta() {
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'paula', displayName: 'Paula Fono', profile: { role: 'profissional' } } });
  (useEvolucoes as jest.Mock).mockReturnValue({
    escopo: 'terapeuta', professionalId: 'prof-paula', carregando: false,
    sessoes: [{ id: 's1', patientId: 'lucas', patientName: 'Lucas Souza', professionalId: 'prof-paula', professionalName: 'Paula', tipo: 'Fonoaudiologia', start: new Date(2026, 9, 6, 9), status: 'finalizado' }],
  });
}
function comoAdmin() {
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'ana', displayName: 'Ana Admin', profile: { role: 'admin' } } });
  (useEvolucoes as jest.Mock).mockReturnValue({ escopo: 'equipe', carregando: false, sessoes: [] });
}

beforeEach(() => {
  jest.clearAllMocks();
  (getPatientById as jest.Mock).mockResolvedValue({ id: 'lucas', fullName: 'Lucas Souza', dataNascimento: '2020-03-15' });
  (getAnotacoes as jest.Mock).mockResolvedValue(NOTAS);
  (entrarNaEquipeDaCrianca as jest.Mock).mockResolvedValue(true);
  (getSessoesDaEquipe as jest.Mock).mockResolvedValue([]);
});

const abrir = async () => {
  render(<ProntuarioDaCrianca patientId="lucas" />);
  await screen.findByRole('heading', { name: 'Lucas Souza' });
};

it('mostra a criança, as terapias (a do terapeuta primeiro) e o "Para lembrar" dela', async () => {
  comoTerapeuta();
  await abrir();

  expect(screen.getByText(/anos/)).toBeInTheDocument();
  const abas = within(screen.getByRole('group', { name: 'Terapias' })).getAllByRole('button');
  expect(abas.map((a) => a.textContent)).toEqual(['Fonoaudiologia · sua', 'Psicologia', 'Terapia Ocupacional']);
  expect(within(screen.getByRole('region', { name: 'Para lembrar' })).getByText('Objetivo do semestre: frases de 3 palavras.')).toBeInTheDocument();
  expect(within(screen.getByRole('list', { name: 'Anotações' })).getAllByRole('listitem')).toHaveLength(2);
});

it('na terapia de outro, o terapeuta lê mas não escreve', async () => {
  comoTerapeuta();
  await abrir();

  fireEvent.click(screen.getByRole('button', { name: 'Terapia Ocupacional' }));

  expect(screen.getByText('Usa bem a tesoura adaptada.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Nova anotação/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Corrigir' })).not.toBeInTheDocument();
});

it('escreve uma anotação nova e fixa em "Para lembrar"', async () => {
  comoTerapeuta();
  (escreverAnotacao as jest.Mock).mockImplementation(async (_p, _a, campos) => ({ id: 'nova', ...campos, autorId: 'paula', autorNome: 'Paula Fono', criadoEm: new Date(2026, 9, 7) }));
  await abrir();

  fireEvent.click(screen.getByRole('button', { name: /Nova anotação/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }));
  expect(screen.getByText('Escreva a anotação.')).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText('O que você quer anotar?'), { target: { value: 'Evitar barulho alto no início.' } });
  fireEvent.click(screen.getByRole('switch', { name: /Fixar em/ }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Salvar anotação' }));
  });

  expect(escreverAnotacao).toHaveBeenCalledWith('lucas', { uid: 'paula', nome: 'Paula Fono' }, {
    terapia: 'Fonoaudiologia', texto: 'Evitar barulho alto no início.', fixada: true, atendimentoId: 's1',
  });
  expect(within(screen.getByRole('region', { name: 'Para lembrar' })).getByText('Evitar barulho alto no início.')).toBeInTheDocument();
});

it('quem escreveu corrige a própria anotação', async () => {
  comoTerapeuta();
  (corrigirAnotacao as jest.Mock).mockResolvedValue(undefined);
  await abrir();

  fireEvent.click(within(screen.getByRole('list', { name: 'Anotações' })).getAllByRole('button', { name: 'Corrigir' })[1]);
  const campo = screen.getByLabelText('O que você quer anotar?');
  expect(campo).toHaveValue('Mãe contou que ele nomeia as cores em casa.');

  fireEvent.change(campo, { target: { value: 'Mãe contou que ele nomeia 6 cores em casa.' } });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Salvar correção' }));
  });

  expect(corrigirAnotacao).toHaveBeenCalledWith('lucas', 'casa', { texto: 'Mãe contou que ele nomeia 6 cores em casa.', fixada: false });
  expect(screen.getByText('Mãe contou que ele nomeia 6 cores em casa.')).toBeInTheDocument();
});

it('o admin lê tudo, sem escrever nem corrigir', async () => {
  comoAdmin();
  await abrir();

  expect(screen.queryByRole('button', { name: /Nova anotação/ })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Corrigir' })).not.toBeInTheDocument();
  expect(entrarNaEquipeDaCrianca).not.toHaveBeenCalled();
});

it('terapeuta que não atende a criança não vê o prontuário', async () => {
  comoTerapeuta();
  (entrarNaEquipeDaCrianca as jest.Mock).mockResolvedValue(false);
  render(<ProntuarioDaCrianca patientId="lucas" />);

  expect(await screen.findByText('Você só vê o prontuário das crianças que atende.')).toBeInTheDocument();
  expect(getAnotacoes).not.toHaveBeenCalled();
});

it('a aba Evoluções mostra a história daquela terapia', async () => {
  comoTerapeuta();
  await abrir();

  fireEvent.click(screen.getByRole('button', { name: 'Evoluções' }));

  expect(screen.getByText('história de Fonoaudiologia')).toBeVisible();
});

it('quando não abre (internet fraca), deixa tentar de novo', async () => {
  comoTerapeuta();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  (getAnotacoes as jest.Mock).mockRejectedValueOnce(new Error('sem internet')).mockResolvedValueOnce(NOTAS);
  render(<ProntuarioDaCrianca patientId="lucas" />);

  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

  expect(await screen.findByRole('heading', { name: 'Lucas Souza' })).toBeInTheDocument();
  expect(getAnotacoes).toHaveBeenCalledTimes(2);
  // A equipe lembrada no aparelho é conferida de novo no banco na nova tentativa
  expect(esquecerEquipe).toHaveBeenCalledWith('paula', 'lucas');
});

// ——— Topo do prontuário: diagnóstico (da ficha) e equipe (da agenda), para todos que veem o prontuário ———
it('no topo, o diagnóstico da ficha e a equipe da agenda, com a terapia de quem olha marcada "você"', async () => {
  comoTerapeuta();
  (getPatientById as jest.Mock).mockResolvedValue({
    id: 'lucas', fullName: 'Lucas Souza', dataNascimento: '2020-03-15',
    diagnosticos: [{ nome: 'TEA · nível 1', cid: 'F84.0', situacao: 'confirmado' }, { nome: 'TDAH', situacao: 'investigacao' }],
  });
  (getSessoesDaEquipe as jest.Mock).mockResolvedValue([
    { tipo: 'Fonoaudiologia', professionalId: 'prof-paula', professionalName: 'Paula Fonoaudióloga', status: 'agendado', start: new Date(2026, 9, 6, 9) },
    { tipo: 'Terapia Ocupacional', professionalId: 'prof-lia', professionalName: 'Lia Moreira', status: 'agendado', start: new Date(2026, 9, 7, 9) },
  ]);
  await abrir();

  const diagnostico = within(screen.getByRole('list', { name: 'Diagnóstico' })).getAllByRole('listitem');
  expect(diagnostico[0]).toHaveTextContent('TEA · nível 1F84.0');
  expect(diagnostico[1]).toHaveTextContent('TDAH · em investigação');
  const equipe = within(await screen.findByRole('list', { name: 'Equipe' })).getAllByRole('listitem');
  expect(equipe.map((li) => li.textContent)).toEqual(['Fonoaudiologia · você', 'Terapia Ocupacional · Lia']);
  expect(getSessoesDaEquipe).toHaveBeenCalledWith('lucas');
});

it('sem diagnóstico na ficha, avisa quem preenche', async () => {
  comoAdmin();
  await abrir();

  expect(screen.getByText(/Ainda não preenchido\. A recepção ou a coordenação preenchem na ficha da criança\./)).toBeInTheDocument();
});
