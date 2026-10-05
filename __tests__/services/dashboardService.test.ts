// __tests__/services/dashboardService.test.ts
// Os números da tela inicial da gestão. Os atendimentos de hoje saem da própria lista do dia; aqui
// ficam os pacientes e profissionais ativos e, só para o admin (quem aprova), os pedidos de acesso.

import { getAdminDashboardStats } from '@/services/dashboardService';
import { getCountFromServer, where } from 'firebase/firestore';

// Simula apenas as funções do Firestore que o serviço realmente utiliza
jest.mock('firebase/firestore', () => {
  const originalModule = jest.requireActual('firebase/firestore');
  return {
    ...originalModule,
    collection: jest.fn(),
    query: jest.fn((...partes) => partes),
    where: jest.fn((...filtro) => filtro),
    // A simulação mais importante: interceptamos a chamada de contagem
    getCountFromServer: jest.fn(),
  };
});
jest.mock('@/lib/firebaseConfig', () => ({ db: {} }));

const mockedGetCountFromServer = getCountFromServer as jest.Mock;
const contagem = (count: number) => ({ data: () => ({ count }) });
const filtros = () => (where as jest.Mock).mock.calls.map(([campo]) => campo);

describe('Dashboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAdminDashboardStats', () => {
    it('para o admin, conta os pacientes e profissionais ativos e os pedidos de acesso', async () => {
      mockedGetCountFromServer
        .mockResolvedValueOnce(contagem(15)) // pacientes ativos
        .mockResolvedValueOnce(contagem(4)) // profissionais ativos
        .mockResolvedValueOnce(contagem(7)); // pedidos de acesso

      const stats = await getAdminDashboardStats({ comAprovacoes: true });

      expect(stats).toEqual({ activePatients: 15, activeProfessionals: 4, pendingUsers: 7 });
      expect(filtros()).toContain('profile.status');
    });

    it('para a coordenação e a recepção, nem busca os pedidos de acesso', async () => {
      mockedGetCountFromServer.mockResolvedValueOnce(contagem(15)).mockResolvedValueOnce(contagem(4));

      const stats = await getAdminDashboardStats({ comAprovacoes: false });

      expect(stats).toEqual({ activePatients: 15, activeProfessionals: 4, pendingUsers: 0 });
      expect(mockedGetCountFromServer).toHaveBeenCalledTimes(2);
      expect(filtros()).not.toContain('profile.status');
    });

    it('se o banco falhar, mostra zeros em vez de quebrar a tela', async () => {
      mockedGetCountFromServer.mockRejectedValue(new Error('Firebase permission error'));

      const stats = await getAdminDashboardStats({ comAprovacoes: true });

      expect(stats).toEqual({ activePatients: 0, activeProfessionals: 0, pendingUsers: 0 });
    });
  });
});
