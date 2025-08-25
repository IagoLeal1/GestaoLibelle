// components/pages/financial-client-page.tsx
"use client"
import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

// Services
import {
    getTransactionsByPeriod, Transaction, TransactionFormData,
    getAccountPlans, AccountPlan, addTransaction, updateTransactionStatus,
    deleteTransaction, updateTransaction, addAccountPlan, updateAccountPlan,
    deleteAccountPlan, getSuppliers, addSupplier, updateSupplier, deleteSupplier, Supplier,
    getCovenants, addCovenant, updateCovenant, deleteCovenant, Covenant,
    getBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, BankAccount,
    getTransactionsForReport, getPendingTransactions, getExpensesByCostCenter,
    createTransactionBlock, TransactionBlockFormData
} from "@/services/financialService";
import {
    getCostCenters, CostCenter, addCostCenter, updateCostCenter, deleteCostCenter,
    getProfessionalsForRepasse, Professional
} from "@/services/settingsService";

// Modals
import { AddTransactionModal, FormValues as AddTransactionFormValues } from "@/components/modals/add-transaction-modal";
import { EditTransactionModal } from "@/components/modals/edit-transaction-modal";
import { AddEditAccountPlanModal } from "@/components/modals/add-edit-account-plan-modal";
import { AddEditCostCenterModal } from "@/components/modals/add-edit-cost-center-modal";
import { AddEditSupplierModal } from "@/components/modals/add-edit-supplier-modal";
import { AddEditCovenantModal } from "@/components/modals/add-edit-covenant-modal";
import { AddEditBankAccountModal } from "@/components/modals/add-edit-bank-account-modal";
import { FinancialReportModal, ReportType } from "@/components/financial/financial-report-modal";

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
    const [accountPlans, setAccountPlans] = useState<{ receitas: AccountPlan[], despesas: AccountPlan[] }>({ receitas: [], despesas: [] });
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [covenants, setCovenants] = useState<Covenant[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);

    // Estados de Controle de UI
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportType, setReportType] = useState<ReportType | null>(null);

    // Estados para Modais de Transação
    const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
    const [isEditTransactionModalOpen, setIsEditTransactionModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

    // Estados para Modais de Configuração
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
        const [ transactionsData, plansData, centersData, suppliersData, covenantsData, bankAccountsData, professionalsData ] = await Promise.all([
            getTransactionsByPeriod(startDate, endDate), getAccountPlans(), getCostCenters(),
            getSuppliers(), getCovenants(), getBankAccounts(), getProfessionalsForRepasse()
        ]);
        setTransactions(transactionsData);
        setAccountPlans(plansData);
        setCostCenters(centersData);
        setSuppliers(suppliersData);
        setCovenants(covenantsData);
        setBankAccounts(bankAccountsData);
        setProfessionals(professionalsData);
        setLoading(false);
    }, [dateFrom, dateTo]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleOpenReportModal = (type: ReportType) => {
        setReportType(type);
        setIsReportModalOpen(true);
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
                const paidTransactions = await getTransactionsForReport({
                    type: 'despesa',
                    status: 'pago',
                    startDate,
                    endDate
                });
                dataToExport = paidTransactions.map(tx => [
                    format(tx.date.toDate(), 'dd/MM/yyyy'), `"${tx.description}"`, tx.category, tx.costCenter, tx.value.toFixed(2).replace('.', ',')
                ]);
                break;
            case 'contas_recebidas':
                headers = ["Data Recebimento", "Descricao", "Categoria", "Centro de Custo", "Valor Recebido"];
                const receivedTransactions = await getTransactionsForReport({
                    type: 'receita',
                    status: 'pago',
                    startDate,
                    endDate
                });
                dataToExport = receivedTransactions.map(tx => [
                    format(tx.date.toDate(), 'dd/MM/yyyy'), `"${tx.description}"`, tx.category, tx.costCenter, tx.value.toFixed(2).replace('.', ',')
                ]);
                break;
            case 'receitas':
            case 'despesas':
            case 'fluxo_caixa':
                headers = ["Data", "Tipo", "Categoria", "Descricao", "Centro de Custo", "Status", "Valor"];
                const reportTransactions = await getTransactionsForReport({
                    type: reportType === 'fluxo_caixa' ? undefined : reportType,
                    startDate,
                    endDate
                });
                dataToExport = reportTransactions.map(tx => [
                    format(tx.date.toDate(), 'dd/MM/yyyy'), tx.type, tx.category, `"${tx.description}"`, tx.costCenter, tx.status, tx.value.toFixed(2).replace('.', ',')
                ]);
                break;
            case 'contas_a_pagar':
            case 'contas_a_receber':
                headers = ["Data Vencimento", "Descricao", "Categoria", "Valor Pendente"];
                const pendingType = reportType === 'contas_a_pagar' ? 'despesa' : 'receita';
                const pendingTransactions = await getPendingTransactions({ type: pendingType, startDate, endDate });
                dataToExport = pendingTransactions.map(tx => [
                    format(tx.date.toDate(), 'dd/MM/yyyy'), `"${tx.description}"`, tx.category, tx.value.toFixed(2).replace('.', ',')
                ]);
                break;
            case 'despesas_por_centro_custo':
                headers = ["Centro de Custo", "Total Despesas", "Qtd. Transacoes"];
                const expensesByCenter = await getExpensesByCostCenter(startDate, endDate);
                dataToExport = Object.entries(expensesByCenter).map(([center, data]) => [
                    center, data.total.toFixed(2).replace('.', ','), data.count
                ]);
                break;
            case 'movimentacao_bancaria':
                headers = ["Data", "Tipo", "Descricao", "Categoria", "Status", "Valor"];
                const bankTransactions = await getTransactionsForReport({
                    startDate,
                    endDate,
                    bankAccountId: filters.bankAccountId,
                });
                dataToExport = bankTransactions.map(tx => [
                    format(tx.date.toDate(), 'dd/MM/yyyy'),
                    tx.type,
                    `"${tx.description}"`,
                    tx.category,
                    tx.status,
                    tx.value.toFixed(2).replace('.', ',')
                ]);
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
        let result;
        const transactionDataWithDateObject = { ...data, date: new Date(data.date) };
        if (isBlock) {
            result = await createTransactionBlock(transactionDataWithDateObject as TransactionBlockFormData);
        } else {
            result = await addTransaction(transactionDataWithDateObject);
        }
        if (result.success) {
            toast.success(`Movimentação ${isBlock ? 'sequencial registrada' : 'registrada'}!`);
            setIsAddTransactionModalOpen(false);
            fetchData();
        } else {
            toast.error(result.error);
        }
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
                    <Button onClick={() => setIsAddTransactionModalOpen(true)} className="bg-primary-teal hover:bg-primary-teal/90"><Plus className="mr-2 h-4 w-4" />Nova Movimentação</Button>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5"><TabsTrigger value="despesas">Despesas</TabsTrigger><TabsTrigger value="receitas">Receitas</TabsTrigger><TabsTrigger value="repasses">Repasses</TabsTrigger><TabsTrigger value="relatorios">Relatórios</TabsTrigger><TabsTrigger value="configuracoes">Configurações</TabsTrigger></TabsList>
                    <div className="mt-6 space-y-6">
                        <FinancialSummaryCards totalDespesas={totalDespesas} totalReceitas={totalReceitas} saldoFinal={saldoFinal} totalTransacoes={filteredTransactions.length} />
                        <FinancialFilters dateFrom={dateFrom} dateTo={dateTo} searchTerm={searchTerm} onDateFromChange={setDateFrom} onDateToChange={setDateTo} onSearchTermChange={setSearchTerm} />
                    </div>

                    <TabsContent value="despesas" className="mt-6">
                        <FinancialTable title="Despesas" data={despesas} type="despesa" loading={loading} onAddTransaction={() => setIsAddTransactionModalOpen(true)} onEditTransaction={(tx) => { setSelectedTransaction(tx); setIsEditTransactionModalOpen(true); }} onUpdateStatus={handleUpdateStatus} onDeleteTransaction={handleDeleteTransaction} bankAccounts={bankAccounts} />
                    </TabsContent>
                    <TabsContent value="receitas" className="mt-6">
                        <FinancialTable title="Receitas" data={receitas} type="receita" loading={loading} onAddTransaction={() => setIsAddTransactionModalOpen(true)} onEditTransaction={(tx) => { setSelectedTransaction(tx); setIsEditTransactionModalOpen(true); }} onUpdateStatus={handleUpdateStatus} onDeleteTransaction={handleDeleteTransaction} bankAccounts={bankAccounts} />
                    </TabsContent>
                    <TabsContent value="repasses" className="mt-6">
                        <ProfessionalRepasseDashboard transactions={transactions} professionals={professionals} loading={loading} />
                    </TabsContent>
                    <TabsContent value="relatorios" className="mt-6">
                        <FinancialReportsDashboard onGenerateReport={handleOpenReportModal} onOpenVisualizer={(type) => alert(`Visualizador para ${type} em desenvolvimento.`)} />
                    </TabsContent>
                    <TabsContent value="configuracoes" className="mt-6">
                        <SettingsDashboard
                            accountPlans={accountPlans} costCenters={costCenters} suppliers={suppliers} covenants={covenants} bankAccounts={bankAccounts} loading={loading}
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
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <AddTransactionModal
                isOpen={isAddTransactionModalOpen}
                onClose={() => setIsAddTransactionModalOpen(false)}
                onSubmit={handleAddTransaction}
                accountPlans={accountPlans}
                costCenters={costCenters}
                bankAccounts={bankAccounts}
                isLoading={isSubmitting}
            />
            <EditTransactionModal
                isOpen={isEditTransactionModalOpen}
                onClose={() => setIsEditTransactionModalOpen(false)}
                onSubmit={handleUpdateTransaction}
                transaction={selectedTransaction}
                accountPlans={accountPlans}
                costCenters={costCenters}
                bankAccounts={bankAccounts}
                isLoading={isSubmitting}
            />
            <AddEditAccountPlanModal isOpen={isAccountPlanModalOpen} onClose={() => { setIsAccountPlanModalOpen(false); setSelectedAccountPlan(null); }} onSubmit={selectedAccountPlan?.id ? handleUpdateAccountPlan : handleAddAccountPlan} accountPlan={selectedAccountPlan} isLoading={isSubmitting} />
            <AddEditCostCenterModal isOpen={isCostCenterModalOpen} onClose={() => { setIsCostCenterModalOpen(false); setSelectedCostCenter(null); }} onSubmit={selectedCostCenter?.id ? handleUpdateCostCenter : handleAddCostCenter} costCenter={selectedCostCenter} isLoading={isSubmitting} />
            <AddEditSupplierModal isOpen={isSupplierModalOpen} onClose={() => { setIsSupplierModalOpen(false); setSelectedSupplier(null); }} onSubmit={selectedSupplier?.id ? handleUpdateSupplier : handleAddSupplier} supplier={selectedSupplier} isLoading={isSubmitting} />
            <AddEditCovenantModal isOpen={isCovenantModalOpen} onClose={() => { setIsCovenantModalOpen(false); setSelectedCovenant(null); }} onSubmit={selectedCovenant?.id ? handleUpdateCovenant : handleAddCovenant} covenant={selectedCovenant} isLoading={isSubmitting} />
            <AddEditBankAccountModal isOpen={isBankAccountModalOpen} onClose={() => { setIsBankAccountModalOpen(false); setSelectedBankAccount(null); }} onSubmit={selectedBankAccount?.id ? handleUpdateBankAccount : handleAddBankAccount} bankAccount={selectedBankAccount} isLoading={isSubmitting} />
            <FinancialReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} reportType={reportType} costCenters={costCenters} bankAccounts={bankAccounts} />
        </>
    );
}