// __tests__/paginas/gradePorTerapeuta.test.tsx
// A grade por terapeuta: o terapeuta abre direto na própria agenda; a gestão escolhe o profissional.
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { GradeTerapeutaClientPage } from '@/components/pages/grade-terapeuta-client-page';
import { useAuth } from '@/context/AuthContext';
import { getProfessionals } from '@/services/professionalService';
import { getAppointmentsByProfessionalInRange } from '@/services/appointmentService';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/firebaseConfig', () => ({ db: {}, auth: {} }));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn() }));
jest.mock('@/services/appointmentService', () => ({
  getAppointmentsByProfessionalInRange: jest.fn(),
  createAppointmentFromTherapyGrid: jest.fn(),
}));
jest.mock('@/services/patientService', () => ({ getPatients: jest.fn() }));
jest.mock('@/services/specialtyService', () => ({ getSpecialties: jest.fn() }));
jest.mock('@/services/roomService', () => ({ getRooms: jest.fn() }));
jest.mock('@/components/modals/quick-appointment-modal', () => ({ QuickAppointmentModal: () => null }));

const entrarComo = (uid: string, profile: Record<string, unknown>) =>
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid, profile } });

beforeEach(() => {
  jest.clearAllMocks();
  (getProfessionals as jest.Mock).mockResolvedValue([
    { id: 'prof-paula', fullName: 'Paula Fonoaudióloga', status: 'ativo', userId: 'paula-uid' },
    { id: 'prof-rui', fullName: 'Rui Psicólogo', status: 'ativo', userId: 'rui-uid' },
  ]);
  (getAppointmentsByProfessionalInRange as jest.Mock).mockResolvedValue([]);
});

/** De quem a grade buscou os atendimentos da semana. */
const gradeAberta = () => (getAppointmentsByProfessionalInRange as jest.Mock).mock.calls.map(([id]) => id);

describe('grade por terapeuta', () => {
  it('o terapeuta abre direto na própria agenda', async () => {
    entrarComo('paula-uid', { role: 'profissional', professionalId: 'prof-paula' });

    render(<GradeTerapeutaClientPage initialProfessionalId="" />);

    await waitFor(() => expect(gradeAberta()).toEqual(['prof-paula']));
  });

  it('conta antiga, sem o código do profissional no perfil, é achada pelo cadastro', async () => {
    entrarComo('rui-uid', { role: 'profissional' });

    render(<GradeTerapeutaClientPage initialProfessionalId="" />);

    await waitFor(() => expect(gradeAberta()).toEqual(['prof-rui']));
  });

  it('o profissional que veio no endereço continua valendo', async () => {
    entrarComo('paula-uid', { role: 'profissional', professionalId: 'prof-paula' });

    render(<GradeTerapeutaClientPage initialProfessionalId="prof-rui" />);

    await waitFor(() => expect(gradeAberta()).toEqual(['prof-rui']));
  });

  it('a gestão escolhe o profissional', async () => {
    entrarComo('rafa-uid', { role: 'funcionario' });

    render(<GradeTerapeutaClientPage initialProfessionalId="" />);

    expect(await screen.findByText(/Selecione um profissional/)).toBeInTheDocument();
    expect(gradeAberta()).toEqual([]);
  });
});
