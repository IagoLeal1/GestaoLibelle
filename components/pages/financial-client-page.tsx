// components/pages/financial-client-page.tsx
"use client"
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Wallet } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { db } from "@/lib/firebaseConfig";
import { doc, writeBatch } from "firebase/firestore";

// Services
import {
    getTransactionsByPeriod, Transaction, TransactionFormData,
    getAccountPlans, AccountPlan, addTransaction, updateTransactionStatus,
    deleteTransaction, updateTransaction, addAccountPlan, updateAccountPlan,
    deleteAccountPlan, getSuppliers, addSupplier, updateSupplier, deleteSupplier, Supplier,
    getCovenants, addCovenant, updateCovenant, deleteCovenant, Covenant,
    getBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, BankAccount,
    setDefaultBankAccount,
    getTransactionsForReport, getPendingTransactions, getExpensesByCostCenter,
    createTransactionBlock, TransactionBlockFormData,
    getAllPaidTransactions,
    getOverdueExpenses,
    getFinancialSummaryByCategory,
    getFinancialSummaryByPatient,
} from "@/services/financialService";
import {
    getCostCenters, CostCenter, addCostCenter, updateCostCenter, deleteCostCenter,
    getProfessionalsForRepasse, Professional,
    getCompanyData, updateCompanyData, CompanyData
} from "@/services/settingsService";
import { getPatients, Patient } from "@/services/patientService";

// Modals
import { AddTransactionModal, FormValues as AddTransactionFormValues } from "@/components/modals/add-transaction-modal";
import { EditTransactionModal } from "@/components/modals/edit-transaction-modal";
import { AddEditAccountPlanModal } from "@/components/modals/add-edit-account-plan-modal";
import { AddEditCostCenterModal } from "@/components/modals/add-edit-cost-center-modal";
import { AddEditSupplierModal } from "@/components/modals/add-edit-supplier-modal";
import { AddEditCovenantModal } from "@/components/modals/add-edit-covenant-modal";
import { AddEditBankAccountModal } from "@/components/modals/add-edit-bank-account-modal";
import { FinancialReportModal, ReportType } from "@/components/financial/financial-report-modal";
import { FluxoDeCaixaModal } from "@/components/financial/fluxo-de-caixa-modal";
import { FutureForecastsModal } from "@/components/financial/future-forecasts-modal";
import { FinancialGoalsModal } from "@/components/financial/financial-goals-modal";
import { AnaliseTendenciasModal } from "@/components/financial/analise-tendencias-modal";
import { ComparativoMensalModal } from "@/components/financial/comparativo-mensal-modal";
import { BankBalancesModal } from "@/components/financial/bank-balances-modal";
import { OverdueExpensesModal } from "@/components/financial/overdue-expenses-modal";

// Componentes Refatorados
import { FinancialSummaryCards } from "@/components/financial/financial-summary-cards";
import { FinancialFilters } from "@/components/financial/financial-filters";
import { SettingsDashboard } from "@/components/financial/settings-dashboard";
import { FinancialTable } from "@/components/financial/financial-table";
import { ProfessionalRepasseDashboard } from "@/components/dashboards/professional-repasse-dashboard";
import { FinancialReportsDashboard } from "@/components/financial/financial-reports-dashboard";


export default function FinancialClientPage() {
    const [activeTab, setActiveTab] = useState("despesas");

    // Estados de Dados
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [overdueExpenses, setOverdueExpenses] = useState<Transaction[]>([]);
    const [accountPlans, setAccountPlans] = useState<{ receitas: AccountPlan[], despesas: AccountPlan[] }>({ receitas: [], despesas: [] });
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [covenants, setCovenants] = useState<Covenant[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [companyData, setCompanyData] = useState<CompanyData | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);

    // Estados de Controle de UI
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    
    // Estados dos Modais
    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState<ReportType | null>(null);
    const [isFluxoDeCaixaModalOpen, setIsFluxoDeCaixaModalOpen] = useState(false);
    const [isFutureForecastsModalOpen, setIsFutureForecastsModalOpen] = useState(false);
    const [isFinancialGoalsModalOpen, setIsFinancialGoalsModalOpen] = useState(false);
    const [isAnaliseTendenciasModalOpen, setIsAnaliseTendenciasModalOpen] = useState(false);
    const [isComparativoMensalModalOpen, setIsComparativoMensalModalOpen] = useState(false);
    const [isBankBalancesModalOpen, setIsBankBalancesModalOpen] = useState(false);
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isAccountPlanModalOpen, setIsAccountPlanModalOpen] = useState(false);
    const [selectedAccountPlan, setSelectedAccountPlan] = useState<Partial<AccountPlan> | null>(null);
    const [isCostCenterModalOpen, setIsCostCenterModalOpen] = useState(false);
    const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [isCovenantModalOpen, setIsCovenantModalOpen] = useState(false);
    const [selectedCovenant, setSelectedCovenant] = useState<Covenant | null>(null);
    const [isBankAccountModalOpen, setIsBankAccountModalOpen] = useState(false);
    const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const startDate = startOfDay(new Date(dateFrom));
        const endDate = endOfDay(new Date(dateTo));
        const [
            transactionsData, overdueData, plansData, centersData, suppliersData,
            covenantsData, bankAccountsData, professionalsData, companyInfo, patientsData
        ] = await Promise.all([
            getTransactionsByPeriod(startDate, endDate), getOverdueExpenses(), getAccountPlans(),
            getCostCenters(), getSuppliers(), getCovenants(), getBankAccounts(),
            getProfessionalsForRepasse(), getCompanyData(), getPatients()
        ]);
        setTransactions(transactionsData);
        setOverdueExpenses(overdueData);
        setAccountPlans(plansData);
        setCostCenters(centersData);
        setSuppliers(suppliersData);
        setCovenants(covenantsData);
        setBankAccounts(bankAccountsData);
        setProfessionals(professionalsData);
        setCompanyData(companyInfo);
        setPatients(patientsData);
        setLoading(false);
    }, [dateFrom, dateTo]);

    useEffect(() => { fetchData(); }, [fetchData]);
    
    const handleOpenReportModal = (type: ReportType) => {
        setReportType(type);
        setIsReportModalOpen(true);
    };

    const handleOpenVisualizer = (type: ReportType) => {
        if (type === 'fluxo_caixa') setIsFluxoDeCaixaModalOpen(true);
        else if (type === 'previsoes_futuras') setIsFutureForecastsModalOpen(true);
        else if (type === 'metas_financeiras') setIsFinancialGoalsModalOpen(true);
        else if (type === 'analise_tendencias') setIsAnaliseTendenciasModalOpen(true);
        else if (type === 'comparativo_mensal') setIsComparativoMensalModalOpen(true);
        else alert(`Visualizador para ${type} está em desenvolvimento.`);
    };

    const handleGenerateReport = async (params: any) => {
        const { reportType, startDate: startDateStr, endDate: endDateStr, ...filters } = params;
        if (!startDateStr || !endDateStr) {
            toast.error("Datas de início e fim são obrigatórias.");
            return;
        }
        const startDate = startOfDay(new Date(startDateStr));
        const endDate = endOfDay(new Date(endDateStr));
        let dataToExport: any[] = [];
        let headers: string[] = [];
        let fileName = `${reportType}_${startDateStr}_a_${endDateStr}.csv`;

        switch (reportType) {
            case 'contas_pagas':
                headers = ["Data Pagamento", "Descricao", "Categoria", "Centro de Custo", "Valor Pago"];
                const paidTransactions = await getTransactionsForReport({ type: 'despesa', status: 'pago', startDate, endDate });
                dataToExport = paidTransactions.map(tx => [ format(tx.dataMovimento.toDate(), 'dd/MM/yyyy'), `"${tx.description}"`, tx.category, tx.costCenter, tx.value.toFixed(2).replace('.', ',') ]);
                break;
            case 'contas_recebidas':
                headers = ["Data Recebimento", "Descricao", "Categoria", "Centro de Custo", "Valor Recebido"];
                const receivedTransactions = await getTransactionsForReport({ type: 'receita', status: 'pago', startDate, endDate });
                dataToExport = receivedTransactions.map(tx => [ format(tx.dataMovimento.toDate(), 'dd/MM/yyyy'), `"${tx.description}"`, tx.category, tx.costCenter, tx.value.toFixed(2).replace('.', ',') ]);
                break;
            case 'receitas': case 'despesas': case 'fluxo_caixa':
                headers = ["Data Movimento", "Data Emissão", "Tipo", "Categoria", "Descricao", "Centro de Custo", "Status", "Valor"];
                const reportTransactions = await getTransactionsForReport({ type: reportType === 'fluxo_caixa' ? undefined : reportType, startDate, endDate });
                dataToExport = reportTransactions.map(tx => [ format(tx.dataMovimento.toDate(), 'dd/MM/yyyy'), tx.dataEmissao ? format(tx.dataEmissao.toDate(), 'dd/MM/yyyy') : '', tx.type, tx.category, `"${tx.description}"`, tx.costCenter, tx.status, tx.value.toFixed(2).replace('.', ',') ]);
                break;
            case 'contas_a_pagar': case 'contas_a_receber':
                headers = ["Data Vencimento", "Descricao", "Categoria", "Valor Pendente"];
                const pendingType = reportType === 'contas_a_pagar' ? 'despesa' : 'receita';
                const pendingTransactions = await getPendingTransactions({ type: pendingType, startDate, endDate });
                dataToExport = pendingTransactions.map(tx => [ format(tx.dataMovimento.toDate(), 'dd/MM/yyyy'), `"${tx.description}"`, tx.category, tx.value.toFixed(2).replace('.', ',') ]);
                break;
            case 'despesas_por_centro_custo':
                headers = ["Centro de Custo", "Total Despesas", "Qtd. Transacoes"];
                const expensesByCenter = await getExpensesByCostCenter(startDate, endDate);
                dataToExport = Object.entries(expensesByCenter).map(([center, data]) => [ center, data.total.toFixed(2).replace('.', ','), data.count ]);
                break;
            case 'despesas_por_categoria':
                headers = ["Categoria", "Total Receitas", "Total Despesas", "Saldo", "Qtd. Transacoes"];
                const summaryByCategory = await getFinancialSummaryByCategory(startDate, endDate);
                dataToExport = Object.entries(summaryByCategory).map(([category, data]) => [
                    `"${category}"`,
                    data.receitas.toFixed(2).replace('.', ','),
                    data.despesas.toFixed(2).replace('.', ','),
                    data.total.toFixed(2).replace('.', ','),
                    data.count
                ]);
                break;
            case 'rentabilidade_paciente':
                headers = ["Paciente", "Total Receitas", "Total Despesas (Repasses)", "Rentabilidade"];
                const patientId = filters.patientId === 'todos' ? undefined : filters.patientId;
                const summaryByPatient = await getFinancialSummaryByPatient(startDate, endDate, patientId);
                dataToExport = Object.values(summaryByPatient).map(data => [
                    `"${data.patientName}"`,
                    data.receitas.toFixed(2).replace('.', ','),
                    data.despesas.toFixed(2).replace('.', ','),
                    data.saldo.toFixed(2).replace('.', ',')
                ]);
                break;
            case 'movimentacao_bancaria':
                headers = ["Data Movimento", "Tipo", "Descricao", "Categoria", "Status", "Valor"];
                const bankTransactions = await getTransactionsForReport({ startDate, endDate, bankAccountId: filters.bankAccountId });
                dataToExport = bankTransactions.map(tx => [ format(tx.dataMovimento.toDate(), 'dd/MM/yyyy'), tx.type, `"${tx.description}"`, tx.category, tx.status, tx.value.toFixed(2).replace('.', ',') ]);
                const bank = bankAccounts.find(b => b.id === filters.bankAccountId);
                fileName = `extrato_${bank?.name.replace(/\s+/g, '_') || 'banco'}_${startDateStr}_a_${endDateStr}.csv`;
                break;
            default:
                toast.error("Tipo de relatório não reconhecido.");
                return;
        }

        if (dataToExport.length === 0) {
            toast.info("Nenhum dado encontrado para os filtros selecionados.");
            return;
        }

        const csvContent = [ headers.join(';'), ...dataToExport.map(row => row.join(';')) ].join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Relatório gerado com sucesso!");
    };

    const handleAddTransaction = async (data: AddTransactionFormValues, isBlock: boolean) => {
        setIsSubmitting(true);
        const dataWithDateObjects = { ...data, dataMovimento: new Date(data.dataMovimento), ...(data.dataEmissao && { dataEmissao: new Date(data.dataEmissao) }) };
        const result = isBlock ? await createTransactionBlock({ ...dataWithDateObjects, repetitions: data.repetitions || 1 } as TransactionBlockFormData) : await addTransaction(dataWithDateObjects as TransactionFormData);
        if (result.success) { toast.success(`Movimentação ${isBlock ? 'sequencial registrada' : 'registrada'}!`); setIsAddTransactionModalOpen(false); fetchData(); } else { toast.error(result.error); }
        setIsSubmitting(false);
    };

    const handleUpdateTransaction = async (data: Partial<TransactionFormData>) => { if (!selectedTransaction) return; setIsSubmitting(true); const result = await updateTransaction(selectedTransaction.id, data); if (result.success) { toast.success("Transação atualizada!"); setIsEditTransactionModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleUpdateStatus = async (tx: Transaction) => { const newStatus = tx.status === 'pago' ? 'pendente' : 'pago'; const result = await updateTransactionStatus(tx.id, newStatus); if (result.success) { toast.success(`Status alterado.`); fetchData(); } else { toast.error(result.error); } };
    const handleDeleteTransaction = async (tx: Transaction) => { if (window.confirm(`Excluir "${tx.description}"?`)) { const result = await deleteTransaction(tx.id); if (result.success) { toast.success("Transação excluída!"); fetchData(); } else { toast.error(result.error); } } };
    const handleAddAccountPlan = async (data: any) => { setIsSubmitting(true); const result = await addAccountPlan(data); if (result.success) { toast.success("Conta adicionada!"); setIsAccountPlanModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleUpdateAccountPlan = async (data: any) => { if (!selectedAccountPlan?.id) return; setIsSubmitting(true); const result = await updateAccountPlan(selectedAccountPlan.id, data); if (result.success) { toast.success("Conta atualizada!"); setIsAccountPlanModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleDeleteAccountPlan = async (id: string) => { if(window.confirm("Excluir conta?")) { const result = await deleteAccountPlan(id); if (result.success) { toast.success("Conta excluída!"); fetchData(); } else { toast.error(result.error); } } };
    const handleAddCostCenter = async (data: any) => { setIsSubmitting(true); const result = await addCostCenter(data.name); if (result.success) { toast.success("Centro de custo adicionado!"); setIsCostCenterModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleUpdateCostCenter = async (data: any) => { if (!selectedCostCenter) return; setIsSubmitting(true); const result = await updateCostCenter(selectedCostCenter.id, data.name); if (result.success) { toast.success("Centro de custo atualizado!"); setIsCostCenterModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleDeleteCostCenter = async (id: string) => { if(window.confirm("Excluir centro de custo?")) { const result = await deleteCostCenter(id); if (result.success) { toast.success("Centro de custo excluído!"); fetchData(); } else { toast.error(result.error); } } };
    const handleAddSupplier = async (data: any) => { setIsSubmitting(true); const result = await addSupplier(data); if (result.success) { toast.success("Fornecedor adicionado!"); setIsSupplierModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleUpdateSupplier = async (data: any) => { if (!selectedSupplier) return; setIsSubmitting(true); const result = await updateSupplier(selectedSupplier.id, data); if (result.success) { toast.success("Fornecedor atualizado!"); setIsSupplierModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleDeleteSupplier = async (id: string) => { if(window.confirm("Excluir fornecedor?")) { const result = await deleteSupplier(id); if (result.success) { toast.success("Fornecedor excluído!"); fetchData(); } else { toast.error(result.error); } } };
    const handleAddCovenant = async (data: any) => { setIsSubmitting(true); const result = await addCovenant(data); if (result.success) { toast.success("Convênio adicionado!"); setIsCovenantModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleUpdateCovenant = async (data: any) => { if (!selectedCovenant) return; setIsSubmitting(true); const result = await updateCovenant(selectedCovenant.id, data); if (result.success) { toast.success("Convênio atualizado!"); setIsCovenantModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleDeleteCovenant = async (id: string) => { if(window.confirm("Excluir convênio?")) { const result = await deleteCovenant(id); if (result.success) { toast.success("Convênio excluído!"); fetchData(); } else { toast.error(result.error); } } };
    const handleAddBankAccount = async (data: any) => { setIsSubmitting(true); const result = await addBankAccount(data); if (result.success) { toast.success("Conta adicionada!"); setIsBankAccountModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleUpdateBankAccount = async (data: any) => { if (!selectedBankAccount) return; setIsSubmitting(true); const result = await updateBankAccount(selectedBankAccount.id, data); if (result.success) { toast.success("Conta atualizada!"); setIsBankAccountModalOpen(false); fetchData(); } else { toast.error(result.error); } setIsSubmitting(false); };
    const handleDeleteBankAccount = async (id: string) => { if(window.confirm("Excluir conta?")) { const result = await deleteBankAccount(id); if (result.success) { toast.success("Conta excluída!"); fetchData(); } else { toast.error(result.error); } } };
    const handleUpdateCompanyData = async (data: CompanyData) => { setIsSubmitting(true); const result = await updateCompanyData(data); if (result.success) { toast.success("Dados da empresa atualizados com sucesso!"); fetchData(); } else { toast.error(result.error || "Falha ao salvar os dados da empresa."); } setIsSubmitting(false); };
    
    const handleSetDefaultBankAccount = async (id: string) => {
        const result = await setDefaultBankAccount(id);
        if (result.success) {
            toast.success("Conta padrão atualizada com sucesso!");
            fetchData();
        } else {
            toast.error(result.error || "Falha ao definir a conta padrão.");
        }
    };

    const filteredTransactions = useMemo(() => transactions.filter(mov => mov.description.toLowerCase().includes(searchTerm.toLowerCase())), [transactions, searchTerm]);
    const receitas = filteredTransactions.filter(t => t.type === 'receita');
    const despesas = filteredTransactions.filter(t => t.type === 'despesa');
    const totalReceitas = receitas.reduce((acc, mov) => acc + mov.value, 0);
    const totalDespesas = despesas.reduce((acc, mov) => acc + mov.value, 0);
    const saldoFinal = totalReceitas - totalDespesas;

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div><h1 className="text-3xl font-bold text-gray-900">Financeiro</h1><p className="text-gray-600">Gestão completa das finanças da clínica</p></div>
                    <div className="flex w-full sm:w-auto gap-2">
                        <Button onClick={() => setIsAddTransactionModalOpen(true)} className="bg-primary-teal hover:bg-primary-teal/90 w-full"><Plus className="mr-2 h-4 w-4" />Nova Movimentação</Button>
                        <Button onClick={() => setIsBankBalancesModalOpen(true)} className="bg-primary-dark-blue hover:bg-primary-dark-blue/90 w-full"><Wallet className="mr-2 h-4 w-4" />Saldos Bancários</Button>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5"><TabsTrigger value="despesas">Despesas</TabsTrigger><TabsTrigger value="receitas">Receitas</TabsTrigger><TabsTrigger value="repasses">Repasses</TabsTrigger><TabsTrigger value="relatorios">Relatórios</TabsTrigger><TabsTrigger value="configuracoes">Configurações</TabsTrigger></TabsList>
                    <div className="mt-6 space-y-6">
                        <FinancialSummaryCards totalDespesas={totalDespesas} totalReceitas={totalReceitas} saldoFinal={saldoFinal} totalTransacoes={filteredTransactions.length} />
                        <FinancialFilters dateFrom={dateFrom} dateTo={dateTo} searchTerm={searchTerm} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onSearchTermChange={setSearchTerm} />
                    </div>

                    <TabsContent value="despesas" className="mt-6"><FinancialTable title="Despesas" data={despesas} type="despesa" loading={loading} onAddTransaction={() => setIsAddTransactionModalOpen(true)} onEditTransaction={(tx) => { setSelectedTransaction(tx); setIsEditTransactionModalOpen(true); }} onUpdateStatus={handleUpdateStatus} onDeleteTransaction={handleDeleteTransaction} bankAccounts={bankAccounts} /></TabsContent>
                    <TabsContent value="receitas" className="mt-6"><FinancialTable title="Receitas" data={receitas} type="receita" loading={loading} onAddTransaction={() => setIsAddTransactionModalOpen(true)} onEditTransaction={(tx) => { setSelectedTransaction(tx); setIsEditTransactionModalOpen(true); }} onUpdateStatus={handleUpdateStatus} onDeleteTransaction={handleDeleteTransaction} bankAccounts={bankAccounts} /></TabsContent>
                    <TabsContent value="repasses" className="mt-6"><ProfessionalRepasseDashboard transactions={transactions} professionals={professionals} loading={loading} /></TabsContent>
                    <TabsContent value="relatorios" className="mt-6">
                        <FinancialReportsDashboard 
                            onGenerateReport={handleOpenReportModal} 
                            onOpenVisualizer={handleOpenVisualizer}
                            overdueCount={overdueExpenses.length}
                            onOpenOverdueModal={() => setIsOverdueModalOpen(true)}
                        />
                    </TabsContent>
                    <TabsContent value="configuracoes" className="mt-6">
                        <SettingsDashboard
                            accountPlans={accountPlans} costCenters={costCenters} suppliers={suppliers} covenants={covenants} bankAccounts={bankAccounts} loading={loading}
                            companyData={companyData}
                            onUpdateCompanyData={handleUpdateCompanyData}
                            onAddAccountPlan={(category) => { setSelectedAccountPlan({ category }); setIsAccountPlanModalOpen(true); }}
                            onEditAccountPlan={(plan) => { setSelectedAccountPlan(plan); setIsAccountPlanModalOpen(true); }}
                            onDeleteAccountPlan={handleDeleteAccountPlan}
                            onAddCostCenter={() => { setSelectedCostCenter(null); setIsCostCenterModalOpen(true); }}
                            onEditCostCenter={(center) => { setSelectedCostCenter(center); setIsCostCenterModalOpen(true); }}
                            onDeleteCostCenter={handleDeleteCostCenter}
                            onAddSupplier={() => { setSelectedSupplier(null); setIsSupplierModalOpen(true); }}
                            onEditSupplier={(supplier) => { setSelectedSupplier(supplier); setIsSupplierModalOpen(true); }}
                            onDeleteSupplier={handleDeleteSupplier}
                            onAddCovenant={() => { setSelectedCovenant(null); setIsCovenantModalOpen(true); }}
                            onEditCovenant={(covenant) => { setSelectedCovenant(covenant); setIsCovenantModalOpen(true); }}
                            onDeleteCovenant={handleDeleteCovenant}
                            onAddBankAccount={() => { setSelectedBankAccount(null); setIsBankAccountModalOpen(true); }}
                            onEditBankAccount={(account) => { setSelectedBankAccount(account); setIsBankAccountModalOpen(true); }}
                            onDeleteBankAccount={handleDeleteBankAccount}
                            onSetDefaultBankAccount={handleSetDefaultBankAccount}
                            onRecalculateBalances={async () => {
                                setLoading(true);
                                toast.info("Recalculando saldos... Isso pode levar um momento.");
                                const allPaid = await getAllPaidTransactions();
                                const allAccounts = await getBankAccounts();
                                const batch = writeBatch(db);

                                for (const account of allAccounts) {
                                    const accountRef = doc(db, "bankAccounts", account.id);
                                    const txsForAccount = allPaid.filter(tx => tx.bankAccountId === account.id);
                                    const balanceChange = txsForAccount.reduce((acc, tx) => acc + (tx.type === 'receita' ? tx.value : -tx.value), 0);
                                    const newBalance = account.initialBalance + balanceChange;
                                    batch.update(accountRef, { currentBalance: newBalance });
                                }
                                await batch.commit();
                                toast.success("Saldos recalculados e atualizados com sucesso!");
                                fetchData();
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </div>
            
            <OverdueExpensesModal 
                isOpen={isOverdueModalOpen}
                onClose={() => setIsOverdueModalOpen(false)}
                transactions={overdueExpenses}
                onUpdateStatus={handleUpdateStatus}
            />

            <AddTransactionModal isOpen={isAddTransactionModalOpen} onClose={() => setIsAddTransactionModalOpen(false)} onSubmit={handleAddTransaction} accountPlans={accountPlans} costCenters={costCenters} bankAccounts={bankAccounts} isLoading={isSubmitting} />
            <EditTransactionModal isOpen={isEditTransactionModalOpen} onClose={() => setIsEditTransactionModalOpen(false)} onSubmit={handleUpdateTransaction} transaction={selectedTransaction} accountPlans={accountPlans} costCenters={costCenters} bankAccounts={bankAccounts} isLoading={isSubmitting} />
            <AddEditAccountPlanModal isOpen={isAccountPlanModalOpen} onClose={() => { setIsAccountPlanModalOpen(false); setSelectedAccountPlan(null); }} onSubmit={selectedAccountPlan?.id ? handleUpdateAccountPlan : handleAddAccountPlan} accountPlan={selectedAccountPlan} isLoading={isSubmitting} />
            <AddEditCostCenterModal isOpen={isCostCenterModalOpen} onClose={() => { setIsCostCenterModalOpen(false); setSelectedCostCenter(null); }} onSubmit={selectedCostCenter?.id ? handleUpdateCostCenter : handleAddCostCenter} costCenter={selectedCostCenter} isLoading={isSubmitting} />
            <AddEditSupplierModal isOpen={isSupplierModalOpen} onClose={() => { setIsSupplierModalOpen(false); setSelectedSupplier(null); }} onSubmit={selectedSupplier?.id ? handleUpdateSupplier : handleAddSupplier} supplier={selectedSupplier} isLoading={isSubmitting} />
            <AddEditCovenantModal isOpen={isCovenantModalOpen} onClose={() => { setIsCovenantModalOpen(false); setSelectedCovenant(null); }} onSubmit={selectedCovenant?.id ? handleUpdateCovenant : handleAddCovenant} covenant={selectedCovenant} isLoading={isSubmitting} />
            <AddEditBankAccountModal isOpen={isBankAccountModalOpen} onClose={() => { setIsBankAccountModalOpen(false); setSelectedBankAccount(null); }} onSubmit={selectedBankAccount?.id ? handleUpdateBankAccount : handleAddBankAccount} bankAccount={selectedBankAccount} isLoading={isSubmitting} />
            <FinancialReportModal 
                isOpen={isReportModalOpen} 
                onClose={() => setIsReportModalOpen(false)} 
                onGenerate={handleGenerateReport} 
                reportType={reportType} 
                costCenters={costCenters} 
                bankAccounts={bankAccounts}
                patients={patients}
            />
            <FluxoDeCaixaModal isOpen={isFluxoDeCaixaModalOpen} onClose={() => setIsFluxoDeCaixaModalOpen(false)} />
            <FutureForecastsModal isOpen={isFutureForecastsModalOpen} onClose={() => setIsFutureForecastsModalOpen(false)} />
            <FinancialGoalsModal isOpen={isFinancialGoalsModalOpen} onClose={() => setIsFinancialGoalsModalOpen(false)} />
            <AnaliseTendenciasModal isOpen={isAnaliseTendenciasModalOpen} onClose={() => setIsAnaliseTendenciasModalOpen(false)} />
            <ComparativoMensalModal isOpen={isComparativoMensalModalOpen} onClose={() => setIsComparativoMensalModalOpen(false)} />
            
            <BankBalancesModal 
                isOpen={isBankBalancesModalOpen}
                onClose={() => setIsBankBalancesModalOpen(false)}
                accounts={bankAccounts}
                loading={loading}
            />
        </>
    );
}