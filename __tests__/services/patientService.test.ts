// __tests__/services/patientService.test.ts

import { getPatients, getPatientById, createPatient } from '@/services/patientService';
import { db } from '@/lib/firebaseConfig';
import { collection, getDocs, doc, getDoc, addDoc, query, orderBy, where, Timestamp } from 'firebase/firestore';

// Simula todo o módulo 'firebase/firestore'
jest.mock('firebase/firestore');

// Tipos para os mocks das funções do Firestore
const mockedGetDocs = getDocs as jest.Mock;
const mockedGetDoc = getDoc as jest.Mock;
const mockedAddDoc = addDoc as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedOrderBy = orderBy as jest.Mock;
const mockedWhere = where as jest.Mock;
const mockedDoc = doc as jest.Mock; // <-- CORREÇÃO: Adicionada a simulação para a função 'doc'

describe('Patient Service', () => {

  // Limpa todos os mocks antes de cada teste para garantir que os testes são independentes
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Teste para a função getPatients
  describe('getPatients', () => {
    it('should fetch and return all patients sorted by name', async () => {
      // 1. Arrange: Preparamos os dados falsos que o Firestore "retornaria"
      const mockPatients = [
        { id: '2', data: () => ({ fullName: 'Zelia', status: 'ativo' }) },
        { id: '1', data: () => ({ fullName: 'Ana', status: 'ativo' }) },
      ];
      mockedGetDocs.mockResolvedValue({ docs: mockPatients });

      // 2. Act: Executamos a função que queremos testar
      const patients = await getPatients();

      // 3. Assert: Verificamos se o resultado é o esperado
      expect(mockedCollection).toHaveBeenCalledWith(db, 'patients');
      expect(mockedOrderBy).toHaveBeenCalledWith('fullName');
      expect(mockedQuery).toHaveBeenCalled();
      expect(patients).toHaveLength(2);
      expect(patients[0].fullName).toBe('Zelia'); // A função não reordena, apenas passa os dados
    });

    it('should filter patients by status if provided', async () => {
      // Arrange
      mockedGetDocs.mockResolvedValue({ docs: [] }); // Não precisamos de dados de retorno para este teste

      // Act
      await getPatients('inativo');

      // Assert
      expect(mockedWhere).toHaveBeenCalledWith('status', '==', 'inativo');
    });
  });

  // Teste para a função getPatientById
  describe('getPatientById', () => {
    it('should return a patient when a valid ID is provided', async () => {
      // Arrange
      const mockPatient = { fullName: 'Carlos', cpf: '123' };
      mockedGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'valid-id',
        data: () => mockPatient,
      });

      // Act
      const patient = await getPatientById('valid-id');

      // Assert
      expect(mockedDoc).toHaveBeenCalledWith(db, 'patients', 'valid-id'); // <-- CORREÇÃO: Usando o mock correto
      expect(patient).not.toBeNull();
      expect(patient?.fullName).toBe('Carlos');
    });

    it('should return null if the patient does not exist', async () => {
      // Arrange
      mockedGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Act
      const patient = await getPatientById('invalid-id');

      // Assert
      expect(patient).toBeNull();
    });
  });
});