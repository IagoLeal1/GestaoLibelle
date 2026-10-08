// __tests__/paginas/listaDeProntuarios.test.tsx
// "Prontuários" no menu, seguindo o desenho aprovado: o terapeuta vê as crianças da agenda dele (sem ler
// nada a mais do banco); a coordenação e o admin, todas as crianças ativas, com idade e responsável.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useAuth } from '@/context/AuthContext';
import { useEvolucoes } from '@/context/EvolucoesContext';
import { getPatients } from '@/services/patientService';
import { ListaDeProntuarios } from '@/components/prontuario/lista-de-prontuarios';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/context/EvolucoesContext', () => ({ useEvolucoes: jest.fn() }));
jest.mock('@/services/patientService', () => ({ getPatients: jest.fn() }));

const AGORA = new Date(2026, 9, 8, 10, 0);
const sessao = (patientId: string, patientName: string, tipo: string, dia = 9, hora = 9) => ({
  id: `${patientId}-${tipo}-${dia}`, patientId, patientName, professionalId: 'prof-paula', professionalName: 'Paula',
  tipo, start: new Date(2026, 9, dia, hora), end: new Date(2026, 9, dia, hora, 50), status: 'agendado',
});

beforeEach(() => jest.clearAllMocks());

it('o terapeuta vê as crianças que atende, quem tem sessão mais cedo primeiro, e cada uma abre o prontuário', () => {
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'paula', profile: { role: 'profissional' } } });
  (useEvolucoes as jest.Mock).mockReturnValue({
    escopo: 'terapeuta', carregando: false, agora: AGORA,
    sessoes: [sessao('lucas', 'Lucas Souza', 'Fonoaudiologia', 9, 9), sessao('bia', 'Bia Lima', 'Fonoaudiologia', 8, 14)],
  });
  render(<ListaDeProntuarios />);

  expect(screen.getByRole('button', { name: /1 Sessões hoje/ })).toBeInTheDocument();
  const links = within(screen.getByRole('region', { name: 'Crianças' })).getAllByRole('link');
  expect(links.map((l) => l.textContent)).toEqual([
    expect.stringContaining('Hoje às 14:00'),
    expect.stringContaining('Próxima: sex, 09/10 · 09:00'),
  ]);
  expect(links[1]).toHaveAttribute('href', '/prontuario/lucas?terapia=Fonoaudiologia');
  expect(getPatients).not.toHaveBeenCalled();
});

it('a coordenação e o admin veem todas as crianças ativas, com idade e responsável, e buscam sem acento', async () => {
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'ana', profile: { role: 'admin' } } });
  (useEvolucoes as jest.Mock).mockReturnValue({ escopo: 'equipe', carregando: false, agora: AGORA, sessoes: [] });
  (getPatients as jest.Mock).mockResolvedValue([
    { id: 'lucas', fullName: 'Lucas Souza', dataNascimento: '2019-05-10', responsavel: { nome: 'Maria Souza' } },
    { id: 'luiza', fullName: 'Luíza Mendes', dataNascimento: '2021-01-02', responsavel: { nome: 'Carla Mendes' } },
    { id: 'bia', fullName: 'Bia Lima', dataNascimento: '2020-03-15', responsavel: { nome: 'João Lima' } },
  ]);
  render(<ListaDeProntuarios />);

  expect(await screen.findByRole('link', { name: /Lucas Souza/ })).toHaveTextContent('Resp.: Maria Souza');
  expect(getPatients).toHaveBeenCalledWith('ativo');
  // Separadas pela primeira letra do nome, para achar rolando
  expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['B', 'L']);

  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar criança' }), { target: { value: 'lui' } });

  expect(within(screen.getByRole('region', { name: 'Crianças' })).getAllByRole('link')).toHaveLength(1);
  expect(screen.getByText('1 de 3 crianças')).toBeInTheDocument();
});

it('busca sem resultado avisa', () => {
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'paula', profile: { role: 'profissional' } } });
  (useEvolucoes as jest.Mock).mockReturnValue({ escopo: 'terapeuta', carregando: false, agora: AGORA, sessoes: [sessao('lucas', 'Lucas Souza', 'Fonoaudiologia')] });
  render(<ListaDeProntuarios />);

  fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar criança' }), { target: { value: 'zzz' } });

  expect(screen.getByText('Nenhuma criança encontrada.')).toBeInTheDocument();
});
