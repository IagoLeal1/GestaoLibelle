// __tests__/paginas/painelDaClinica.test.tsx
// O painel da clínica (admin, coordenação e recepção). A lista de agendamentos do dia usava a data
// em UTC: a partir das 21h de Brasília, mostrava os agendamentos de amanhã. Ela também mostrava os
// 5 primeiros do dia contando da meia-noite, e o cartão de aprovações aparecia para quem não aprova.
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { getAppointmentsByDate } from '@/services/appointmentService';
import { getAdminDashboardStats } from '@/services/dashboardService';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/appointmentService', () => ({ getAppointmentsByDate: jest.fn() }));
jest.mock('@/services/roomService', () => ({ getRooms: jest.fn().mockResolvedValue([{ id: 'k2Xb9', name: 'Sala Azul' }]) }));
jest.mock('@/services/dashboardService', () => ({ getAdminDashboardStats: jest.fn() }));
jest.mock('@/components/dashboard/communications-widget', () => ({ CommunicationsWidget: () => null }));

const entrarComo = (role: string) =>
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { displayName: 'Carla Coordenadora', profile: { role } } });

// Sessão de 50 minutos no dia 05/10/2026, no formato do Firestore
const atendimento = (paciente: string, hora: number, status = 'agendado', extra: Record<string, unknown> = {}) => {
  const inicio = new Date(2026, 9, 5, hora, 0);
  return {
    id: paciente,
    patientName: paciente,
    professionalName: 'Paula Fonoaudióloga',
    tipo: 'Fonoaudiologia',
    status,
    start: { toDate: () => inicio },
    end: { toDate: () => new Date(inicio.getTime() + 50 * 60 * 1000) },
    ...extra,
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  entrarComo('coordenador');
  (getAppointmentsByDate as jest.Mock).mockResolvedValue([]);
  (getAdminDashboardStats as jest.Mock).mockResolvedValue({ activePatients: 12, activeProfessionals: 5, pendingUsers: 2 });
});
afterEach(() => jest.useRealTimers());

it('à noite, mostra os agendamentos de hoje, não os de amanhã', async () => {
  // 22h30 no relógio do aparelho (em Brasília, já é o dia seguinte em UTC)
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 22, 30), advanceTimers: true });

  render(<AdminDashboard />);

  await waitFor(() => expect(getAppointmentsByDate).toHaveBeenCalledWith('2026-10-01'));
});

it('a lista começa do agora: quem já foi atendido sai, quem está em sessão aparece em "Agora"', async () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 5, 10, 20), advanceTimers: true });
  (getAppointmentsByDate as jest.Mock).mockResolvedValue([
    atendimento('Ana', 8, 'finalizado'),
    atendimento('Bia', 9),
    atendimento('Caio', 10, 'em_atendimento', { sala: 'k2Xb9' }),
    atendimento('Davi', 14),
    atendimento('Eva', 15, 'cancelado'),
  ]);

  render(<AdminDashboard />);

  const agora = await screen.findByRole('region', { name: 'Agora' });
  expect(within(agora).getByText('Caio')).toBeInTheDocument();
  expect(within(agora).getByText('Paula Fonoaudióloga · Sala Azul')).toBeInTheDocument();
  expect(within(screen.getByRole('region', { name: 'A seguir' })).getByText('Davi')).toBeInTheDocument();
  for (const fora of ['Ana', 'Bia', 'Eva']) expect(screen.queryByText(fora)).not.toBeInTheDocument();
});

it('"Atendimentos hoje" conta o dia inteiro, sem os cancelados', async () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 5, 16, 0), advanceTimers: true });
  (getAppointmentsByDate as jest.Mock).mockResolvedValue([
    atendimento('Ana', 8, 'finalizado'),
    atendimento('Bia', 9, 'nao_compareceu'),
    atendimento('Caio', 10, 'cancelado'),
    atendimento('Davi', 17),
  ]);

  render(<AdminDashboard />);

  const numero = await screen.findByRole('group', { name: 'Atendimentos hoje' });
  await waitFor(() => expect(numero).toHaveTextContent('3'));
});

it('o admin vê os pedidos de acesso, e o aviso leva à tela de aprovação', async () => {
  entrarComo('admin');

  render(<AdminDashboard />);

  const aviso = await screen.findByRole('link', { name: /2 pedidos de acesso/ });
  expect(aviso).toHaveAttribute('href', '/admin/usuarios');
  expect(getAdminDashboardStats).toHaveBeenCalledWith({ comAprovacoes: true });
});

it.each(['coordenador', 'funcionario'])('%s não vê pedidos de acesso, que só o admin aprova', async (papel) => {
  entrarComo(papel);
  (getAdminDashboardStats as jest.Mock).mockResolvedValue({ activePatients: 12, activeProfessionals: 5, pendingUsers: 0 });

  render(<AdminDashboard />);

  await screen.findByRole('group', { name: 'Pacientes ativos' });
  expect(getAdminDashboardStats).toHaveBeenCalledWith({ comAprovacoes: false });
  expect(screen.queryByText(/pedido.* de acesso/)).not.toBeInTheDocument();
});
