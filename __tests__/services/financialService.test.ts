// __tests__/services/financialService.test.ts

import { addTransaction, updateTransactionStatus, deleteTransaction } from '@/services/financialService';
import { db } from '@/lib/firebaseConfig';
import { collection, doc, runTransaction, Timestamp, increment } from 'firebase/firestore';

// Simula todo o módulo 'firebase/firestore'
jest.mock('firebase/firestore');

// Tipos para os mocks das funções do Firestore
const mockedRunTransaction = runTransaction as jest.Mock;
const mockedDoc = doc as jest.Mock;
const mockedCollection = collection as jest.Mock;
const mockedIncrement = increment as jest.Mock;

describe('Financial Service', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuração padrão para a simulação da transação.
    // Ela "finge" que lê documentos e permite atualizações.
    mockedRunTransaction.mockImplementation(async (db, updateFunction) => {
      const transaction = {
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            status: 'pendente',
            type: 'despesa',
            value: 100,
            bankAccountId: 'conta-valida'
          }),
        }),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      };
      await updateFunction(transaction);
      return Promise.resolve();
    });
  });

  // Testes para a função addTransaction
  describe('addTransaction', () => {
    it('should add a transaction without updating balance if status is pending', async () => {
      // Arrange
      const transactionData = {
        type: 'receita' as const,
        description: 'Consulta',
        value: 150,
        dataMovimento: new Date(),
        status: 'pendente' as const,
        category: 'Consultas',
        costCenter: 'Psicologia',
        bankAccountId: 'conta-123',
      };

      // Act
      const result = await addTransaction(transactionData);

      // Assert
      expect(result.success).toBe(true);
      // Verifica se a transação foi chamada, mas o 'increment' (atualização de saldo) não.
      expect(mockedRunTransaction).toHaveBeenCalled();
      expect(mockedIncrement).not.toHaveBeenCalled();
    });

    it('should add a transaction and update balance if status is paid', async () => {
      // Arrange
      const transactionData = {
        type: 'receita' as const,
        description: 'Consulta',
        value: 150,
        dataMovimento: new Date(),
        status: 'pago' as const,
        category: 'Consultas',
        costCenter: 'Psicologia',
        bankAccountId: 'conta-123',
      };

      // Act
      await addTransaction(transactionData);

      // Assert
      expect(mockedRunTransaction).toHaveBeenCalled();
      // Verifica se o saldo foi incrementado com o valor correto
      expect(mockedIncrement).toHaveBeenCalledWith(150);
    });
  });

  // Testes para a função updateTransactionStatus
  describe('updateTransactionStatus', () => {
    it('should update balance correctly when changing status from pending to paid', async () => {
      // Act
      await updateTransactionStatus('id-transacao', 'pago');

      // Assert
      expect(mockedRunTransaction).toHaveBeenCalled();
      // Despesa de 100, ao ser paga, subtrai do saldo
      expect(mockedIncrement).toHaveBeenCalledWith(-100);
    });

    it('should update balance correctly when changing status from paid to pending', async () => {
       // Arrange: Simulamos que a transação já estava 'paga'
       mockedRunTransaction.mockImplementation(async (db, updateFunction) => {
        const transaction = {
          get: jest.fn().mockResolvedValue({
            exists: () => true,
            data: () => ({ status: 'pago', type: 'despesa', value: 100, bankAccountId: 'conta-valida' }),
          }),
          update: jest.fn(),
        };
        await updateFunction(transaction);
        return Promise.resolve();
      });

      // Act
      await updateTransactionStatus('id-transacao', 'pendente');

      // Assert
      expect(mockedRunTransaction).toHaveBeenCalled();
      // Reverter uma despesa paga significa adicionar o valor de volta ao saldo
      expect(mockedIncrement).toHaveBeenCalledWith(100);
    });
  });
});