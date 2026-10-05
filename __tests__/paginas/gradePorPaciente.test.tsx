// __tests__/paginas/gradePorPaciente.test.tsx
// A grade por paciente: a gestão monta a semana; o terapeuta só vê, para se organizar.
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { GradeAgendamentosClientPage } from '@/components/pages/grade-agendamentos-client-page';
import { useAuth } from '@/context/AuthContext';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('@/services/patientService', () => ({ getPatients: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/specialtyService', () => ({ getSpecialties: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/roomService', () => ({ getRooms: jest.fn().mockResolvedValue([]) }));
jest.mock('@/services/appointmentService', () => ({ getAppointmentsForReport: jest.fn().mockResolvedValue([]) }));
jest.mock('@/components/modals/quick-appointment-modal', () => ({ QuickAppointmentModal: () => null }));
jest.mock('@/components/modals/edit-appointment-modal', () => ({ EditAppointmentModal: () => null }));

const entrarComo = (role: string) => (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { profile: { role } } });

describe('grade por paciente', () => {
  it('a recepção monta e salva a semana', async () => {
    entrarComo('funcionario');

    render(<GradeAgendamentosClientPage />);

    expect(await screen.findByRole('button', { name: /Salvar Agenda/ })).toBeInTheDocument();
  });

  it('o terapeuta só vê a semana: não tem como salvar agendamentos', async () => {
    entrarComo('profissional');

    render(<GradeAgendamentosClientPage />);

    expect(await screen.findByText(/Selecione o Paciente/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Salvar Agenda/ })).not.toBeInTheDocument();
  });
});
