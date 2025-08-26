// src/services/financialService.ts
import { db } from "@/lib/firebaseConfig";
import { 
    collection, addDoc, updateDoc, doc, deleteDoc, getDocs, getDoc, 
    query, orderBy, where, writeBatch, setDoc, runTransaction, increment 
} from "firebase/firestore";
import { format, addMonths } from "date-fns";
import { Timestamp } from "firebase/firestore";

// --- INTERFACES ---

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
    currentBalance: number; // Agora é um campo obrigatório
}

export interface Budget {
  id: string;
  receitaPrevista: number;
  despesaPrevista: number;
}

// --- LÓGICA DE ATUALIZAÇÃO DE SALDO ---

/**
 * Atualiza o saldo de uma conta bancária de forma atômica dentro de uma transação do Firestore.
 */
const updateBalance = (transaction: any, bankAccountId: string, value: number) => {
    if (!bankAccountId || value === 0) return;
    const bankAccountRef = doc(db, "bankAccounts", bankAccountId);
    transaction.update(bankAccountRef, { currentBalance: increment(value) });
};


// --- FUNÇÕES DE TRANSAÇÃO ATUALIZADAS PARA CONTROLAR SALDO ---

export const addTransaction = async (data: TransactionFormData) => {
    const newDocRef = doc(collection(db, "transactions"));
    try {
        await runTransaction(db, async (transaction) => {
            const transactionData = { ...data, date: Timestamp.fromDate(data.date) };
            transaction.set(newDocRef, transactionData);

            if (data.status === 'pago' && data.bankAccountId) {
                const valueChange = data.type === 'receita' ? data.value : -data.value;
                updateBalance(transaction, data.bankAccountId, valueChange);
            }
        });
        return { success: true };
    } catch (e) {
        console.error("Erro ao adicionar transação: ", e);
        return { success: false, error: "Falha ao registrar movimentação." };
    }
};

export const updateTransactionStatus = async (id: string, newStatus: 'pendente' | 'pago') => {
    const transactionRef = doc(db, "transactions", id);
    try {
        await runTransaction(db, async (transaction) => {
            const txDoc = await transaction.get(transactionRef);
            if (!txDoc.exists()) throw "Transação não encontrada!";
            
            const txData = txDoc.data() as Transaction;
            const oldStatus = txData.status;

            if (oldStatus === newStatus) return;

            transaction.update(transactionRef, { status: newStatus });

            if (txData.bankAccountId) {
                const value = txData.type === 'receita' ? txData.value : -txData.value;
                let valueChange = 0;
                
                if (oldStatus === 'pendente' && newStatus === 'pago') {
                    valueChange = value; // Aplica o valor
                } else if (oldStatus === 'pago' && newStatus === 'pendente') {
                    valueChange = -value; // Reverte o valor
                }
                
                if (valueChange !== 0) {
                    updateBalance(transaction, txData.bankAccountId, valueChange);
                }
            }
        });
        return { success: true };
    } catch (e) {
        console.error("Erro ao atualizar status: ", e);
        return { success: false, error: "Falha ao atualizar status." };
    }
};

export const deleteTransaction = async (id: string) => {
    const transactionRef = doc(db, "transactions", id);
    try {
        await runTransaction(db, async (transaction) => {
            const txDoc = await transaction.get(transactionRef);
            if (!txDoc.exists()) return;

            const txData = txDoc.data() as Transaction;

            if (txData.status === 'pago' && txData.bankAccountId) {
                const valueChange = txData.type === 'receita' ? -txData.value : txData.value; // Reverte o valor
                updateBalance(transaction, txData.bankAccountId, valueChange);
            }

            transaction.delete(transactionRef);
        });
        return { success: true };
    } catch (e) {
        console.error("Erro ao excluir transação: ", e);
        return { success: false, error: "Falha ao excluir a transação." };
    }
};

export const addBankAccount = async (data: Omit<BankAccount, 'id' | 'currentBalance'>) => {
    try {
        const dataWithBalance = { ...data, currentBalance: data.initialBalance };
        await addDoc(collection(db, "bankAccounts"), dataWithBalance);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao adicionar conta bancária." };
    }
};

// --- RESTANTE DAS FUNÇÕES (Mantidas para integridade do arquivo) ---

export const deleteTransactionByAppointmentId = async (appointmentId: string) => {
    const transactionsRef = collection(db, "transactions");
    const q = query(transactionsRef, where("appointmentId", "==", appointmentId));
    try {
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return { success: true }; 
        const batch = writeBatch(db);
        querySnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return { success: true };
    } catch (e) {
        console.error("Erro ao deletar transação por ID de agendamento: ", e);
        return { success: false, error: "Falha ao remover repasse antigo." };
    }
};

export const createTransactionBlock = async (data: TransactionBlockFormData) => {
    try {
        const { date, repetitions, description, ...rest } = data;
        const batch = writeBatch(db);
        const blockId = doc(collection(db, 'idGenerator')).id;
        for (let i = 0; i < repetitions; i++) {
            const transactionDate = addMonths(new Date(date), i);
            const newDocRef = doc(collection(db, "transactions"));
            const transactionData = { ...rest, description: `${description} (${i + 1}/${repetitions})`, date: Timestamp.fromDate(transactionDate), blockId };
            batch.set(newDocRef, transactionData);
        }
        await batch.commit();
        return { success: true };
    } catch (e) {
        console.error("Erro ao criar transações em lote: ", e);
        return { success: false, error: "Falha ao registrar movimentações sequenciais." };
    }
};

export const getTransactionsByPeriod = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    try {
        const q = query(collection(db, "transactions"), where("date", ">=", Timestamp.fromDate(startDate)), where("date", "<=", Timestamp.fromDate(endDate)), orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (e) {
        console.error("Erro ao buscar transações: ", e);
        return [];
    }
};

export const updateTransaction = async (id: string, data: Partial<TransactionFormData>) => {
    try {
        const { date, ...rest } = data;
        const updateData: any = rest;
        if (date) updateData.date = Timestamp.fromDate(date);
        await updateDoc(doc(db, "transactions", id), updateData);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar a transação." };
    }
};

export const getAccountPlans = async (): Promise<{ receitas: AccountPlan[], despesas: AccountPlan[] }> => {
    try {
        const q = query(collection(db, "accountPlans"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AccountPlan));
        return {
            receitas: plans.filter(p => p.category === 'receita'),
            despesas: plans.filter(p => p.category === 'despesa')
        };
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

export const getSuppliers = async (): Promise<Supplier[]> => {
    try {
        const q = query(collection(db, "suppliers"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
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

export const getCovenants = async (): Promise<Covenant[]> => {
    try {
        const q = query(collection(db, "covenants"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Covenant));
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

export const getBankAccounts = async (): Promise<BankAccount[]> => {
    try {
        const q = query(collection(db, "bankAccounts"), orderBy("name"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount));
    } catch (e) {
        console.error("Erro ao buscar contas bancárias: ", e);
        return [];
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

export const getTransactionsForReport = async (options: { type?: 'receita' | 'despesa'; startDate: Date; endDate: Date; bankAccountId?: string; status?: 'pago' | 'pendente'; }): Promise<Transaction[]> => {
    try {
        const transactionsRef = collection(db, 'transactions');
        let q = query(transactionsRef, where('date', '>=', Timestamp.fromDate(options.startDate)), where('date', '<=', Timestamp.fromDate(options.endDate)), orderBy('date', 'desc'));
        if (options.type) q = query(q, where('type', '==', options.type));
        if (options.bankAccountId) q = query(q, where('bankAccountId', '==', options.bankAccountId));
        if (options.status) q = query(q, where('status', '==', options.status));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
        console.error("Erro ao buscar transações para relatório:", error);
        return [];
    }
};

export const getPendingTransactions = async (options: { type: 'receita' | 'despesa'; startDate: Date; endDate: Date }): Promise<Transaction[]> => {
    try {
        const transactionsRef = collection(db, 'transactions');
        const q = query(transactionsRef, where('status', '==', 'pendente'), where('type', '==', options.type), where('date', '>=', Timestamp.fromDate(options.startDate)), where('date', '<=', Timestamp.fromDate(options.endDate)), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
        console.error(`Erro ao buscar contas a ${options.type === 'receita' ? 'receber' : 'pagar'}:`, error);
        return [];
    }
};

export const getExpensesByCostCenter = async (startDate: Date, endDate: Date) => {
    try {
        const despesas = await getTransactionsForReport({ type: 'despesa', startDate, endDate, status: 'pago' });
        return despesas.reduce((acc, despesa) => {
            const center = despesa.costCenter || 'Sem Centro de Custo';
            if (!acc[center]) acc[center] = { total: 0, count: 0, transactions: [] };
            acc[center].total += despesa.value;
            acc[center].count += 1;
            acc[center].transactions.push(despesa);
            return acc;
        }, {} as Record<string, { total: number, count: number, transactions: Transaction[] }>);
    } catch (error) {
        console.error("Erro ao agrupar despesas por centro de custo:", error);
        return {};
    }
};

export const getBudgetForMonth = async (monthId: string): Promise<Budget | null> => {
    try {
        const docRef = doc(db, 'budgets', monthId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Budget : null;
    } catch (error) {
        console.error("Erro ao buscar orçamento do mês:", error);
        return null;
    }
};

export const setBudgetForMonth = async (monthId: string, data: Partial<Omit<Budget, 'id'>>) => {
    try {
        const docRef = doc(db, 'budgets', monthId);
        await setDoc(docRef, data, { merge: true });
        return { success: true };
    } catch (error) {
        console.error("Erro ao salvar orçamento do mês:", error);
        return { success: false, error: "Falha ao salvar a meta financeira." };
    }
};

export const getAllPaidTransactions = async (): Promise<Transaction[]> => {
    try {
        const transactionsRef = collection(db, "transactions");
        const q = query(transactionsRef, where('status', '==', 'pago'), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
        console.error("Erro ao buscar todas as transações pagas:", error);
        return [];
    }
};