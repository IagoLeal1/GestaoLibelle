// __tests__/services/roomService.test.ts

import { getRooms } from '@/services/roomService';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

// Simular o módulo do firestore
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedGetDocs = getDocs as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedOrderBy = orderBy as jest.Mock;

describe('Room Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRooms', () => {
    it('should fetch all rooms sorted by floor and then by number', async () => {
      // Arrange
      const mockRooms = [
        { id: '1', data: () => ({ name: 'Sala Beta', floor: 1, number: 2 }) },
        { id: '2', data: () => ({ name: 'Sala Alfa', floor: 1, number: 1 }) },
      ];
      mockedGetDocs.mockResolvedValue({ docs: mockRooms });

      // Act
      const rooms = await getRooms();

      // Assert
      // --- CORREÇÃO AQUI ---
      // Verificamos se a ordenação correta foi chamada, em duas chamadas separadas.
      expect(mockedOrderBy).toHaveBeenCalledWith('floor');
      expect(mockedOrderBy).toHaveBeenCalledWith('number');
      expect(rooms).toHaveLength(2);
    });
  });
});