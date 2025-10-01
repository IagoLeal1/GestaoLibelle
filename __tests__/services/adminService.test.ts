// __tests__/services/adminService.test.ts

import { approveUser, getPendingUsers, rejectUser } from '@/services/adminService';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, doc, runTransaction, deleteDoc } from 'firebase/firestore';

// Simular o módulo do firestore
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedGetDocs = getDocs as jest.Mock;
const mockedRunTransaction = runTransaction as jest.Mock;
const mockedDeleteDoc = deleteDoc as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedWhere = where as jest.Mock;
const mockedDoc = doc as jest.Mock;

describe('Admin Service', () => {

  let mockTransaction: {
    get: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction = {
      get: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
    };
    mockedRunTransaction.mockImplementation(async (db, updateFunction) => {
      await updateFunction(mockTransaction);
    });
  });

  describe('getPendingUsers', () => {
    it('should fetch only users with "pendente" status', async () => {
      // DADOS SIMULADOS
      const mockUsers = [{ 
        id: '1', 
        data: () => ({ 
          displayName: 'User Pendente', 
          email: 'teste@email.com',
          profile: { 
            role: 'funcionario', 
            cpf: '123', 
            telefone: '456', 
            createdAt: { toDate: () => new Date() } 
          } 
        }) 
      }];

      // --- CORREÇÃO FINAL ---
      // A simulação de 'getDocs' agora retorna um objeto que possui o método 'forEach'.
      // Este método simulado irá iterar sobre nossa lista de usuários falsos.
      // Isso resolve o erro "querySnapshot.forEach is not a function".
      mockedGetDocs.mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          mockUsers.forEach(userDoc => callback(userDoc));
        }
      });

      const users = await getPendingUsers();

      expect(mockedWhere).toHaveBeenCalledWith('profile.status', '==', 'pendente');
      expect(users).toHaveLength(1);
      expect(users[0].displayName).toBe('User Pendente');
    });
  });

  describe('approveUser', () => {
    it('should approve a non-professional user by updating their status', async () => {
      mockTransaction.get.mockResolvedValue({
        exists: () => true,
        data: () => ({ profile: { status: 'pendente', role: 'funcionario' } }),
      });
      
      const result = await approveUser('user-to-approve');

      expect(result.success).toBe(true);
      expect(mockTransaction.update).toHaveBeenCalledWith(undefined, { 'profile.status': 'aprovado' });
      expect(mockTransaction.set).not.toHaveBeenCalled();
    });

    it('should approve a professional, create a professional document, and update the user profile', async () => {
        mockedDoc.mockReturnValue({ id: 'new-professional-id-123' });

        const professionalUserData = {
            uid: 'professional-user-id',
            displayName: 'Dra. Ana',
            email: 'ana.fisio@email.com',
            profile: {
                status: 'pendente', role: 'profissional', cpf: '123.456.789-00', telefone: '(21) 98888-7777',
                professionalData: { especialidade: 'Fisioterapia', conselho: 'CREFITO', numeroConselho: '12345' }
            }
        };
        mockTransaction.get.mockResolvedValue({
            exists: () => true,
            data: () => professionalUserData,
        });

        const result = await approveUser('professional-user-id');

        expect(result.success).toBe(true);
        expect(mockTransaction.set).toHaveBeenCalledTimes(1);
        const updatedProfile = mockTransaction.update.mock.calls[0][1].profile;
        expect(updatedProfile.status).toBe('aprovado');
        expect(updatedProfile.professionalId).toBe('new-professional-id-123');
        expect(updatedProfile.professionalData).toBeUndefined();
    });
  });

  describe('rejectUser', () => {
    it('should reject a user by deleting their document', async () => {
        mockedDeleteDoc.mockResolvedValue(undefined);
        const result = await rejectUser('user-to-reject');
        expect(result.success).toBe(true);
        expect(mockedDeleteDoc).toHaveBeenCalled();
    });
  });
});