// __tests__/services/communicationService.test.ts

import { getCommunications, createCommunication, markCommunicationAsRead } from '@/services/communicationService';
import { db } from '@/lib/firebaseConfig';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy, Timestamp } from 'firebase/firestore';

// Simular o módulo do firestore
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedGetDocs = getDocs as jest.Mock;
const mockedAddDoc = addDoc as jest.Mock;
const mockedUpdateDoc = updateDoc as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedWhere = where as jest.Mock;
const mockedOrderBy = orderBy as jest.Mock;
const mockedDoc = doc as jest.Mock;
// --- CORREÇÃO AQUI ---
// Criamos um mock específico para o objeto Timestamp para controlar os seus métodos
const mockedTimestamp = Timestamp as jest.Mocked<typeof Timestamp>;

const mockAuthor = {
    uid: 'author-uid-123',
    displayName: 'Admin Coordenador',
} as any;

describe('Communication Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // --- CORREÇÃO AQUI ---
    // Antes de cada teste, dizemos ao Timestamp.now() para retornar um valor previsível
    mockedTimestamp.now.mockReturnValue(new Date('2025-01-01T12:00:00Z') as any);
  });

  describe('getCommunications', () => {
    it('should fetch all communications for admin users', async () => {
      mockedGetDocs.mockResolvedValue({ docs: [] });
      await getCommunications('admin');
      expect(mockedWhere).not.toHaveBeenCalled();
      expect(mockedOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should filter communications by targetRole for non-admin users', async () => {
      mockedGetDocs.mockResolvedValue({ docs: [] });
      await getCommunications('familiar');
      expect(mockedWhere).toHaveBeenCalledWith('targetRole', '==', 'familiar');
    });
  });

  describe('createCommunication', () => {
    it('should create a new communication with correct author details', async () => {
      const formData = { title: 'Novo Aviso', message: 'Reunião geral amanhã.', isImportant: true, targetRole: 'profissional' as const };
      const result = await createCommunication(formData, mockAuthor);
      expect(result.success).toBe(true);
      expect(mockedAddDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({ authorName: 'Admin Coordenador', readBy: {} }));
    });
  });

  describe('markCommunicationAsRead', () => {
    it('should update the readBy field with the user ID and current timestamp', async () => {
      const communicationId = 'comm-id-1';
      const userId = 'user-id-1';
      
      const result = await markCommunicationAsRead(communicationId, userId);

      expect(result.success).toBe(true);
      expect(mockedDoc).toHaveBeenCalledWith(db, 'communications', communicationId);
      // --- CORREÇÃO AQUI ---
      // Agora verificamos se o valor é exatamente o que definimos na nossa simulação
      expect(mockedUpdateDoc).toHaveBeenCalledWith(
        undefined, 
        {
          [`readBy.${userId}`]: new Date('2025-01-01T12:00:00Z'),
        }
      );
    });
  });
});