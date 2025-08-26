// components/financial/comparativo-mensal-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTransactionsForReport } from "@/services/financialService";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "../ui/skeleton";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";

interface ComparativoMensalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ComparisonData {
  name: string;
  'Mês Anterior': number;
  'Mês Atual': number;
}

const formatCurrency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const StatCard = ({ title, valorAtual, valorAnterior, loading }: { title: string, valorAtual: number, valorAnterior: number, loading: boolean }) => {
    const diff = valorAtual - valorAnterior;
    const percentageChange = valorAnterior !== 0 ? (diff / valorAnterior) * 100 : 0;
    const isPositive = title === 'Receitas' ? diff >= 0 : diff <= 0;
    const Icon = diff >= 0 ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-primary-medium-green' : 'text-secondary-red';

    if (loading) return <Card><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>;

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{formatCurrency(valorAtual)}</p>
                <div className={`flex items-center text-xs ${color} font-semibold`}>
                    <Icon className="h-4 w-4 mr-1" />
                    <span>{percentageChange.toFixed(1)}%</span>
                    <span className="text-muted-foreground font-normal ml-1">vs. {formatCurrency(valorAnterior)}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export function ComparativoMensalModal({ isOpen, onClose }: ComparativoMensalModalProps) {
  const [chartData, setChartData] = useState<ComparisonData[]>([]);
  const [totals, setTotals] = useState({ receitaAtual: 0, despesaAtual: 0, receitaAnterior: 0, despesaAnterior: 0 });
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState("");
  const [mesAnterior, setMesAnterior] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);

      const hoje = new Date();
      setMesAtual(format(hoje, 'MMMM', { locale: ptBR }));
      setMesAnterior(format(subMonths(hoje, 1), 'MMMM', { locale: ptBR }));
      
      const inicioMesAtual = startOfMonth(hoje);
      const fimMesAtual = endOfMonth(hoje);
      const inicioMesAnterior = startOfMonth(subMonths(hoje, 1));
      const fimMesAnterior = endOfMonth(subMonths(hoje, 1));
      
      const [transacoesAtuais, transacoesAnteriores] = await Promise.all([
        getTransactionsForReport({ startDate: inicioMesAtual, endDate: fimMesAtual, status: 'pago' }),
        getTransactionsForReport({ startDate: inicioMesAnterior, endDate: fimMesAnterior, status: 'pago' })
      ]);

      const receitaAtual = transacoesAtuais.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.value, 0);
      const despesaAtual = transacoesAtuais.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.value, 0);
      const receitaAnterior = transacoesAnteriores.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.value, 0);
      const despesaAnterior = transacoesAnteriores.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.value, 0);

      setTotals({ receitaAtual, despesaAtual, receitaAnterior, despesaAnterior });
      setChartData([
        { name: 'Receitas', 'Mês Anterior': receitaAnterior, 'Mês Atual': receitaAtual },
        { name: 'Despesas', 'Mês Anterior': despesaAnterior, 'Mês Atual': despesaAtual },
        { name: 'Saldo', 'Mês Anterior': receitaAnterior - despesaAnterior, 'Mês Atual': receitaAtual - despesaAtual },
      ]);
      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Comparativo Mensal</DialogTitle>
          <DialogDescription className="capitalize">
            {mesAtual} <ArrowRight className="inline h-3 w-3" /> {mesAnterior}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard title="Receitas" valorAtual={totals.receitaAtual} valorAnterior={totals.receitaAnterior} loading={loading} />
                <StatCard title="Despesas" valorAtual={totals.despesaAtual} valorAnterior={totals.despesaAnterior} loading={loading} />
                <StatCard title="Saldo" valorAtual={totals.receitaAtual - totals.despesaAtual} valorAnterior={totals.receitaAnterior - totals.despesaAnterior} loading={loading} />
            </div>
            <Card>
                <CardContent className="pt-6">
                    {loading ? <Skeleton className="h-[300px] w-full" /> : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="Mês Anterior" fill="#a1a1aa" />
                                <Bar dataKey="Mês Atual" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}