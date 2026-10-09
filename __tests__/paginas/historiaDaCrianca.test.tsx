// __tests__/paginas/historiaDaCrianca.test.tsx
// A história das evoluções de uma criança (aba Evoluções do prontuário): dentro do prontuário ela não
// confere de novo se o terapeuta atende a criança, e quando demora ou dá erro, avisa e deixa tentar de novo.
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from '@/context/AuthContext';
import { useEvolucoes } from '@/context/EvolucoesContext';
import { entrarNaEquipeDaCrianca, getHistoriaDaCrianca, getSessoesPorId } from '@/services/evolucaoService';
import { HistoriaDaCrianca } from '@/components/evolucoes/historia-da-crianca';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/context/EvolucoesContext', () => ({ useEvolucoes: jest.fn() }));
jest.mock('@/services/evolucaoService', () => ({
  entrarNaEquipeDaCrianca: jest.fn(),
  esquecerEquipe: jest.fn(),
  getHistoriaDaCrianca: jest.fn(),
  getSessoesPorId: jest.fn(),
}));

const EVOLUCAO = {
  appointmentId: 's1', patientId: 'lucas', patientName: 'Lucas Souza', professionalId: 'prof-paula', professionalName: 'Paula',
  terapia: 'Fonoaudiologia', dataDaSessao: new Date(2026, 9, 6, 9), autorId: 'paula', autorNome: 'Paula', aconteceu: true,
  texto: 'Fonema /r/ com espelho.',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'paula' } });
  (useEvolucoes as jest.Mock).mockReturnValue({ escopo: 'terapeuta', professionalId: 'prof-paula' });
  (entrarNaEquipeDaCrianca as jest.Mock).mockResolvedValue(true);
  (getSessoesPorId as jest.Mock).mockResolvedValue(new Map());
});
afterEach(() => jest.useRealTimers());

it('dentro do prontuário, não confere de novo a equipe e já busca as evoluções', async () => {
  (getHistoriaDaCrianca as jest.Mock).mockResolvedValue({ evolucoes: [EVOLUCAO], ultimo: null, temMais: false });
  render(<HistoriaDaCrianca patientId="lucas" onAbrir={jest.fn()} equipeConferida />);

  expect(await screen.findByText('Fonema /r/ com espelho.')).toBeInTheDocument();
  expect(entrarNaEquipeDaCrianca).not.toHaveBeenCalled();
});

it('fora do prontuário, o terapeuta continua sendo conferido na equipe', async () => {
  (getHistoriaDaCrianca as jest.Mock).mockResolvedValue({ evolucoes: [EVOLUCAO], ultimo: null, temMais: false });
  render(<HistoriaDaCrianca patientId="lucas" onAbrir={jest.fn()} />);

  await screen.findByText('Fonema /r/ com espelho.');
  expect(entrarNaEquipeDaCrianca).toHaveBeenCalledWith('paula', 'lucas', 'prof-paula');
});

it('quando demora, avisa e deixa tentar de novo', async () => {
  jest.useFakeTimers();
  (getHistoriaDaCrianca as jest.Mock)
    .mockReturnValueOnce(new Promise(() => {})) // a primeira busca não volta nunca
    .mockResolvedValueOnce({ evolucoes: [EVOLUCAO], ultimo: null, temMais: false });
  render(<HistoriaDaCrianca patientId="lucas" onAbrir={jest.fn()} equipeConferida />);

  expect(screen.queryByText(/Está demorando/)).not.toBeInTheDocument();
  await act(async () => {
    jest.advanceTimersByTime(8000);
  });
  expect(screen.getByText(/Está demorando/)).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
  });

  expect(screen.getByText('Fonema /r/ com espelho.')).toBeInTheDocument();
  expect(getHistoriaDaCrianca).toHaveBeenCalledTimes(2);
});

it('quando dá erro, avisa e deixa tentar de novo', async () => {
  (getHistoriaDaCrianca as jest.Mock)
    .mockRejectedValueOnce(new Error('sem internet'))
    .mockResolvedValueOnce({ evolucoes: [EVOLUCAO], ultimo: null, temMais: false });
  jest.spyOn(console, 'error').mockImplementation(() => {});
  render(<HistoriaDaCrianca patientId="lucas" onAbrir={jest.fn()} equipeConferida />);

  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }));

  expect(await screen.findByText('Fonema /r/ com espelho.')).toBeInTheDocument();
});
