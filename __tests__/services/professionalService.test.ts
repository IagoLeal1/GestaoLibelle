// __tests__/services/professionalService.test.ts

import { getProfessionals, getProfessionalById, updateProfessional } from '@/services/professionalService';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, getDoc, updateDoc, query, orderBy } from 'firebase/firestore';

// Simular o módulo do firestore
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedGetDocs = getDocs as jest.Mock;
const mockedGetDoc = getDoc as jest.Mock;
const mockedUpdateDoc = updateDoc as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedOrderBy = orderBy as jest.Mock;
const mockedDoc = doc as jest.Mock;

describe('Professional Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testes para a função getProfessionals
  describe('getProfessionals', () => {
    it('should fetch and return all professionals sorted by name', async () => {
      const mockProfessionals = [
        { id: '1', data: () => ({ fullName: 'Dr. Carlos' }) },
        { id: '2', data: () => ({ fullName: 'Dra. Beatriz' }) },
      ];
      mockedGetDocs.mockResolvedValue({ docs: mockProfessionals });
      const professionals = await getProfessionals();
      expect(professionals).toHaveLength(2);
      expect(professionals[1].fullName).toBe('Dra. Beatriz');
    });
  });

  // Testes para a função getProfessionalById
  describe('getProfessionalById', () => {
    it('should return a professional when a valid ID is provided', async () => {
      // Arrange
      // --- CORREÇÃO FINAL ---
      // Usamos 'especialidade' (singular) e como uma string.
      const mockProfessional = { fullName: 'Dr. Ricardo', especialidade: 'Fisioterapia' };
      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'valid-id',
        data: () => mockProfessional,
      });

      // Act
      const professional = await getProfessionalById('valid-id');

      // Assert
      expect(mockedDoc).toHaveBeenCalledWith(db, 'professionals', 'valid-id');
      expect(professional).not.toBeNull();
      // --- CORREÇÃO FINAL ---
      // Verificamos o valor da string.
      expect(professional?.especialidade).toBe('Fisioterapia');
    });

    it('should return null if the professional does not exist', async () => {
      mockedGetDoc.mockResolvedValue({ exists: () => false });
      const professional = await getProfessionalById('invalid-id');
      expect(professional).toBeNull();
    });
  });
});