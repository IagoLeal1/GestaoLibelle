// __tests__/paginas/agenda.test.tsx
// A Agenda do dia. Ela abria na data em UTC: a partir das 21h de Brasília, mostrava os agendamentos
// de amanhã. O relatório lia as datas escolhidas como meia-noite em UTC (21h da véspera em Brasília):
// de 01/10 a 31/10, trazia o dia 30/09 e deixava o 31/10 de fora.
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AgendamentosClientPage } from '@/components/pages/agendamentos-client-page';
import { getAppointmentsByDate, getAppointmentsForReport } from '@/services/appointmentService';

let gerarRelatorio: (professionalId: string | undefined, patientId: string | undefined, inicio: string, fim: string) => Promise<void>;

jest.mock('@/lib/firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ firestoreUser: { uid: 'recepcao-uid', profile: { role: 'funcionario' } } }),
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

beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
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
