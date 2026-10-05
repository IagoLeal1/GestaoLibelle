// __tests__/paginas/folhaDaEvolucao.test.tsx
// A folha onde o terapeuta escreve a evolução: um campo só, "O que aconteceu na sessão", como no
// papel; em cima, a última evolução da mesma terapia, para dar continuidade.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FolhaDaEvolucao } from '@/components/evolucoes/folha-da-evolucao';
import { useEvolucoes } from '@/context/EvolucoesContext';
import { escreverEvolucao, getUltimaEvolucao } from '@/services/evolucaoService';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ firestoreUser: { uid: 'paula-uid', displayName: 'Paula Fonoaudióloga', profile: { role: 'profissional' } } }),
}));
jest.mock('@/context/EvolucoesContext', () => ({ useEvolucoes: jest.fn() }));
jest.mock('@/services/evolucaoService', () => ({
  escreverEvolucao: jest.fn().mockResolvedValue({}),
  corrigirEvolucao: jest.fn(),
  apagarEvolucao: jest.fn(),
  getEvolucao: jest.fn(),
  getUltimaEvolucao: jest.fn(),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const marcar = jest.fn();
const SESSAO = {
  id: 'sessao-theo',
  patientId: 'paciente-theo',
  patientName: 'Theo Martins',
  professionalId: 'prof-paula',
  professionalName: 'Paula Fonoaudióloga',
  tipo: 'Fonoaudiologia',
  start: new Date(2026, 9, 3, 15, 0),
  end: new Date(2026, 9, 3, 15, 50),
  status: 'agendado',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useEvolucoes as jest.Mock).mockReturnValue({ escopo: 'terapeuta', professionalId: 'prof-paula', marcar });
  (getUltimaEvolucao as jest.Mock).mockResolvedValue(null);
});

it('a evolução é um campo só, e salvar grava o texto e marca a sessão', async () => {
  render(<FolhaDaEvolucao alvo={{ sessao: SESSAO }} onFechar={jest.fn()} />);

  fireEvent.change(await screen.findByLabelText('O que aconteceu na sessão'), {
    target: { value: 'Fonema /r/ com espelho. Acertou 7 de 10. Treinar em casa.' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar evolução' }));

  await waitFor(() =>
    expect(escreverEvolucao).toHaveBeenCalledWith(
      'sessao-theo',
      { uid: 'paula-uid', nome: 'Paula Fonoaudióloga' },
      { aconteceu: true, texto: 'Fonema /r/ com espelho. Acertou 7 de 10. Treinar em casa.' }
    )
  );
  expect(marcar).toHaveBeenCalledWith('sessao-theo', 'escrita');
  expect(screen.getAllByRole('textbox')).toHaveLength(1);
});

it('sem texto, avisa e não salva', async () => {
  render(<FolhaDaEvolucao alvo={{ sessao: SESSAO }} onFechar={jest.fn()} />);

  fireEvent.click(await screen.findByRole('button', { name: 'Salvar evolução' }));

  expect(await screen.findByText('Escreva o que aconteceu na sessão.')).toBeInTheDocument();
  expect(escreverEvolucao).not.toHaveBeenCalled();
});

it('em cima, a última evolução da mesma terapia', async () => {
  (getUltimaEvolucao as jest.Mock).mockResolvedValue({
    terapia: 'Fonoaudiologia',
    dataDaSessao: new Date(2026, 8, 26, 15, 0),
    aconteceu: true,
    texto: 'Começamos o fonema /r/ em sílabas.',
  });

  render(<FolhaDaEvolucao alvo={{ sessao: SESSAO }} onFechar={jest.fn()} />);

  expect(await screen.findByText('Última evolução · 26/09')).toBeInTheDocument();
  expect(screen.getByText('Começamos o fonema /r/ em sílabas.')).toBeInTheDocument();
  expect(getUltimaEvolucao).toHaveBeenCalledWith('paciente-theo', { terapia: 'Fonoaudiologia', antesDe: SESSAO.start });
});
