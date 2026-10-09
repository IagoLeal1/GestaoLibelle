// __tests__/paginas/novoAgendamentoDoEncaixe.test.tsx
// Vindo do assistente ("Agendar" em Para agendar), o Novo Agendamento abre preenchido com a sessão do
// encaixe e a recorrência semanal; a recepção confere e salva, e a sessão fica marcada como agendada.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppointmentForm } from '@/components/forms/appointment-form';
import { createAppointmentBlock, getOccupiedRoomIdsByTime } from '@/services/appointmentService';
import { lerEncaixe, marcarSessaoAgendada } from '@/services/encaixeService';
import { getPatients } from '@/services/patientService';
import { getProfessionals } from '@/services/professionalService';
import { getSpecialties } from '@/services/specialtyService';
import { getRooms } from '@/services/roomService';

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh: jest.fn(), back: jest.fn() }) }));
jest.mock('@/services/appointmentService', () => ({
  createAppointment: jest.fn(), createAppointmentBlock: jest.fn(), getOccupiedRoomIdsByTime: jest.fn(),
}));
jest.mock('@/services/encaixeService', () => ({ lerEncaixe: jest.fn(), marcarSessaoAgendada: jest.fn() }));
jest.mock('@/services/patientService', () => ({ getPatients: jest.fn() }));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn() }));
jest.mock('@/services/specialtyService', () => ({ getSpecialties: jest.fn() }));
jest.mock('@/services/roomService', () => ({ getRooms: jest.fn() }));

const ana = { id: 'prof-ana', nome: 'Ana Costa' };
const encaixe = {
  id: 'e1', status: 'para_agendar', paciente: { id: 'paciente-theo', nome: 'Theo Martins' }, comecaEm: '2026-10-13',
  criadoPor: { uid: 'coord', nome: 'Carla' }, agendadas: { 0: true },
  opcao: {
    chave: 'x', troca: null, semanasLivres: 12, diasEmendados: [], faltam: [],
    sessoes: ['terca', 'quinta'].map((dia) => ({
      terapia: 'Fonoaudiologia Unimed', profissional: ana, dia, horario: '14:10', fim: '15:00', semanasLivres: 12,
      sala: { id: 'sala-1', nome: 'Sala Azul' }, preferida: false, comTroca: false,
    })),
  },
};

// O interruptor de recorrência (Radix) mede o próprio tamanho
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as any;

beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
  (getPatients as jest.Mock).mockResolvedValue([{ id: 'paciente-theo', fullName: 'Theo Martins', convenio: 'Unimed' }]);
  (getProfessionals as jest.Mock).mockResolvedValue([{ id: 'prof-ana', fullName: 'Ana Costa' }]);
  (getSpecialties as jest.Mock).mockResolvedValue([{ id: 'f', name: 'Fonoaudiologia Unimed', value: 120 }, { id: 'g', name: 'Fonoaudiologia', value: 150 }]);
  (getRooms as jest.Mock).mockResolvedValue([{ id: 'sala-1', name: 'Sala Azul', status: 'ativa' }]);
  (getOccupiedRoomIdsByTime as jest.Mock).mockResolvedValue([]);
  (lerEncaixe as jest.Mock).mockResolvedValue(encaixe);
  (createAppointmentBlock as jest.Mock).mockResolvedValue({ success: true });
  (marcarSessaoAgendada as jest.Mock).mockResolvedValue(true);
});

it('abre preenchido com a sessão do encaixe, a partir da primeira quinta, e marca a sessão ao salvar', async () => {
  render(<AppointmentForm doEncaixe={{ id: 'e1', sessao: 1 }} />);

  expect(await screen.findByText('Do assistente de agendamento')).toBeInTheDocument();
  expect(screen.getByText(/Theo Martins · Fonoaudiologia Unimed com Ana Costa, toda quinta às 14:10, a partir de quinta, 15\/10/)).toBeInTheDocument();
  expect(screen.getByDisplayValue('2026-10-15')).toBeInTheDocument();
  expect(screen.getByDisplayValue('14:10')).toBeInTheDocument();
  expect(screen.getByDisplayValue('15:00')).toBeInTheDocument();
  expect(screen.getByRole('switch', { name: 'Criar agendamento recorrente' })).toBeChecked();

  fireEvent.click(screen.getByRole('button', { name: 'Salvar Agendamento(s)' }));

  await waitFor(() => expect(createAppointmentBlock).toHaveBeenCalledWith(expect.objectContaining({
    patientId: 'paciente-theo', professionalId: 'prof-ana', tipo: 'Fonoaudiologia Unimed', convenio: 'Unimed', valorConsulta: 120,
    data: '2026-10-15', horaInicio: '14:10', horaFim: '15:00', sala: 'sala-1', frequency: 'weekly',
  })));
  expect(marcarSessaoAgendada).toHaveBeenCalledWith(encaixe, 1);
  expect(push).toHaveBeenCalledWith('/agendamentos/assistente?aba=para-agendar');
});

it('sem encaixe, o formulário abre vazio como sempre', async () => {
  render(<AppointmentForm />);

  await waitFor(() => expect(getPatients).toHaveBeenCalled());
  expect(lerEncaixe).not.toHaveBeenCalled();
  expect(screen.queryByText('Do assistente de agendamento')).not.toBeInTheDocument();
});
