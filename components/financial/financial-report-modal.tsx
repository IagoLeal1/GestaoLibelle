// components/financial/financial-report-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { CostCenter } from "@/services/settingsService";
import { BankAccount } from "@/services/financialService";
import { Patient } from "@/services/patientService"; // Importando o tipo Patient

// Tipos de relatório atualizados para incluir os novos
export type ReportType =
    | 'receitas'
    | 'despesas'
    | 'fluxo_caixa'
    | 'contas_a_pagar'
    | 'contas_a_receber'
    | 'despesas_por_centro_custo'
    | 'despesas_por_categoria' // Novo
    | 'rentabilidade_paciente' // Novo
    | 'movimentacao_bancaria'
    | 'previsoes_futuras'
    | 'metas_financeiras'
    | 'analise_tendencias'
    | 'comparativo_mensal'
    | 'contas_pagas'
    | 'contas_recebidas';

export interface FinancialReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (params: any) => Promise<void>;
    reportType: ReportType | null;
    costCenters: CostCenter[];
    bankAccounts: BankAccount[];
    patients: Patient[]; // Adicionada a prop para receber a lista de pacientes
}

// Títulos atualizados para os novos relatórios
const reportTitles: Record<ReportType, string> = {
    receitas: "Relatório Geral de Receitas",
    despesas: "Relatório Geral de Despesas",
    fluxo_caixa: "Relatório de Fluxo de Caixa",
    contas_a_pagar: "Relatório de Contas a Pagar",
    contas_a_receber: "Relatório de Contas a Receber",
    despesas_por_centro_custo: "Despesas por Centro de Custo",
    despesas_por_categoria: "Relatório por Categoria", // Novo
    rentabilidade_paciente: "Relatório de Rentabilidade por Paciente", // Novo
    movimentacao_bancaria: "Movimentação por Conta Bancária",
    contas_pagas: "Relatório de Contas Pagas",
    contas_recebidas: "Relatório de Contas Recebidas",
    previsoes_futuras: "Previsões Futuras",
    metas_financeiras: "Metas Financeiras Anuais",
    analise_tendencias: "Análise de Tendências e Indicadores",
    comparativo_mensal: "Comparativo Mensal"
};

export function FinancialReportModal({ isOpen, onClose, onGenerate, reportType, costCenters, bankAccounts, patients }: FinancialReportModalProps) {
    const [params, setParams] = useState({
        startDate: "",
        endDate: "",
        costCenter: "todos",
        bankAccountId: "todos",
        patientId: "todos", // Adicionado estado para o filtro de paciente
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reseta todos os filtros ao abrir o modal
            setParams({ startDate: "", endDate: "", costCenter: "todos", bankAccountId: "todos", patientId: "todos" });
        }
    }, [isOpen]);

    const handleGenerateClick = async () => {
        if (!params.startDate || !params.endDate) {
            alert("Por favor, selecione o período completo.");
            return;
        }
        if (reportType === 'movimentacao_bancaria' && params.bankAccountId === 'todos') {
            alert("Por favor, selecione uma conta bancária para gerar o relatório.");
            return;
        }
        setLoading(true);
        await onGenerate({ ...params, reportType });
        setLoading(false);
        onClose();
    };

    if (!reportType) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{reportTitles[reportType]}</DialogTitle>
                    <DialogDescription>Selecione os filtros desejados para gerar o seu relatório.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Data de Início *</Label>
                            <Input type="date" value={params.startDate} onChange={e => setParams(p => ({...p, startDate: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Data de Fim *</Label>
                            <Input type="date" value={params.endDate} onChange={e => setParams(p => ({...p, endDate: e.target.value}))} />
                        </div>
                    </div>
                    
                    {reportType === 'despesas_por_centro_custo' && (
                        <div className="space-y-2">
                            <Label>Centro de Custo</Label>
                            <Select onValueChange={(v) => setParams(p => ({...p, costCenter: v}))} value={params.costCenter}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    {costCenters.map((c: CostCenter) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    
                    {reportType === 'movimentacao_bancaria' && (
                        <div className="space-y-2">
                            <Label>Conta Bancária *</Label>
                            <Select onValueChange={(v) => setParams(p => ({...p, bankAccountId: v}))} value={params.bankAccountId}>
                                <SelectTrigger><SelectValue placeholder="Selecione uma conta..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos" disabled>Selecione uma conta...</SelectItem>
                                    {bankAccounts.map((account: BankAccount) => <SelectItem key={account.id} value={account.id}>{account.name} - {account.account}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Filtro condicional para o relatório de rentabilidade por paciente */}
                    {reportType === 'rentabilidade_paciente' && (
                        <div className="space-y-2">
                            <Label>Paciente</Label>
                            <Select onValueChange={(v) => setParams(p => ({...p, patientId: v}))} value={params.patientId}>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos os Pacientes</SelectItem>
                                    {patients.map((p: Patient) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleGenerateClick} disabled={loading}>
                        <Download className="mr-2 h-4 w-4" />
                        {loading ? 'Gerando...' : 'Gerar Relatório'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}