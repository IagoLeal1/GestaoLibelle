// __tests__/paginas/painelDoTerapeuta.test.tsx
// O painel do terapeuta. Ele usava a data em UTC (depois das 21h mostrava a agenda de amanhã),
// mostrava só os 5 primeiros do dia contando da meia-noite, e conta antiga, sem o código do
// profissional no perfil, via sempre "Nenhum agendamento para você hoje".
import '@testing-library/jest-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import { ProfessionalDashboard } from '@/components/dashboards/ProfessionalDashboard';
import { useAuth } from '@/context/AuthContext';
import { getAppointmentsByProfessional } from '@/services/appointmentService';
import { getProfessionals } from '@/services/professionalService';
import { useEvolucoes } from '@/context/EvolucoesContext';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/appointmentService', () => ({ getAppointmentsByProfessional: jest.fn() }));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn() }));
jest.mock('@/services/roomService', () => ({ getRooms: jest.fn().mockResolvedValue([]) }));
jest.mock('@/components/dashboard/communications-widget', () => ({ CommunicationsWidget: () => null }));
jest.mock('@/context/EvolucoesContext', () => ({ useEvolucoes: jest.fn() }));

const entrarComo = (uid: string, profile: Record<string, unknown>) =>
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid, displayName: 'Paula Fonoaudióloga', profile: { role: 'profissional', ...profile } } });

// Sessão de 50 minutos no dia 05/10/2026, no formato do Firestore
const atendimento = (paciente: string, hora: number, status = 'agendado') => {
  const inicio = new Date(2026, 9, 5, hora, 0);
  return {
    id: paciente,
    patientName: paciente,
    tipo: 'Fonoaudiologia',
    status,
    start: { toDate: () => inicio },
    end: { toDate: () => new Date(inicio.getTime() + 50 * 60 * 1000) },
  };
};

/** De quem o painel buscou a agenda. */
const agendaBuscada = () => (getAppointmentsByProfessional as jest.Mock).mock.calls.map(([id]) => id);

beforeEach(() => {
  jest.clearAllMocks();
  (useEvolucoes as jest.Mock).mockReturnValue({ pendentes: [] });
  entrarComo('paula-uid', { professionalId: 'prof-paula' });
  (getAppointmentsByProfessional as jest.Mock).mockResolvedValue([]);
  (getProfessionals as jest.Mock).mockResolvedValue([
    { id: 'prof-paula', fullName: 'Paula Fonoaudióloga', status: 'ativo', userId: 'paula-uid' },
    { id: 'prof-rui', fullName: 'Rui Psicólogo', status: 'ativo', userId: 'rui-uid' },
  ]);
});
afterEach(() => jest.useRealTimers());

it('à noite, mostra os atendimentos de hoje, não os de amanhã', async () => {
  // 22h30 no relógio do aparelho (em Brasília, já é o dia seguinte em UTC)
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 22, 30), advanceTimers: true });

  render(<ProfessionalDashboard />);

  await waitFor(() => expect(getAppointmentsByProfessional).toHaveBeenCalledWith('prof-paula', '2026-10-01'));
});

it('à tarde, mostra os atendimentos da tarde, não os 5 primeiros da manhã', async () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 5, 13, 0), advanceTimers: true });
  (getAppointmentsByProfessional as jest.Mock).mockResolvedValue(
    [8, 9, 10, 11, 14, 15, 16, 17].map((hora) => atendimento(`Criança das ${hora}h`, hora, hora < 13 ? 'finalizado' : 'agendado'))
  );

  render(<ProfessionalDashboard />);

  const aSeguir = await screen.findByRole('region', { name: 'A seguir' });
  for (const hora of [14, 15, 16, 17]) expect(within(aSeguir).getByText(`Criança das ${hora}h`)).toBeInTheDocument();
  expect(screen.queryByText('Criança das 8h')).not.toBeInTheDocument();
});

it('conta antiga, sem o código do profissional no perfil, é achada pelo cadastro', async () => {
  entrarComo('rui-uid', {});

  render(<ProfessionalDashboard />);

  await waitFor(() => expect(agendaBuscada()).toEqual(['prof-rui']));
});

it('sem cadastro de profissional, avisa em vez de dizer que não há atendimentos', async () => {
  entrarComo('sem-cadastro-uid', {});

  render(<ProfessionalDashboard />);

  expect(await screen.findByText(/não encontramos seu cadastro de profissional/i)).toBeInTheDocument();
  expect(getAppointmentsByProfessional).not.toHaveBeenCalled();
});

it('com evoluções para escrever, o aviso leva à página de evoluções e diz a mais antiga', async () => {
  const sessao = (dia: number) => ({ sessao: { id: `s${dia}`, start: new Date(2026, 9, dia, 9) }, diasDeAtraso: 12 - dia });
  (useEvolucoes as jest.Mock).mockReturnValue({ pendentes: [sessao(8), sessao(12)] });

  render(<ProfessionalDashboard />);

  const aviso = await screen.findByRole('link', { name: /2 evoluções para escrever/ });
  expect(aviso).toHaveAttribute('href', '/evolucoes');
  expect(aviso).toHaveTextContent('a mais antiga é de qui, 08/10');
});

it('sem pendências, não aparece aviso de evoluções', async () => {
  render(<ProfessionalDashboard />);

  await waitFor(() => expect(getAppointmentsByProfessional).toHaveBeenCalled());
  expect(screen.queryByText(/evoluç/)).not.toBeInTheDocument();
});
