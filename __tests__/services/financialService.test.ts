// __tests__/services/financialService.test.ts

import {
    addTransaction,
    updateTransactionStatus,
    deleteTransaction,
    createTransactionBlock,
    getOverdueExpenses,
    getExpensesByCostCenter,
    addBankAccount,
    setDefaultBankAccount,
} from '@/services/financialService';
import {
    collection,
    doc,
    runTransaction,
    Timestamp,
    increment,
    writeBatch,
    getDocs,
    addDoc,
} from 'firebase/firestore';

// --- Mocks Globais ---
jest.mock('firebase/firestore', () => {
    const originalModule = jest.requireActual('firebase/firestore');
    return {
        ...originalModule,
        Timestamp: {
            fromDate: jest.fn((date) => ({
                toDate: () => date,
            })),
        },
        collection: jest.fn(() => ({ id: 'mock-collection' })), // CORREÇÃO: Garante que a collection retorne um objeto
        query: jest.fn(),
        where: jest.fn(),
        getDocs: jest.fn(),
        doc: jest.fn((db, path, id) => ({ id: id || `mock-id-for-${path}` })),
        addDoc: jest.fn(),
        runTransaction: jest.fn(),
        writeBatch: jest.fn(),
        increment: jest.fn((value) => `incremented_by_${value}`),
    };
});


// --- Mocks Específicos ---
const mockedRunTransaction = runTransaction as jest.Mock;
const mockedWriteBatch = writeBatch as jest.Mock;
const mockedGetDocs = getDocs as jest.Mock;
const mockedIncrement = increment as jest.Mock;
const mockedAddDoc = addDoc as jest.Mock;
const mockedDoc = doc as jest.Mock;

const mockBatch = {
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
};

describe('Financial Service - Cobertura Completa', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedWriteBatch.mockReturnValue(mockBatch);

        // Configuração padrão do runTransaction
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
        });

        // Configuração padrão para getDocs retornar uma estrutura com forEach
        mockedGetDocs.mockResolvedValue({
            docs: [],
            empty: true,
            forEach: (callback: any) => [],
        });
    });

    // --- Testes de Operações de Transação ---
    describe('Transaction Operations', () => {
        it('should add a transaction and update balance if status is paid', async () => {
            const transactionData = {
                type: 'receita' as const, value: 200, status: 'pago' as const,
                bankAccountId: 'conta-123', dataMovimento: new Date(),
            } as any;
            await addTransaction(transactionData);
            expect(mockedRunTransaction).toHaveBeenCalled();
            expect(mockedIncrement).toHaveBeenCalledWith(200);
        });

        it('should update balance when status changes from pending to paid (expense)', async () => {
            await updateTransactionStatus('id-transacao', 'pago');
            expect(mockedRunTransaction).toHaveBeenCalled();
            expect(mockedIncrement).toHaveBeenCalledWith(-100);
        });

        it('should revert balance on deleting a paid transaction (revenue)', async () => {
            mockedRunTransaction.mockImplementation(async (db, updateFunction) => {
                const transaction = {
                    get: jest.fn().mockResolvedValue({
                        exists: () => true,
                        data: () => ({ status: 'pago', type: 'receita', value: 300, bankAccountId: 'conta-valida' }),
                    }),
                    delete: jest.fn(), update: jest.fn()
                };
                await updateFunction(transaction);
            });
            await deleteTransaction('id-transacao');
            expect(mockedRunTransaction).toHaveBeenCalled();
            expect(mockedIncrement).toHaveBeenCalledWith(-300);
        });
    });


    // --- Testes de Operações em Lote ---
    describe('Batch Operations', () => {
        it('should create multiple transactions in a block', async () => {
            const blockData = {
                repetitions: 5, description: 'Mensalidade',
                dataMovimento: new Date(), type: 'receita', value: 100, status: 'pendente',
                category: 'Mensalidades', costCenter: 'Geral',
            } as any;
            await createTransactionBlock(blockData);
            expect(mockBatch.set).toHaveBeenCalledTimes(5);
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
        });
    });


    // --- Testes de Relatórios e Buscas ---
    describe('Reporting and Fetching', () => {
        it('should get overdue expenses', async () => {
            const overdueExpense = { id: 'tx-vencida', data: () => ({ type: 'despesa', status: 'pendente', dataMovimento: Timestamp.fromDate(new Date('2024-01-01')) }) };
            const mockSnapshot = {
                docs: [overdueExpense],
                empty: false,
                forEach: (callback: any) => [overdueExpense].forEach(callback),
            };
            mockedGetDocs.mockResolvedValue(mockSnapshot as any);

            const result = await getOverdueExpenses();
            expect(result.length).toBe(1);
            expect(result[0].id).toBe('tx-vencida');
        });

        it('should group expenses by cost center', async () => {
            const despesas = [
                { id: 'tx-1', data: () => ({ costCenter: 'Psicologia', value: 100, status: 'pago', type: 'despesa', dataMovimento: Timestamp.fromDate(new Date()) }) },
                { id: 'tx-2', data: () => ({ costCenter: 'Administrativo', value: 50, status: 'pago', type: 'despesa', dataMovimento: Timestamp.fromDate(new Date()) }) },
                { id: 'tx-3', data: () => ({ costCenter: 'Psicologia', value: 120, status: 'pago', type: 'despesa', dataMovimento: Timestamp.fromDate(new Date()) }) },
                { id: 'tx-4', data: () => ({ costCenter: 'Psicologia', value: 80, status: 'pendente', type: 'despesa', dataMovimento: Timestamp.fromDate(new Date()) }) },
            ];
            const mockSnapshot = { docs: despesas, empty: false, forEach: (callback: any) => despesas.forEach(callback) };
            mockedGetDocs.mockResolvedValue(mockSnapshot as any);

            const result = await getExpensesByCostCenter(new Date(), new Date());

            expect(result['Psicologia'].total).toBe(220);
            expect(result['Psicologia'].count).toBe(2);
            expect(result['Administrativo'].total).toBe(50);
        });
    });


    // --- Testes de Gerenciamento de Contas ---
    describe('Account Management', () => {
        it('should add a bank account with currentBalance equal to initialBalance', async () => {
            const accountData = { name: 'Conta Principal', initialBalance: 1000 } as any;

            await addBankAccount(accountData);
            expect(mockedAddDoc).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'mock-collection' }), // CORREÇÃO: Verifica se o primeiro argumento é um objeto
                expect.objectContaining({
                    currentBalance: 1000,
                    initialBalance: 1000
                })
            );
        });

        it('should set one account as default and others as not', async () => {
            const accounts = [
                { id: 'conta-1', data: () => ({ name: 'Conta A' }) },
                { id: 'conta-2', data: () => ({ name: 'Conta B' }) },
            ];
            const mockSnapshot = { docs: accounts, empty: false, forEach: (callback: any) => accounts.forEach(callback) };
            mockedGetDocs.mockResolvedValue(mockSnapshot as any);

            mockedDoc.mockImplementation((db, collectionPath, docId) => ({
                id: docId,
            }));

            await setDefaultBankAccount('conta-2');
            
            expect(mockBatch.update).toHaveBeenCalledWith(
                { id: 'conta-1' },
                { isDefault: false }
            );
            expect(mockBatch.update).toHaveBeenCalledWith(
                { id: 'conta-2' },
                { isDefault: true }
            );
            expect(mockBatch.commit).toHaveBeenCalledTimes(1);
        });
    });

});