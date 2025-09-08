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
    date?: Timestamp; // Mantido para retrocompatibilidade
    dataMovimento: Timestamp; 
    dataEmissao?: Timestamp;
    status: 'pendente' | 'pago';
    appointmentId?: string;
    professionalId?: string;
    patientId?: string;
    patientName?: string; // Incluído para facilitar relatórios
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
    dataMovimento: Date;
    dataEmissao?: Date;
    status: 'pendente' | 'pago';
    appointmentId?: string;
    professionalId?: string;
    patientId?: string;
    patientName?: string; 
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
    currentBalance: number;
    isDefault?: boolean;
}

export interface Budget {
  id: string;
  receitaPrevista: number;
  despesaPrevista: number;
}

// --- LÓGICA DE ATUALIZAÇÃO DE SALDO ---

const updateBalance = (transaction: any, bankAccountId: string, value: number) => {
    if (!bankAccountId || value === 0) return;
    const bankAccountRef = doc(db, "bankAccounts", bankAccountId);
    transaction.update(bankAccountRef, { currentBalance: increment(value) });
};


// --- FUNÇÕES DE TRANSAÇÃO ---

export const addTransaction = async (data: TransactionFormData) => {
    const newDocRef = doc(collection(db, "transactions"));
    try {
        await runTransaction(db, async (transaction) => {
            const transactionData = { 
                ...data, 
                dataMovimento: Timestamp.fromDate(data.dataMovimento),
                ...(data.dataEmissao && { dataEmissao: Timestamp.fromDate(data.dataEmissao) })
            };
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
                    valueChange = value;
                } else if (oldStatus === 'pago' && newStatus === 'pendente') {
                    valueChange = -value;
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
                const valueChange = txData.type === 'receita' ? -txData.value : txData.value;
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
        const { dataMovimento, dataEmissao, repetitions, description, ...rest } = data;
        const batch = writeBatch(db);
        const blockId = doc(collection(db, 'idGenerator')).id;
        for (let i = 0; i < repetitions; i++) {
            const transactionDate = addMonths(new Date(dataMovimento), i);
            const newDocRef = doc(collection(db, "transactions"));
            const transactionData = { 
                ...rest, 
                description: `${description} (${i + 1}/${repetitions})`, 
                dataMovimento: Timestamp.fromDate(transactionDate), 
                ...(dataEmissao && { dataEmissao: Timestamp.fromDate(new Date(dataEmissao)) }),
                blockId 
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

const normalizeTransaction = (doc: any): Transaction => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        dataMovimento: data.dataMovimento || data.date,
    };
};

export const getTransactionsByPeriod = async (startDate: Date, endDate: Date): Promise<Transaction[]> => {
    try {
        const qNew = query(collection(db, "transactions"), where("dataMovimento", ">=", Timestamp.fromDate(startDate)), where("dataMovimento", "<=", Timestamp.fromDate(endDate)));
        const qOld = query(collection(db, "transactions"), where("date", ">=", Timestamp.fromDate(startDate)), where("date", "<=", Timestamp.fromDate(endDate)));

        const [newSnapshot, oldSnapshot] = await Promise.all([getDocs(qNew), getDocs(qOld)]);

        const allDocs = new Map<string, Transaction>();
        newSnapshot.forEach(doc => allDocs.set(doc.id, normalizeTransaction(doc)));
        oldSnapshot.forEach(doc => allDocs.set(doc.id, normalizeTransaction(doc)));
        
        const results = Array.from(allDocs.values());
        results.sort((a, b) => b.dataMovimento.toDate().getTime() - a.dataMovimento.toDate().getTime());
        
        return results;
    } catch (e) {
        console.error("Erro ao buscar transações: ", e);
        return [];
    }
};

export const updateTransaction = async (id: string, data: Partial<TransactionFormData>) => {
    try {
        const { dataMovimento, dataEmissao, ...rest } = data;
        const updateData: any = { ...rest, date: null }; 
        if (dataMovimento) updateData.dataMovimento = Timestamp.fromDate(dataMovimento);
        if (dataEmissao) updateData.dataEmissao = Timestamp.fromDate(dataEmissao);
        
        await updateDoc(doc(db, "transactions", id), updateData);
        return { success: true };
    } catch (e) {
        return { success: false, error: "Falha ao atualizar a transação." };
    }
};

export const getTransactionsForReport = async (options: { type?: 'receita' | 'despesa'; startDate: Date; endDate: Date; bankAccountId?: string; status?: 'pago' | 'pendente'; }): Promise<Transaction[]> => {
    try {
        const allTransactions = await getTransactionsByPeriod(options.startDate, options.endDate);
        
        return allTransactions.filter(tx => {
            const typeMatch = !options.type || tx.type === options.type;
            const bankAccountMatch = !options.bankAccountId || tx.bankAccountId === options.bankAccountId;
            const statusMatch = !options.status || tx.status === options.status;
            return typeMatch && bankAccountMatch && statusMatch;
        });
    } catch (error) {
        console.error("Erro ao buscar transações para relatório:", error);
        return [];
    }
};

export const getAllPaidTransactions = async (): Promise<Transaction[]> => {
    try {
        const transactionsRef = collection(db, "transactions");
        const q = query(transactionsRef, where('status', '==', 'pago'), orderBy('dataMovimento', 'asc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(normalizeTransaction);
    } catch (error) {
        console.error("Erro ao buscar todas as transações pagas:", error);
        return [];
    }
};

export const getPendingTransactions = async (options: { type: 'receita' | 'despesa'; startDate: Date; endDate: Date }): Promise<Transaction[]> => {
    try {
        const allTransactions = await getTransactionsByPeriod(options.startDate, options.endDate);
        const pending = allTransactions.filter(tx => tx.status === 'pendente' && tx.type === options.type);
        pending.sort((a, b) => a.dataMovimento.toDate().getTime() - b.dataMovimento.toDate().getTime());
        return pending;
    } catch (error) {
        console.error(`Erro ao buscar contas a ${options.type === 'receita' ? 'receber' : 'pagar'}:`, error);
        return [];
    }
};

export const getOverdueExpenses = async (): Promise<Transaction[]> => {
  try {
    const hoje = new Date();
    const fimDoDia = new Date(hoje.setHours(23, 59, 59, 999));

    const qNew = query(collection(db, "transactions"),
      where("type", "==", "despesa"),
      where("status", "==", "pendente"),
      where("dataMovimento", "<=", Timestamp.fromDate(fimDoDia))
    );
    const qOld = query(collection(db, "transactions"),
      where("type", "==", "despesa"),
      where("status", "==", "pendente"),
      where("date", "<=", Timestamp.fromDate(fimDoDia))
    );

    const [newSnapshot, oldSnapshot] = await Promise.all([getDocs(qNew), getDocs(qOld)]);
    const allDocs = new Map<string, Transaction>();
    
    const normalizeAndAdd = (doc: any) => {
        const data = doc.data();
        const transaction: Transaction = {
            id: doc.id,
            ...data,
            dataMovimento: data.dataMovimento || data.date, 
        };
        allDocs.set(doc.id, transaction);
    };

    newSnapshot.forEach(normalizeAndAdd);
    oldSnapshot.forEach(normalizeAndAdd);

    const results = Array.from(allDocs.values());
    results.sort((a, b) => a.dataMovimento.toDate().getTime() - b.dataMovimento.toDate().getTime());
    
    return results;
  } catch (error) {
    console.error("Erro ao buscar despesas vencidas:", error);
    return [];
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
export const addAccountPlan = async (data: Omit<AccountPlan, 'id'>) => { try { await addDoc(collection(db, "accountPlans"), data); return { success: true }; } catch (e) { return { success: false, error: "Falha ao adicionar plano de contas." }; }};
export const updateAccountPlan = async (id: string, data: Partial<Omit<AccountPlan, 'id'>>) => { try { await updateDoc(doc(db, "accountPlans", id), data); return { success: true }; } catch (e) { return { success: false, error: "Falha ao atualizar plano de contas." }; }};
export const deleteAccountPlan = async (id: string) => { try { await deleteDoc(doc(db, "accountPlans", id)); return { success: true }; } catch (e) { return { success: false, error: "Falha ao excluir plano de contas." }; }};
export const getSuppliers = async (): Promise<Supplier[]> => { try { const q = query(collection(db, "suppliers"), orderBy("name")); const querySnapshot = await getDocs(q); return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)); } catch (e) { console.error("Erro ao buscar fornecedores: ", e); return []; }};
export const addSupplier = async (data: Omit<Supplier, 'id' | 'status'>) => { try { await addDoc(collection(db, "suppliers"), { ...data, status: "Ativo" }); return { success: true }; } catch (e) { return { success: false, error: "Falha ao adicionar fornecedor." }; }};
export const updateSupplier = async (id: string, data: Partial<Omit<Supplier, 'id'>>) => { try { await updateDoc(doc(db, "suppliers", id), data); return { success: true }; } catch (e) { return { success: false, error: "Falha ao atualizar fornecedor." }; }};
export const deleteSupplier = async (id: string) => { try { await deleteDoc(doc(db, "suppliers", id)); return { success: true }; } catch (e) { return { success: false, error: "Falha ao excluir fornecedor." }; }};
export const getCovenants = async (): Promise<Covenant[]> => { try { const q = query(collection(db, "covenants"), orderBy("name")); const querySnapshot = await getDocs(q); return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Covenant)); } catch (e) { console.error("Erro ao buscar convênios: ", e); return []; }};
export const addCovenant = async (data: Omit<Covenant, 'id' | 'status'>) => { try { await addDoc(collection(db, "covenants"), { ...data, status: "Ativo" }); return { success: true }; } catch (e) { return { success: false, error: "Falha ao adicionar convênio." }; }};
export const updateCovenant = async (id: string, data: Partial<Omit<Covenant, 'id'>>) => { try { await updateDoc(doc(db, "covenants", id), data); return { success: true }; } catch (e) { return { success: false, error: "Falha ao atualizar convênio." }; }};
export const deleteCovenant = async (id: string) => { try { await deleteDoc(doc(db, "covenants", id)); return { success: true }; } catch (e) { return { success: false, error: "Falha ao excluir convênio." }; }};

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

export const addBankAccount = async (data: Omit<BankAccount, 'id' | 'currentBalance'>) => {
    try {
        const dataWithBalance = { ...data, currentBalance: data.initialBalance };
        await addDoc(collection(db, "bankAccounts"), dataWithBalance);
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

export const setDefaultBankAccount = async (defaultAccountId: string) => {
    const batch = writeBatch(db);
    try {
        const accountsSnapshot = await getDocs(collection(db, "bankAccounts"));
        
        accountsSnapshot.forEach(docSnapshot => {
            const accountRef = doc(db, "bankAccounts", docSnapshot.id);
            const isDefault = docSnapshot.id === defaultAccountId;
            batch.update(accountRef, { isDefault: isDefault });
        });

        await batch.commit();
        return { success: true };
    } catch (e) {
        console.error("Erro ao definir conta padrão: ", e);
        return { success: false, error: "Falha ao definir a conta padrão." };
    }
};

export const getExpensesByCostCenter = async (startDate: Date, endDate: Date) => { try { const despesas = await getTransactionsForReport({ type: 'despesa', startDate, endDate, status: 'pago' }); return despesas.reduce((acc, despesa) => { const center = despesa.costCenter || 'Sem Centro de Custo'; if (!acc[center]) acc[center] = { total: 0, count: 0, transactions: [] }; acc[center].total += despesa.value; acc[center].count += 1; acc[center].transactions.push(despesa); return acc; }, {} as Record<string, { total: number, count: number, transactions: Transaction[] }>); } catch (error) { console.error("Erro ao agrupar despesas por centro de custo:", error); return {}; }};
export const getBudgetForMonth = async (monthId: string): Promise<Budget | null> => { try { const docRef = doc(db, 'budgets', monthId); const docSnap = await getDoc(docRef); return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Budget : null; } catch (error) { console.error("Erro ao buscar orçamento do mês:", error); return null; }};
export const setBudgetForMonth = async (monthId: string, data: Partial<Omit<Budget, 'id'>>) => { try { const docRef = doc(db, 'budgets', monthId); await setDoc(docRef, data, { merge: true }); return { success: true }; } catch (error) { console.error("Erro ao salvar orçamento do mês:", error); return { success: false, error: "Falha ao salvar a meta financeira." }; }};

export const getFinancialSummaryByCategory = async (startDate: Date, endDate: Date) => {
  try {
    const paidTransactions = await getTransactionsForReport({ startDate, endDate, status: 'pago' });
    
    return paidTransactions.reduce((acc, tx) => {
      const category = tx.category || 'Sem Categoria';
      if (!acc[category]) {
        acc[category] = { receitas: 0, despesas: 0, total: 0, count: 0 };
      }

      if (tx.type === 'receita') {
        acc[category].receitas += tx.value;
        acc[category].total += tx.value;
      } else {
        acc[category].despesas += tx.value;
        acc[category].total -= tx.value;
      }
      acc[category].count += 1;
      
      return acc;
    }, {} as Record<string, { receitas: number, despesas: number, total: number, count: number }>);

  } catch (error) {
    console.error("Erro ao agrupar transações por categoria:", error);
    return {};
  }
};

export const getFinancialSummaryByPatient = async (startDate: Date, endDate: Date, patientId?: string) => {
  try {
    const paidTransactions = await getTransactionsForReport({ startDate, endDate, status: 'pago' });

    const filteredTransactions = patientId 
        ? paidTransactions.filter(tx => tx.patientId === patientId) 
        : paidTransactions;

    return filteredTransactions.reduce((acc, tx) => {
      if (!tx.patientId) return acc;

      const id = tx.patientId;
      if (!acc[id]) {
        const patientName = tx.patientName || `Paciente (ID: ...${id.slice(-4)})`;
        acc[id] = { patientName: patientName, receitas: 0, despesas: 0, saldo: 0 };
      }

      if (tx.type === 'receita') {
        acc[id].receitas += tx.value;
      } else if (tx.type === 'despesa') {
        acc[id].despesas += tx.value;
      }

      acc[id].saldo = acc[id].receitas - acc[id].despesas;
      
      return acc;
    }, {} as Record<string, { patientName: string, receitas: number, despesas: number, saldo: number }>);

  } catch (error) {
    console.error("Erro ao calcular rentabilidade por paciente:", error);
    return {};
  }
};