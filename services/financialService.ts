// src/services/financialService.ts
import { db } from "@/lib/firebaseConfig";
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy, where } from "firebase/firestore";
import { format } from "date-fns";
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