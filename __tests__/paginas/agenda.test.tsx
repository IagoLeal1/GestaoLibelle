// __tests__/paginas/agenda.test.tsx
// A Agenda do dia. Ela abria na data em UTC: a partir das 21h de Brasília, mostrava os agendamentos
// de amanhã. O relatório lia as datas escolhidas como meia-noite em UTC (21h da véspera em Brasília):
// de 01/10 a 31/10, trazia o dia 30/09 e deixava o 31/10 de fora.
// No celular, o terapeuta abre nas próprias sessões; o dia muda pelas setas e os filtros ficam
// guardados atrás de um botão.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { AgendamentosClientPage } from '@/components/pages/agendamentos-client-page';
import { getAppointmentsByDate, getAppointmentsForReport } from '@/services/appointmentService';
import { useAuth } from '@/context/AuthContext';

let gerarRelatorio: (professionalId: string | undefined, patientId: string | undefined, inicio: string, fim: string) => Promise<void>;

jest.mock('@/lib/firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/context/EvolucoesContext', () => ({
  useEvolucoes: () => ({ professionalId: 'prof-paula', semCadastro: false }),
}));
jest.mock('@/services/appointmentService', () => ({
  getAppointmentsByDate: jest.fn().mockResolvedValue([]),
  getAppointmentsForReport: jest.fn().mockResolvedValue([]),
  updateAppointment: jest.fn(),
  updateAppointmentBlock: jest.fn(),
  deleteAppointment: jest.fn(),
  deleteFutureAppointmentsInBlock: jest.fn(),
}));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/patientService', () => ({ getPatients: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/roomService', () => ({ getRooms: jest.fn().mockResolvedValue([]) }));
jest.mock('@/components/modals/report-modal', () => ({
  ReportModal: ({ onGenerate }: { onGenerate: typeof gerarRelatorio }) => {
    gerarRelatorio = onGenerate;
    return null;
  },
}));
jest.mock('@/components/modals/edit-appointment-modal', () => ({ EditAppointmentModal: () => null }));
jest.mock('@/components/features/RenewalNotificationButton', () => ({ RenewalNotificationButton: () => null }));

const entrarComo = (role: string) => (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: `${role}-uid`, profile: { role } } });

// Sessão do dia 01/10/2026, no formato do Firestore
const sessao = (id: string, paciente: string, professionalId: string, professionalName: string, hora: number, status = 'agendado') => ({
  id,
  patientName: paciente,
  professionalId,
  professionalName,
  tipo: 'Fonoaudiologia',
  status,
  statusSecundario: '',
  start: { toDate: () => new Date(2026, 9, 1, hora, 0) },
  end: { toDate: () => new Date(2026, 9, 1, hora, 50) },
});
const DO_DIA = [
  sessao('a', 'Bia Lima', 'prof-paula', 'Paula Fonoaudióloga', 9, 'finalizado'),
  sessao('b', 'Theo Martins', 'prof-rui', 'Rui Psicólogo', 10),
];

beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
  entrarComo('funcionario');
});
afterEach(() => jest.useRealTimers());

it('à noite, abre na agenda de hoje, não na de amanhã', async () => {
  // 22h30 no relógio do aparelho (em Brasília, já é o dia seguinte em UTC)
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 22, 30), advanceTimers: true });

  render(<AgendamentosClientPage />);

  await waitFor(() => expect(getAppointmentsByDate).toHaveBeenCalled());
  expect(getAppointmentsByDate).not.toHaveBeenCalledWith('2026-10-02');
  expect(getAppointmentsByDate).toHaveBeenCalledWith('2026-10-01');
  expect(await screen.findByDisplayValue('2026-10-01')).toBeInTheDocument();
});

it('o relatório vai do primeiro ao último dia escolhidos, no relógio da clínica', async () => {
  render(<AgendamentosClientPage />);
  await waitFor(() => expect(gerarRelatorio).toBeDefined());

  await gerarRelatorio(undefined, undefined, '2026-10-01', '2026-10-31');

  expect(getAppointmentsForReport).toHaveBeenCalledWith(
    expect.objectContaining({ startDate: new Date(2026, 9, 1), endDate: new Date(2026, 9, 31) })
  );
});

describe('no celular', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 9, 1, 10, 0), advanceTimers: true });
    (getAppointmentsByDate as jest.Mock).mockResolvedValue(DO_DIA);
  });

  it('o terapeuta abre em "Minhas sessões" e vê só as dele; em "Clínica toda", as de todos', async () => {
    entrarComo('profissional');
    render(<AgendamentosClientPage />);

    const minhas = await screen.findByRole('list', { name: 'Sessões do dia' });
    expect(within(minhas).getByText('Bia Lima')).toBeInTheDocument();
    expect(within(minhas).queryByText('Theo Martins')).not.toBeInTheDocument();
    expect(screen.getByText('1 sessão · 1 finalizada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clínica toda' }));

    const todas = screen.getByRole('list', { name: 'Sessões do dia' });
    expect(within(todas).getByText('Theo Martins')).toBeInTheDocument();
  });

  it('a recepção não tem essa escolha e vê a clínica toda', async () => {
    render(<AgendamentosClientPage />);

    const lista = await screen.findByRole('list', { name: 'Sessões do dia' });
    expect(within(lista).getByText('Theo Martins')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Minhas sessões' })).not.toBeInTheDocument();
  });

  it('as setas trocam o dia', async () => {
    render(<AgendamentosClientPage />);
    expect(await screen.findByText('Hoje')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo dia' }));

    expect(await screen.findByText('Amanhã')).toBeInTheDocument();
    await waitFor(() => expect(getAppointmentsByDate).toHaveBeenCalledWith('2026-10-02'));
  });

  it('os filtros ficam fechados atrás de um botão', async () => {
    render(<AgendamentosClientPage />);
    const botao = await screen.findByRole('button', { name: /^Filtros/ });
    expect(botao).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(botao);

    expect(botao).toHaveAttribute('aria-expanded', 'true');
  });
});
