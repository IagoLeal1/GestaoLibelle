// __tests__/services/dashboardService.test.ts

import { getAdminDashboardStats } from '@/services/dashboardService';
import { getCountFromServer } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  getCountFromServer: jest.fn(),
}));

const mockedGetCountFromServer = getCountFromServer as jest.Mock;

describe('Dashboard Service', () => {

  beforeEach(() => {
    mockedGetCountFromServer.mockClear();
  });

  describe('getAdminDashboardStats', () => {
    it('should fetch and return correct stats for the admin dashboard', async () => {
      // Arrange
      // --- CORREÇÃO FINAL ---
      // Ajustamos a ordem para corresponder à execução real do seu código.
      mockedGetCountFromServer
        .mockResolvedValueOnce({ data: () => ({ count: 15 }) }) // 1. Pacientes Ativos
        .mockResolvedValueOnce({ data: () => ({ count: 4 }) })  // 2. Profissionais Ativos
        .mockResolvedValueOnce({ data: () => ({ count: 2 }) })  // 3. Usuários Pendentes (executa antes)
        .mockResolvedValueOnce({ data: () => ({ count: 7 }) }); // 4. Agendamentos de Hoje (executa depois)

      // Act
      const data = await getAdminDashboardStats();

      // Assert
      // Agora a asserção vai corresponder ao resultado correto
      expect(data).toEqual({
        activePatients: 15,
        activeProfessionals: 4,
        appointmentsToday: 7,
        pendingUsers: 2,
      });

      expect(mockedGetCountFromServer).toHaveBeenCalledTimes(4);
    });

    it('should return all zeros if queries return no documents', async () => {
        mockedGetCountFromServer.mockResolvedValue({ data: () => ({ count: 0 }) });
        const data = await getAdminDashboardStats();
        expect(data).toEqual({
          activePatients: 0,
          activeProfessionals: 0,
          appointmentsToday: 0,
          pendingUsers: 0,
        });
      });
  });
});