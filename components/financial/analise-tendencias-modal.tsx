// components/financial/analise-tendencias-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getTransactionsForReport } from "@/services/financialService";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "../ui/skeleton";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "../ui/card";

interface AnaliseTendenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TrendData {
  mes: string;
  Receitas: number;
  Despesas: number;
  Saldo: number;
}

const formatCurrency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function AnaliseTendenciasModal({ isOpen, onClose }: AnaliseTendenciasModalProps) {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      const hoje = new Date();
      const seisMesesAtras = startOfMonth(subMonths(hoje, 5));
      const fimDoMesAtual = endOfMonth(hoje);

      const transacoes = await getTransactionsForReport({
        startDate: seisMesesAtras,
        endDate: fimDoMesAtual,
        status: 'pago'
      });
      
      const monthlyData: { [key: string]: { Receitas: number, Despesas: number } } = {};

      for (let i = 5; i >= 0; i--) {
        const monthKey = format(subMonths(hoje, i), 'MMM', { locale: ptBR });
        monthlyData[monthKey] = { Receitas: 0, Despesas: 0 };
      }

      transacoes.forEach(tx => {
        const monthKey = format(tx.date.toDate(), 'MMM', { locale: ptBR });
        if (monthlyData[monthKey]) {
          if (tx.type === 'receita') {
            monthlyData[monthKey].Receitas += tx.value;
          } else {
            monthlyData[monthKey].Despesas += tx.value;
          }
        }
      });
      
      const chartData = Object.keys(monthlyData).map(key => ({
        mes: key,
        Receitas: monthlyData[key].Receitas,
        Despesas: monthlyData[key].Despesas,
        Saldo: monthlyData[key].Receitas - monthlyData[key].Despesas,
      }));

      setTrendData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Análise de Tendências Financeiras</DialogTitle>
          <DialogDescription>
            Evolução de receitas, despesas e saldo nos últimos 6 meses.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Card>
                <CardContent className="pt-6">
                {loading ? <Skeleton className="h-[400px] w-full" /> : (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes" />
                            <YAxis tickFormatter={(value) => `R$${value/1000}k`} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend />
                            <Line type="monotone" dataKey="Receitas" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2} />
                            <Line type="monotone" dataKey="Saldo" stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
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