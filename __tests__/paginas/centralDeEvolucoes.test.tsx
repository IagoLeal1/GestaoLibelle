// __tests__/paginas/centralDeEvolucoes.test.tsx
// A página de Evoluções do admin e da coordenação, seguindo o desenho aprovado: números coloridos que
// filtram, filtros, a lista por dia e a leitura na própria tela, uma evolução atrás da outra.
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useEvolucoes } from '@/context/EvolucoesContext';
import { getEvolucao, getUltimaEvolucao } from '@/services/evolucaoService';
import { PainelDaCoordenacao } from '@/components/evolucoes/painel-da-coordenacao';
import type { SessaoDaAgenda } from '@/lib/evolucoes';

jest.mock('@/context/EvolucoesContext', () => ({ useEvolucoes: jest.fn() }));
jest.mock('@/services/evolucaoService', () => ({ getEvolucao: jest.fn(), getUltimaEvolucao: jest.fn() }));
jest.mock('@/services/appointmentService', () => ({ getAppointmentsForReport: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/patientService', () => ({ getPatients: jest.fn().mockResolvedValue([]) }));
jest.mock('@/components/evolucoes/historia-da-crianca', () => ({ HistoriaDaCrianca: () => null }));
jest.mock('@/components/evolucoes/folha-da-evolucao', () => ({ FolhaDaEvolucao: () => null }));

const AGORA = new Date(2026, 9, 14, 18, 0);
const sessao = (id: string, hora: number, extra: Partial<SessaoDaAgenda> = {}): SessaoDaAgenda => ({
  id,
  patientId: `p-${id}`,
  patientName: 'Lucas Souza',
  professionalId: 'paula',
  professionalName: 'Paula Fonoaudióloga',
  tipo: 'Fonoaudiologia',
  start: new Date(2026, 9, 14, hora, 0),
  end: new Date(2026, 9, 14, hora, 50),
  status: 'agendado',
  ...extra,
});
const SESSOES = [
  sessao('a', 9, { evolucao: 'escrita' }),
  sessao('b', 10, { patientName: 'Bia Lima', professionalId: 'rui', professionalName: 'Rui Psicólogo', tipo: 'Psicologia', evolucao: 'escrita' }),
  sessao('c', 14, { patientName: 'Davi Rocha', professionalId: 'lia', professionalName: 'Lia TO', tipo: 'Terapia Ocupacional' }),
];

const evolucao = (texto: string) => ({
  appointmentId: 'a', patientId: 'p-a', patientName: 'Lucas Souza', professionalId: 'paula', professionalName: 'Paula Fonoaudióloga',
  terapia: 'Fonoaudiologia', dataDaSessao: new Date(2026, 9, 14, 9), autorId: 'u', autorNome: 'Paula Fonoaudióloga', aconteceu: true, texto,
  criadoEm: new Date(2026, 9, 14, 9, 52),
});

function telaLarga(larga: boolean) {
  window.matchMedia = jest.fn().mockImplementation(() => ({
    matches: larga, addEventListener: jest.fn(), removeEventListener: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  telaLarga(true);
  (useEvolucoes as jest.Mock).mockReturnValue({
    pedirAgenda: jest.fn(),
    escopo: 'equipe', carregando: false, erro: false, sessoes: SESSOES, agora: AGORA, desde: new Date(2026, 9, 6),
  });
  (getEvolucao as jest.Mock).mockReset().mockResolvedValue(evolucao('Trabalhamos frases com o livro de figuras.'));
  (getUltimaEvolucao as jest.Mock).mockReset().mockResolvedValue(null);
});

const lista = () => screen.getByRole('list', { name: 'Sessões' });

it('mostra quantas estão escritas e pendentes, e a situação de cada sessão', () => {
  render(<PainelDaCoordenacao />);

  expect(screen.getByRole('button', { name: /2 Escritas/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /1 Pendentes/ })).toBeInTheDocument();
  expect(within(lista()).getAllByRole('button')).toHaveLength(3);
  expect(within(lista()).getByRole('button', { name: /Davi Rocha/ })).toHaveTextContent('Pendente');
});

it('tocar num número filtra a lista; tocar de novo volta a mostrar tudo', () => {
  render(<PainelDaCoordenacao />);
  const pendentes = screen.getByRole('button', { name: /1 Pendentes/ });

  fireEvent.click(pendentes);
  expect(pendentes).toHaveAttribute('aria-pressed', 'true');
  expect(within(lista()).getAllByRole('button').map((b) => b.textContent)).toEqual([expect.stringContaining('Davi Rocha')]);

  fireEvent.click(pendentes);
  expect(within(lista()).getAllByRole('button')).toHaveLength(3);
});

it('a busca acha a criança pelo nome', () => {
  render(<PainelDaCoordenacao />);

  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar criança' }), { target: { value: 'bia' } });

  expect(within(lista()).getAllByRole('button')).toHaveLength(1);
  expect(within(lista()).getByRole('button', { name: /Bia Lima/ })).toBeInTheDocument();
});

it('abrir uma sessão mostra a evolução ao lado e as setas passam para a próxima da lista', async () => {
  render(<PainelDaCoordenacao />);

  fireEvent.click(within(lista()).getByRole('button', { name: /Lucas Souza/ }));
  const leitura = screen.getByRole('region', { name: 'Leitura da evolução' });
  expect(await within(leitura).findByText('Trabalhamos frases com o livro de figuras.')).toBeInTheDocument();
  expect(getEvolucao).toHaveBeenCalledWith('p-a', 'a');
  expect(within(leitura).getByText('1 de 3 nesta lista')).toBeInTheDocument();

  (getEvolucao as jest.Mock).mockResolvedValue(evolucao('Brincadeira simbólica com a casinha.'));
  fireEvent.click(within(leitura).getByRole('button', { name: /Próxima/ }));

  const seguinte = screen.getByRole('region', { name: 'Leitura da evolução' });
  expect(await within(seguinte).findByText('Brincadeira simbólica com a casinha.')).toBeInTheDocument();
  expect(within(seguinte).getByRole('heading', { name: 'Bia Lima' })).toBeInTheDocument();
  expect(within(seguinte).getByText('2 de 3 nesta lista')).toBeInTheDocument();
});

it('sessão pendente avisa que ainda não tem evolução, sem ler o banco', async () => {
  render(<PainelDaCoordenacao />);

  fireEvent.click(within(lista()).getByRole('button', { name: /Davi Rocha/ }));

  const leitura = screen.getByRole('region', { name: 'Leitura da evolução' });
  expect(within(leitura).getByText('Ainda sem evolução.')).toBeInTheDocument();
  await act(async () => {});
  expect(getEvolucao).not.toHaveBeenCalled();
});

it('no celular, a página abre pelos terapeutas, e tocar num deles mostra as sessões dele', () => {
  telaLarga(false);
  render(<PainelDaCoordenacao />);

  expect(screen.queryByRole('list', { name: 'Sessões' })).not.toBeInTheDocument();
  const terapeutas = screen.getByRole('region', { name: 'Terapeutas' });
  // Quem tem pendência vem primeiro
  expect(within(terapeutas).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
    'Lia TO: 1 pendente, 0 em dia',
    'Paula Fonoaudióloga: 0 pendentes, 1 em dia',
    'Rui Psicólogo: 0 pendentes, 1 em dia',
  ]);

  fireEvent.click(within(terapeutas).getByRole('button', { name: /Paula/ }));

  expect(within(lista()).getAllByRole('button')).toHaveLength(1);
  expect(within(lista()).getByRole('button', { name: /Lucas Souza/ })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /Todos os terapeutas/ }));
  expect(screen.getByRole('region', { name: 'Terapeutas' })).toBeInTheDocument();
});

it('no celular, tocar num número também abre a lista, e a leitura abre numa folha', async () => {
  telaLarga(false);
  render(<PainelDaCoordenacao />);

  fireEvent.click(screen.getByRole('button', { name: /2 Escritas/ }));
  fireEvent.click(within(lista()).getByRole('button', { name: /Lucas Souza/ }));

  const folha = await screen.findByRole('dialog');
  await waitFor(() => expect(within(folha).getByText('Trabalhamos frases com o livro de figuras.')).toBeInTheDocument());
});

it('a lista mostra 20 sessões de cada vez', () => {
  const muitas = Array.from({ length: 25 }, (_, i) => sessao(`m${i}`, 9, { start: new Date(2026, 9, 14, 8, i), end: new Date(2026, 9, 14, 8, i + 1), evolucao: 'escrita' }));
  (useEvolucoes as jest.Mock).mockReturnValue({
    pedirAgenda: jest.fn(),
    escopo: 'equipe', carregando: false, erro: false, sessoes: muitas, agora: AGORA, desde: new Date(2026, 9, 6),
  });
  render(<PainelDaCoordenacao />);

  expect(within(lista()).getAllByRole('button')).toHaveLength(20);
  fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais 5' }));
  expect(within(lista()).getAllByRole('button')).toHaveLength(25);
  expect(screen.queryByRole('button', { name: /Mostrar mais/ })).not.toBeInTheDocument();
});
