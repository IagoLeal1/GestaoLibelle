// __tests__/services/adminService.test.ts

import { getPendingUsers, approveUser, rejectUser, hideUserFromHistory } from '@/services/adminService';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, runTransaction } from 'firebase/firestore';

// Simular o módulo do firestore
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedGetDocs = getDocs as jest.Mock;
const mockedUpdateDoc = updateDoc as jest.Mock;
const mockedRunTransaction = runTransaction as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedWhere = where as jest.Mock;
const mockedDoc = doc as jest.Mock;

describe('Admin Service', () => {

  // --- CORREÇÃO AQUI ---
  // Criamos uma variável para guardar o nosso objeto de transação simulado
  let mockTransaction: {
    get: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Antes de cada teste, recriamos o nosso objeto de transação simulado
    mockTransaction = {
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ profile: { status: 'pendente' } }),
      }),
      update: jest.fn(),
    };
    
    // A simulação agora usa o objeto que está acessível no escopo do teste
    mockedRunTransaction.mockImplementation(async (db, updateFunction) => {
      await updateFunction(mockTransaction);
    });
  });

  describe('getPendingUsers', () => {
    it('should fetch only users with "pendente" status', async () => {
      const mockUsers = [{ id: '1', data: () => ({ displayName: 'User Pendente' }) }];
      mockedGetDocs.mockResolvedValue({ docs: mockUsers });

      const users = await getPendingUsers();

      expect(mockedWhere).toHaveBeenCalledWith('profile.status', '==', 'pendente');
      expect(users).toHaveLength(1);
    });
  });

  describe('approveUser', () => {
    it('should approve a user and update their status', async () => {
      const result = await approveUser('user-to-approve');

      expect(result.success).toBe(true);
      expect(mockedRunTransaction).toHaveBeenCalled();
      // Agora podemos verificar diretamente o nosso mockTransaction
      expect(mockTransaction.update).toHaveBeenCalledWith(undefined, { 'profile.status': 'aprovado' });
    });
  });

  describe('rejectUser', () => {
    it('should reject a user and update their status', async () => {
      const result = await rejectUser('user-to-reject');

      expect(result.success).toBe(true);
      expect(mockedUpdateDoc).toHaveBeenCalledWith(undefined, { 'profile.status': 'rejeitado' });
    });
  });
    
  describe('hideUserFromHistory', () => {
    it('should set historyHidden to true for a user', async () => {
        const result = await hideUserFromHistory('user-to-hide');

        expect(result.success).toBe(true);
        expect(mockedUpdateDoc).toHaveBeenCalledWith(undefined, { 'profile.historyHidden': true });
    });
  });
});