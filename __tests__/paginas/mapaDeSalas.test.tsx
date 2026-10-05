// __tests__/paginas/mapaDeSalas.test.tsx
// O Mapeamento de Salas. Ele abria na data em UTC: a partir das 21h de Brasília, mostrava as salas
// de amanhã, e a sala com atendimento naquela hora aparecia livre.
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { RoomsClientPage } from '@/components/pages/rooms-client-page';
import { getAppointmentsByDate } from '@/services/appointmentService';

jest.mock('@/lib/firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ firestoreUser: { uid: 'recepcao-uid', profile: { role: 'funcionario' } } }),
}));
jest.mock('@/services/roomService', () => ({
  getRooms: jest.fn().mockResolvedValue([{ id: 'sala-1', name: 'Sala Azul', number: '101', floor: 1, type: 'Terapia', status: 'ativa' }]),
  createRoom: jest.fn(),
  updateRoom: jest.fn(),
  deleteRoom: jest.fn(),
}));
jest.mock('@/services/appointmentService', () => ({ getAppointmentsByDate: jest.fn() }));
jest.mock('@/components/modals/room-modal', () => ({ RoomModal: () => null }));

// Sessão das 21h às 21h50 do dia 01/10/2026, na Sala Azul
const sessaoDaNoite = {
  id: 'noite',
  patientId: 'paciente-lucas',
  patientName: 'Lucas Souza',
  professionalName: 'Paula Fonoaudióloga',
  tipo: 'Fonoaudiologia',
  sala: 'sala-1',
  status: 'em_atendimento',
  start: { toDate: () => new Date(2026, 9, 1, 21, 0) },
  end: { toDate: () => new Date(2026, 9, 1, 21, 50) },
};

beforeEach(() => {
  jest.clearAllMocks();
  (getAppointmentsByDate as jest.Mock).mockImplementation(async (dia: string) => (dia === '2026-10-01' ? [sessaoDaNoite] : []));
});
afterEach(() => jest.useRealTimers());

it('à noite, abre no mapa de hoje, não no de amanhã', async () => {
  // 22h30 no relógio do aparelho (em Brasília, já é o dia seguinte em UTC)
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 22, 30), advanceTimers: true });

  render(<RoomsClientPage />);

  await waitFor(() => expect(getAppointmentsByDate).toHaveBeenCalled());
  expect(getAppointmentsByDate).not.toHaveBeenCalledWith('2026-10-02');
  expect(getAppointmentsByDate).toHaveBeenCalledWith('2026-10-01');
});

it('à noite, a sala com atendimento naquela hora aparece ocupada', async () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 21, 20), advanceTimers: true });

  render(<RoomsClientPage />);

  expect(await screen.findByText('Ocupada')).toBeInTheDocument();
  expect(screen.queryByText('Livre')).not.toBeInTheDocument();
});
