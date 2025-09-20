// __tests__/services/settingsService.test.ts

import { getCompanyData, updateCompanyData, getCostCenters, addCostCenter, findOrCreateCostCenter } from '@/services/settingsService';
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, query, where, orderBy, limit } from 'firebase/firestore';

// Simular o módulo do firestore
jest.mock('firebase/firestore');

// Tipos para os mocks
const mockedGetDoc = getDoc as jest.Mock;
const mockedSetDoc = setDoc as jest.Mock;
const mockedGetDocs = getDocs as jest.Mock;
const mockedAddDoc = addDoc as jest.Mock;
const mockedDoc = doc as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedQuery = query as jest.Mock;
const mockedWhere = where as jest.Mock;
const mockedOrderBy = orderBy as jest.Mock;
const mockedLimit = limit as jest.Mock;


describe('Settings Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testes para os Dados da Empresa
  describe('Company Data', () => {
    it('should get company data', async () => {
      const mockData = { name: 'Casa Libelle', cnpj: '123' };
      mockedGetDoc.mockResolvedValue({ exists: () => true, data: () => mockData });

      const data = await getCompanyData();
      
      expect(mockedDoc).toHaveBeenCalledWith(db, 'settings', 'companyInfo');
      expect(data).toEqual(mockData);
    });

    it('should update company data', async () => {
      const newData = { name: 'Casa Libelle LTDA' };
      await updateCompanyData(newData);

      expect(mockedSetDoc).toHaveBeenCalledWith(undefined, newData, { merge: true });
    });
  });

  // Testes para Centros de Custo
  describe('Cost Centers', () => {
    it('should get all cost centers', async () => {
      const mockData = [{ id: '1', data: () => ({ name: 'Fisioterapia' }) }];
      mockedGetDocs.mockResolvedValue({ docs: mockData });
      
      const centers = await getCostCenters();
      
      expect(mockedOrderBy).toHaveBeenCalledWith('name');
      expect(centers).toHaveLength(1);
      expect(centers[0].name).toBe('Fisioterapia');
    });

    it('should add a new cost center', async () => {
      await addCostCenter('Psicologia');
      expect(mockedAddDoc).toHaveBeenCalledWith(undefined, { name: 'Psicologia' });
    });
  });

  // Testes para a função findOrCreateCostCenter
  describe('findOrCreateCostCenter', () => {
    it('should create a cost center if it does not exist', async () => {
      // Simula que a busca não encontrou nada
      mockedGetDocs.mockResolvedValue({ empty: true });
      
      await findOrCreateCostCenter('Terapia Ocupacional');

      // Verifica se o addDoc foi chamado para criar o novo centro de custo
      expect(mockedAddDoc).toHaveBeenCalledWith(undefined, { name: 'Terapia Ocupacional' });
    });

    it('should NOT create a cost center if it already exists', async () => {
      // Simula que a busca encontrou um documento
      mockedGetDocs.mockResolvedValue({ empty: false });

      await findOrCreateCostCenter('Fisioterapia');

      // Garante que o addDoc NÃO foi chamado
      expect(mockedAddDoc).not.toHaveBeenCalled();
    });
  });
});