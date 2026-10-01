// __tests__/paginas/inicio.test.tsx
// A tela inicial de cada papel. A coordenação entrava e via "Seu perfil não tem um dashboard associado".
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/(dashboard)/page';
import { useAuth } from '@/context/AuthContext';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/dashboards/AdminDashboard', () => ({ AdminDashboard: () => 'Painel da clínica' }));
jest.mock('@/components/dashboards/ProfessionalDashboard', () => ({ ProfessionalDashboard: () => 'Painel do terapeuta' }));
jest.mock('@/components/dashboards/FamilyDashboard', () => ({ FamilyDashboard: () => 'Painel da família' }));

const entrarComo = (role: string) => (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { profile: { role } } });

describe('tela inicial', () => {
  it.each(['admin', 'coordenador', 'funcionario'])('%s vê o painel da clínica', (papel) => {
    entrarComo(papel);

    render(<DashboardPage />);

    expect(screen.getByText('Painel da clínica')).toBeInTheDocument();
  });

  it.each([
    ['profissional', 'Painel do terapeuta'],
    ['familiar', 'Painel da família'],
  ])('%s vê o painel dele', (papel, painel) => {
    entrarComo(papel);

    render(<DashboardPage />);

    expect(screen.getByText(painel)).toBeInTheDocument();
  });
});
