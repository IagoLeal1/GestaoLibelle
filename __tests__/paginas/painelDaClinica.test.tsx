// __tests__/paginas/painelDaClinica.test.tsx
// O painel da clínica (admin, coordenação e recepção). A lista de agendamentos do dia usava a data
// em UTC: a partir das 21h de Brasília, mostrava os agendamentos de amanhã.
import { render, waitFor } from '@testing-library/react';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { getAppointmentsByDate } from '@/services/appointmentService';

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ firestoreUser: { displayName: 'Carla Coordenadora', profile: { role: 'coordenador' } } }),
}));
jest.mock('@/services/appointmentService', () => ({ getAppointmentsByDate: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/roomService', () => ({ getRooms: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/dashboardService', () => ({
  getAdminDashboardStats: jest.fn().mockResolvedValue({ activePatients: 0, activeProfessionals: 0, appointmentsToday: 0, pendingUsers: 0 }),
}));
jest.mock('@/components/dashboard/communications-widget', () => ({ CommunicationsWidget: () => null }));

afterEach(() => jest.useRealTimers());

it('à noite, mostra os agendamentos de hoje, não os de amanhã', async () => {
  // 22h30 no relógio do aparelho (em Brasília, já é o dia seguinte em UTC)
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 22, 30), advanceTimers: true });

  render(<AdminDashboard />);

  await waitFor(() => expect(getAppointmentsByDate).toHaveBeenCalledWith('2026-10-01'));
});
