// __tests__/services/dashboardService.test.ts

import { getAdminDashboardStats } from '@/services/dashboardService';
import { getCountFromServer, query } from 'firebase/firestore';

// Simula apenas as funções do Firestore que o serviço realmente utiliza
jest.mock('firebase/firestore', () => {
  const originalModule = jest.requireActual('firebase/firestore');
  return {
    ...originalModule,
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    Timestamp: {
      fromDate: jest.fn((date) => date),
    },
    // A simulação mais importante: interceptamos a chamada de contagem
    getCountFromServer: jest.fn(),
  };
});

// Tipos para os mocks
const mockedGetCountFromServer = getCountFromServer as jest.Mock;
const mockedQuery = query as jest.Mock;

describe('Dashboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminDashboardStats', () => {
    it('should calculate all admin stats correctly', async () => {
      // --- Arrange (Organização) ---
      // Dizemos ao mock para retornar um valor diferente a cada vez que for chamado.
      // A ordem é a mesma que aparece em `Promise.all` no seu serviço.
      mockedGetCountFromServer
        .mockResolvedValueOnce({ data: () => ({ count: 15 }) }) // 1. Pacientes Ativos
        .mockResolvedValueOnce({ data: () => ({ count: 4 }) })  // 2. Profissionais Ativos
        .mockResolvedValueOnce({ data: () => ({ count: 7 }) })  // 3. Usuários Pendentes
        .mockResolvedValueOnce({ data: () => ({ count: 2 }) }); // 4. Agendamentos de Hoje

      // --- Act (Ação) ---
      const stats = await getAdminDashboardStats();

      // --- Assert (Verificação) ---
      
      // O query foi chamado 4 vezes para cada estatística?
      expect(mockedQuery).toHaveBeenCalledTimes(4);

      // O resultado final bate com os dados que simulamos?
      expect(stats).toEqual({
        activePatients: 15,
        activeProfessionals: 4,
        pendingUsers: 7,
        appointmentsToday: 2,
      });
    });

    it('should handle Firestore errors gracefully and return zeros', async () => {
        // Arrange: Simulamos um erro na chamada ao banco de dados
        mockedGetCountFromServer.mockRejectedValue(new Error("Firebase permission error"));
  
        // Act
        const stats = await getAdminDashboardStats();
  
        // Assert: A função deve capturar o erro e retornar um objeto com zeros
        expect(stats).toEqual({
          activePatients: 0,
          activeProfessionals: 0,
          pendingUsers: 0,
          appointmentsToday: 0,
        });
      });
  });
});