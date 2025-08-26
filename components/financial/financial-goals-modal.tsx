// components/financial/financial-goals-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, TrendingDown, Save } from "lucide-react";
import { getTransactionsForReport, getBudgetForMonth, setBudgetForMonth, Budget } from "@/services/financialService";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";

interface FinancialGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const GoalCard = ({ title, meta, realizado, loading }: { title: string, meta: number, realizado: number, loading: boolean }) => {
    const progresso = meta > 0 ? (realizado / meta) * 100 : 0;
    const isMetaAtingida = realizado >= meta;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-7 w-32" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-2 w-full" />
                    </div>
                ) : (
                    <>
                        <div className="text-2xl font-bold">{formatCurrency(realizado)}</div>
                        <p className="text-xs text-muted-foreground">
                            Meta: {formatCurrency(meta)}
                        </p>
                        <Progress value={progresso} className="w-full mt-2" indicatorClassName={isMetaAtingida ? 'bg-primary-medium-green' : 'bg-primary-teal'} />
                         <p className={`text-xs mt-1 font-semibold ${isMetaAtingida ? 'text-primary-medium-green' : 'text-muted-foreground'}`}>
                            {progresso.toFixed(0)}% da meta atingida
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}


export function FinancialGoalsModal({ isOpen, onClose }: FinancialGoalsModalProps) {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [metaReceita, setMetaReceita] = useState(0);
  const [metaDespesa, setMetaDespesa] = useState(0);
  
  const [receitaRealizada, setReceitaRealizada] = useState(0);
  const [despesaRealizada, setDespesaRealizada] = useState(0);

  const [monthId, setMonthId] = useState("");
  const [monthName, setMonthName] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      const hoje = new Date();
      const currentMonthId = format(hoje, 'yyyy-MM');
      setMonthId(currentMonthId);
      setMonthName(format(hoje, 'MMMM de yyyy', { locale: ptBR }));

      const inicioMes = startOfMonth(hoje);
      const fimMes = endOfMonth(hoje);

      const [transacoes, orcamento] = await Promise.all([
        getTransactionsForReport({ startDate: inicioMes, endDate: fimMes, status: 'pago' }),
        getBudgetForMonth(currentMonthId)
      ]);

      const receita = transacoes.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.value, 0);
      const despesa = transacoes.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.value, 0);
      
      setReceitaRealizada(receita);
      setDespesaRealizada(despesa);
      setMetaReceita(orcamento?.receitaPrevista || 0);
      setMetaDespesa(orcamento?.despesaPrevista || 0);

      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const result = await setBudgetForMonth(monthId, {
        receitaPrevista: metaReceita,
        despesaPrevista: metaDespesa
    });

    if(result.success) {
        toast.success("Metas financeiras salvas com sucesso!");
        onClose();
    } else {
        toast.error(result.error || "Falha ao salvar as metas.");
    }
    setIsSaving(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Metas Financeiras</DialogTitle>
          <DialogDescription>
            Acompanhe e defina as metas de faturamento e despesas para <span className="font-bold capitalize">{monthName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GoalCard title="Faturamento Realizado" meta={metaReceita} realizado={receitaRealizada} loading={loading} />
                <GoalCard title="Despesas Realizadas" meta={metaDespesa} realizado={despesaRealizada} loading={loading} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Definir Metas do Mês</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="metaReceita" className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary-teal" /> Meta de Faturamento (R$)</Label>
                        {loading ? <Skeleton className="h-10 w-full" /> : 
                        <Input id="metaReceita" type="number" value={metaReceita} onChange={(e) => setMetaReceita(parseFloat(e.target.value) || 0)} placeholder="Ex: 25000" />}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="metaDespesa" className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-secondary-red" /> Limite de Despesas (R$)</Label>
                        {loading ? <Skeleton className="h-10 w-full" /> : 
                        <Input id="metaDespesa" type="number" value={metaDespesa} onChange={(e) => setMetaDespesa(parseFloat(e.target.value) || 0)} placeholder="Ex: 10000" />}
                    </div>
                </CardContent>
            </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleSaveChanges} disabled={loading || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Metas"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}