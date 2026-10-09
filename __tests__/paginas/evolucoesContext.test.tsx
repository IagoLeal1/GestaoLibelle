// __tests__/paginas/evolucoesContext.test.tsx
// Para gastar menos leituras do banco: o admin e a coordenação não carregam mais a agenda da clínica
// inteira só por abrir o site. Ela só é lida quando uma tela pede (Evoluções, ou o Início sem um número
// recente), e o aparelho guarda por 15 minutos só o número de evoluções atrasadas, sem nome de criança.
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useAuth } from '@/context/AuthContext';
import { getAppointmentsByProfessionalInRange, getAppointmentsForReport } from '@/services/appointmentService';
import { EvolucoesProvider, useEvolucoes } from '@/context/EvolucoesContext';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/appointmentService', () => ({
  getAppointmentsForReport: jest.fn(),
  getAppointmentsByProfessionalInRange: jest.fn(),
}));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn() }));
jest.mock('@/services/evolucaoService', () => ({
  entrarNasEquipes: jest.fn().mockResolvedValue(undefined),
  sessaoDaAgenda: (a: { start: { toDate: () => Date }; end?: { toDate: () => Date } }) => ({ ...a, start: a.start.toDate(), end: a.end?.toDate() }),
}));

const AGORA = new Date(2026, 9, 8, 10, 0);
const sessao = (id: string, dia: number, hora: number) => {
  const inicio = new Date(2026, 9, dia, hora);
  return {
    id, patientId: `crianca-${id}`, patientName: 'Criança', professionalId: 'prof-paula', professionalName: 'Paula', tipo: 'Fonoaudiologia',
    status: 'finalizado', start: { toDate: () => inicio }, end: { toDate: () => new Date(inicio.getTime() + 50 * 60000) },
  };
};
// Uma de anteontem (atrasada) e uma de hoje cedo (ainda não atrasada)
const AGENDA = [sessao('a', 6, 9), sessao('b', 8, 8)];
const CHAVE = 'libelle:evolucoes-atrasadas:ana';

function Mostra() {
  const { atrasadas, pedirAgenda } = useEvolucoes();
  return (
    <div>
      <p>{atrasadas === null ? 'sem número' : `atrasadas: ${atrasadas}`}</p>
      <button onClick={pedirAgenda}>pedir</button>
    </div>
  );
}

const abrirComo = async (role: string, uid = 'ana') => {
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid, profile: { role, professionalId: role === 'profissional' ? 'prof-paula' : undefined } } });
  render(<EvolucoesProvider><Mostra /></EvolucoesProvider>);
  await act(async () => {});
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: AGORA, advanceTimers: true });
  localStorage.clear();
  (getAppointmentsForReport as jest.Mock).mockResolvedValue(AGENDA);
  (getAppointmentsByProfessionalInRange as jest.Mock).mockResolvedValue(AGENDA);
});
afterEach(() => jest.useRealTimers());

it('o admin e a coordenação não carregam a agenda da clínica só por abrir o site', async () => {
  await abrirComo('admin');

  expect(getAppointmentsForReport).not.toHaveBeenCalled();
  expect(screen.getByText('sem número')).toBeInTheDocument();
});

it('quando uma tela pede, carrega uma vez só e guarda no aparelho apenas o número de atrasadas', async () => {
  await abrirComo('coordenador');

  fireEvent.click(screen.getByRole('button', { name: 'pedir' }));
  expect(await screen.findByText('atrasadas: 1')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'pedir' }));
  await act(async () => {});

  expect(getAppointmentsForReport).toHaveBeenCalledTimes(1);
  const guardado = JSON.parse(localStorage.getItem(CHAVE)!);
  expect(guardado).toEqual({ n: 1, em: expect.any(Number) });
  expect(Math.abs(guardado.em - AGORA.getTime())).toBeLessThan(1000);
});

it('com um número guardado há menos de 15 minutos, mostra ele sem ler o banco', async () => {
  localStorage.setItem(CHAVE, JSON.stringify({ n: 4, em: AGORA.getTime() - 10 * 60000 }));

  await abrirComo('admin');

  expect(screen.getByText('atrasadas: 4')).toBeInTheDocument();
  expect(getAppointmentsForReport).not.toHaveBeenCalled();
});

it('um número guardado há mais de 15 minutos, ou de outra pessoa, não vale', async () => {
  localStorage.setItem(CHAVE, JSON.stringify({ n: 4, em: AGORA.getTime() - 16 * 60000 }));
  localStorage.setItem('libelle:evolucoes-atrasadas:outra', JSON.stringify({ n: 9, em: AGORA.getTime() }));

  await abrirComo('admin');

  expect(screen.getByText('sem número')).toBeInTheDocument();
});

it('o terapeuta continua carregando a própria agenda ao abrir (o menu mostra as pendentes dele)', async () => {
  await abrirComo('profissional', 'paula');

  expect(getAppointmentsByProfessionalInRange).toHaveBeenCalledTimes(1);
  expect(getAppointmentsForReport).not.toHaveBeenCalled();
});
