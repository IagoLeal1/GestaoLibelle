// __tests__/services/specialtyService.test.ts

import { getSpecialties } from '@/services/specialtyService';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Simular o módulo do firestore
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedGetDocs = getDocs as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedOrderBy = orderBy as jest.Mock;

describe('Specialty Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Teste para a função getSpecialties
  describe('getSpecialties', () => {
    it('should fetch all specialties sorted by name', async () => {
      // Arrange
      const mockSpecialties = [
        { id: '1', data: () => ({ name: 'Psicologia' }) },
        { id: '2', data: () => ({ name: 'Fonoaudiologia' }) },
      ];
      mockedGetDocs.mockResolvedValue({ docs: mockSpecialties });

      // Act
      const specialties = await getSpecialties();

      // Assert
      expect(mockedOrderBy).toHaveBeenCalledWith('name');
      expect(specialties).toHaveLength(2);
      expect(specialties[1].name).toBe('Fonoaudiologia');
    });
  });
});