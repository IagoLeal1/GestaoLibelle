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

// --- TIPO CORRIGIDO E ATUALIZADO ---
export type ReportType =
    | 'receitas'
    | 'despesas'
    | 'fluxo_caixa'
    | 'contas_a_pagar'
    | 'contas_a_receber'
    | 'despesas_por_centro_custo'
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
}

// --- TÍTULOS ATUALIZADOS ---
const reportTitles: Record<ReportType, string> = {
    receitas: "Relatório Geral de Receitas",
    despesas: "Relatório Geral de Despesas",
    fluxo_caixa: "Relatório de Fluxo de Caixa",
    contas_a_pagar: "Relatório de Contas a Pagar",
    contas_a_receber: "Relatório de Contas a Receber",
    despesas_por_centro_custo: "Despesas por Centro de Custo",
    movimentacao_bancaria: "Movimentação por Conta Bancária",
    contas_pagas: "Relatório de Contas Pagas",
    contas_recebidas: "Relatório de Contas Recebidas",
    previsoes_futuras: "Previsões Futuras",
    metas_financeiras: "Metas Financeiras Anuais",
    analise_tendencias: "Análise de Tendências e Indicadores",
    comparativo_mensal: "Comparativo Mensal"
};

export function FinancialReportModal({ isOpen, onClose, onGenerate, reportType, costCenters, bankAccounts }: FinancialReportModalProps) {
    const [params, setParams] = useState({
        startDate: "",
        endDate: "",
        costCenter: "todos",
        bankAccountId: "todos",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setParams({ startDate: "", endDate: "", costCenter: "todos", bankAccountId: "todos" });
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