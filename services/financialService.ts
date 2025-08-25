// src/services/financialService.ts
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy, where, writeBatch } from "firebase/firestore";
import { format, addMonths } from "date-fns";
import { Timestamp } from "firebase/firestore";

// Interfaces de Dados
export interface Transaction {
    id: string;
    type: 'receita' | 'despesa';
    description: string;
    value: number;
    date: Timestamp;
    status: 'pendente' | 'pago';
    appointmentId?: string;
    professionalId?: string;
    patientId?: string;
    supplierId?: string;
    category: string;
    costCenter: string;
    bankAccountId?: string;
    blockId?: string;
}

export interface TransactionFormData {
    type: 'receita' | 'despesa';
    description: string;
    value: number;
    date: Date;
    status: 'pendente' | 'pago';
    appointmentId?: string;
    professionalId?: string;
    patientId?: string;
    supplierId?: string;
    category: string;
    costCenter: string;
    bankAccountId?: string;
}

export interface TransactionBlockFormData extends TransactionFormData {
    repetitions: number;
}

export interface AccountPlan {
    id: string;
    code: string;
    name: string;
    category: 'receita' | 'despesa';
}

export interface Supplier {
    id: string;
    name: string;
    cnpj: string;
    phone: string;
    email: string;
    address: string;
    status: 'Ativo' | 'Inativo';
}

export interface Covenant {
    id: string;
    name: string;
    cnpj: string;
    phone: string;
    email: string;
    address: string;
    status: 'Ativo' | 'Inativo';
    valuePerConsult: number;
}

export interface BankAccount {
    id: string;
    name: string;
    agency: string;
    account: string;
    type: 'Conta Corrente' | 'Conta Poupança' | 'Conta Salário';
    initialBalance: number;
}

export interface Budget {
  id: string;
  receitaPrevista: number;
  despesaPrevista: number;
}

/**
 * Encontra e deleta uma transação de repasse baseada no ID do agendamento.
 */
export const deleteTransactionByAppointmentId = async (appointmentId: string) => {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef, where("appointmentId", "==", appointmentId));
    
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return { success: true }; 
        }

        const batch = writeBatch(db);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        return { success: true };
    } catch (e) {
        console.error("Erro ao deletar transação por ID de agendamento: ", e);
        return { success: false, error: "Falha ao remover repasse antigo." };
    }
};

/**
 * Cria múltiplas transações sequenciais (mês a mês).
 */
export const createTransactionBlock = async (data: TransactionBlockFormData) => {
    try {
        const { date, repetitions, description, ...rest } = data;
        const batch = writeBatch(db);
        const blockId = doc(collection(db, 'idGenerator')).id;

        for (let i = 0; i < repetitions; i++) {
            const transactionDate = addMonths(new Date(date), i);
            const newDocRef = doc(collection(db, "transactions"));

            const transactionData = {
                ...rest,
                description: `${description} (${i + 1}/${repetitions})`,
                date: Timestamp.fromDate(transactionDate),
                blockId: blockId,
            };

            batch.set(newDocRef, transactionData);
        }

        await batch.commit();
        return { success: true };
    } catch (e) {
        console.error("Erro ao criar transações em lote: ", e);
        return { success: false, error: "Falha ao registrar movimentações sequenciais." };
    }
};

// Funções para Transações
export const getTransactionsByPeriod = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    try {
        const q = query(
            collection(db, "transactions"),
            where("date", ">=", Timestamp.fromDate(startDate)),
            where("date", "<=", Timestamp.fromDate(endDate)),
            orderBy("date", "desc")
        );
        const querySnapshot = await getDocs(q);
        const transactions = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Transaction));
        return transactions;
    } catch (e) {
        console.error("Erro ao buscar transações: ", e);
        return [];
    }
};

export const addTransaction = async (data: TransactionFormData) => {
    try {
        const { date, ...rest } = data;
        await addDoc(collection(db, "transactions"), {
            ...rest,
            date: Timestamp.fromDate(date),
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao registrar movimentação." };
    }
};

export const updateTransaction = async (id: string, data: Partial<TransactionFormData>) => {
    try {
        const { date, ...rest } = data;
        const updateData: any = rest;
        if (date) {
            updateData.date = Timestamp.fromDate(date);
        }
        await updateDoc(doc(db, "transactions", id), updateData);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar a transação." };
    }
};

export const deleteTransaction = async (id: string) => {
    try {
        await deleteDoc(doc(db, "transactions", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao excluir a transação." };
    }
};

export const updateTransactionStatus = async (id: string, status: 'pendente' | 'pago') => {
    try {
        await updateDoc(doc(db, "transactions", id), { status });
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar status." };
    }
};

// Funções para Plano de Contas
export const getAccountPlans = async (): Promise<{ receitas: AccountPlan[], despesas: AccountPlan[] }> => {
    try {
        const q = query(collection(db, "accountPlans"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const plans = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AccountPlan));
        const receitas = plans.filter(p => p.category === 'receita');
        const despesas = plans.filter(p => p.category === 'despesa');
        return { receitas, despesas };
    } catch (e) {
        console.error("Erro ao buscar planos de contas: ", e);
        return { receitas: [], despesas: [] };
    }
};

export const addAccountPlan = async (data: Omit<AccountPlan, 'id'>) => {
    try {
        await addDoc(collection(db, "accountPlans"), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao adicionar plano de contas." };
    }
};

export const updateAccountPlan = async (id: string, data: Partial<Omit<AccountPlan, 'id'>>) => {
    try {
        await updateDoc(doc(db, "accountPlans", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar plano de contas." };
    }
};

export const deleteAccountPlan = async (id: string) => {
    try {
        await deleteDoc(doc(db, "accountPlans", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao excluir plano de contas." };
    }
};

// Funções para Fornecedores
export const getSuppliers = async (): Promise<Supplier[]> => {
    try {
        const q = query(collection(db, "suppliers"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const suppliers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Supplier));
        return suppliers;
    } catch (e) {
        console.error("Erro ao buscar fornecedores: ", e);
        return [];
    }
};

export const addSupplier = async (data: Omit<Supplier, 'id' | 'status'>) => {
    try {
        await addDoc(collection(db, "suppliers"), { ...data, status: "Ativo" });
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao adicionar fornecedor." };
    }
};

export const updateSupplier = async (id: string, data: Partial<Omit<Supplier, 'id'>>) => {
    try {
        await updateDoc(doc(db, "suppliers", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar fornecedor." };
    }
};

export const deleteSupplier = async (id: string) => {
    try {
        await deleteDoc(doc(db, "suppliers", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao excluir fornecedor." };
    }
};

// Funções para Convênios
export const getCovenants = async (): Promise<Covenant[]> => {
    try {
        const q = query(collection(db, "covenants"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const covenants = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Covenant));
        return covenants;
    } catch (e) {
        console.error("Erro ao buscar convênios: ", e);
        return [];
    }
};

export const addCovenant = async (data: Omit<Covenant, 'id' | 'status'>) => {
    try {
        await addDoc(collection(db, "covenants"), { ...data, status: "Ativo" });
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao adicionar convênio." };
    }
};

export const updateCovenant = async (id: string, data: Partial<Omit<Covenant, 'id'>>) => {
    try {
        await updateDoc(doc(db, "covenants", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar convênio." };
    }
};

export const deleteCovenant = async (id: string) => {
    try {
        await deleteDoc(doc(db, "covenants", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao excluir convênio." };
    }
};

// Funções para Contas Bancárias
export const getBankAccounts = async (): Promise<BankAccount[]> => {
    try {
        const q = query(collection(db, "bankAccounts"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const accounts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BankAccount));
        return accounts;
    } catch (e) {
        console.error("Erro ao buscar contas bancárias: ", e);
        return [];
    }
};

export const addBankAccount = async (data: Omit<BankAccount, 'id'>) => {
    try {
        await addDoc(collection(db, "bankAccounts"), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao adicionar conta bancária." };
    }
};

export const updateBankAccount = async (id: string, data: Partial<Omit<BankAccount, 'id'>>) => {
    try {
        await updateDoc(doc(db, "bankAccounts", id), data);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar conta bancária." };
    }
};

export const deleteBankAccount = async (id: string) => {
    try {
        await deleteDoc(doc(db, "bankAccounts", id));
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao excluir conta bancária." };
    }
};

/**
 * Busca transações para exportação com base em múltiplos filtros.
 */
/**
 * Busca transações para exportação com base em múltiplos filtros.
 */
export const getTransactionsForReport = async (options: { 
    type?: 'receita' | 'despesa';
    startDate: Date; 
    endDate: Date;
    bankAccountId?: string;
    status?: 'pago' | 'pendente'; // <-- CAMPO ADICIONADO
}): Promise<Transaction[]> => {
    try {
        const transactionsRef = collection(db, 'transactions');
        let q = query(
          transactionsRef,
          where('date', '>=', Timestamp.fromDate(options.startDate)),
          where('date', '<=', Timestamp.fromDate(options.endDate)),
          orderBy('date', 'desc')
        );

        if (options.type) {
            q = query(q, where('type', '==', options.type));
        }
        if (options.bankAccountId) {
             q = query(q, where('bankAccountId', '==', options.bankAccountId));
        }
        // --- LÓGICA DE FILTRO ADICIONADA ---
        if (options.status) {
             q = query(q, where('status', '==', options.status));
        }

        const snapshot = await getDocs(q);
        if (snapshot.empty) return [];
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
        console.error("Erro ao buscar transações para relatório:", error);
        return [];
    }
};

export const getPendingTransactions = async (options: { 
    type: 'receita' | 'despesa';
    startDate: Date; 
    endDate: Date 
}): Promise<Transaction[]> => {
    try {
        const transactionsRef = collection(db, 'transactions');
        const q = query(
          transactionsRef,
          where('status', '==', 'pendente'),
          where('type', '==', options.type),
          where('date', '>=', Timestamp.fromDate(options.startDate)),
          where('date', '<=', Timestamp.fromDate(options.endDate)),
          orderBy('date', 'asc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
        console.error(`Erro ao buscar contas a ${options.type === 'receita' ? 'receber' : 'pagar'}:`, error);
        return [];
    }
};

export const getExpensesByCostCenter = async (startDate: Date, endDate: Date) => {
    try {
        const despesas = await getTransactionsForReport({ type: 'despesa', startDate, endDate });

        const expensesByCenter = despesas.reduce((acc, despesa) => {
            const center = despesa.costCenter || 'Sem Centro de Custo';
            if (!acc[center]) {
                acc[center] = { total: 0, count: 0, transactions: [] };
            }
            acc[center].total += despesa.value;
            acc[center].count += 1;
            acc[center].transactions.push(despesa);
            return acc;
        }, {} as Record<string, { total: number, count: number, transactions: Transaction[] }>);

        return expensesByCenter;
    } catch (error) {
        console.error("Erro ao agrupar despesas por centro de custo:", error);
        return {};
    }
};

export const getBudgetsForPeriod = async (periodIds: string[]): Promise<Budget[]> => {
    if (periodIds.length === 0) {
        return [];
    }
    try {
        const budgetsRef = collection(db, 'budgets');
        const q = query(budgetsRef, where('__name__', 'in', periodIds));
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Budget));
    } catch (error) {
        console.error("Erro ao buscar orçamentos:", error);
        return [];
    }
};