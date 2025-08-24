// components/financial/fluxo-de-caixa-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Calculator } from "lucide-react";
import { getTransactionsForReport, getBudgetsForPeriod, Transaction, Budget } from "@/services/financialService";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FluxoDeCaixaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MonthlyData {
  mes: string;
  receitaPrevista: number;
  receitaRealizada: number;
  despesaPrevista: number;
  despesaRealizada: number;
}

export function FluxoDeCaixaModal({ isOpen, onClose }: FluxoDeCaixaModalProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      
      const hoje = new Date();
      const seisMesesAtras = startOfMonth(subMonths(hoje, 5));
      const fimDoMesAtual = endOfMonth(hoje);

      // 1. Gerar os IDs dos meses que precisamos buscar (ex: "2024-08", "2024-07", etc.)
      const periodIds = Array.from({ length: 6 }).map((_, i) => format(subMonths(hoje, i), 'yyyy-MM')).reverse();

      // 2. Fazer as chamadas à base de dados em paralelo (otimizado)
      const [transacoes, orcamentos] = await Promise.all([
        getTransactionsForReport({ startDate: seisMesesAtras, endDate: fimDoMesAtual }),
        getBudgetsForPeriod(periodIds)
      ]);

      // 3. Processar os dados no lado do cliente
      const monthlyDataMap: Record<string, MonthlyData> = {};

      periodIds.forEach(periodId => {
        const date = new Date(`${periodId}-02`); // Dia 2 para evitar problemas de fuso horário
        monthlyDataMap[periodId] = {
          mes: format(date, 'MMMM', { locale: ptBR }),
          receitaPrevista: 0,
          receitaRealizada: 0,
          despesaPrevista: 0,
          despesaRealizada: 0,
        };
      });

      orcamentos.forEach(orcamento => {
        monthlyDataMap[orcamento.id].receitaPrevista = orcamento.receitaPrevista;
        monthlyDataMap[orcamento.id].despesaPrevista = orcamento.despesaPrevista;
      });

      transacoes.forEach(tx => {
        const periodId = format(tx.date.toDate(), 'yyyy-MM');
        if (monthlyDataMap[periodId]) {
          if (tx.type === 'receita') {
            monthlyDataMap[periodId].receitaRealizada += tx.value;
          } else {
            monthlyDataMap[periodId].despesaRealizada += tx.value;
          }
        }
      });

      setData(Object.values(monthlyDataMap));
      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  const totais = data.reduce((acc, mes) => {
      acc.receitaPrevista += mes.receitaPrevista;
      acc.receitaRealizada += mes.receitaRealizada;
      acc.despesaPrevista += mes.despesaPrevista;
      acc.despesaRealizada += mes.despesaRealizada;
      return acc;
  }, { receitaPrevista: 0, receitaRealizada: 0, despesaPrevista: 0, despesaRealizada: 0 });

  const saldoPrevistoTotal = totais.receitaPrevista - totais.despesaPrevista;
  const saldoRealizadoTotal = totais.receitaRealizada - totais.despesaRealizada;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Fluxo de Caixa - Previsto x Realizado</DialogTitle>
          <DialogDescription>Comparativo dos últimos 6 meses.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary-teal" /><span className="text-sm font-medium">Receita Realizada</span></div><div className="text-2xl font-bold text-primary-teal mt-2">R$ {totais.receitaRealizada.toLocaleString("pt-BR")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-secondary-red" /><span className="text-sm font-medium">Despesa Realizada</span></div><div className="text-2xl font-bold text-secondary-red mt-2">R$ {totais.despesaRealizada.toLocaleString("pt-BR")}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Calculator className="h-4 w-4 text-primary-medium-green" /><span className="text-sm font-medium">Saldo Realizado</span></div><div className="text-2xl font-bold text-primary-medium-green mt-2">R$ {saldoRealizadoTotal.toLocaleString("pt-BR")}</div></CardContent></Card>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mês</TableHead>
                  <TableHead>Receita Prevista</TableHead>
                  <TableHead>Receita Realizada</TableHead>
                  <TableHead>Despesa Prevista</TableHead>
                  <TableHead>Despesa Realizada</TableHead>
                  <TableHead>Saldo Previsto</TableHead>
                  <TableHead>Saldo Realizado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center h-24">A carregar dados...</TableCell></TableRow>
                ) : data.map((mes, index) => {
                    const saldoPrevisto = mes.receitaPrevista - mes.despesaPrevista;
                    const saldoRealizado = mes.receitaRealizada - mes.despesaRealizada;
                    return (
                        <TableRow key={index}>
                            <TableCell className="font-medium capitalize">{mes.mes}</TableCell>
                            <TableCell>R$ {mes.receitaPrevista.toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="font-semibold text-primary-teal">R$ {mes.receitaRealizada.toLocaleString("pt-BR")}</TableCell>
                            <TableCell>R$ {mes.despesaPrevista.toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="font-semibold text-secondary-red">R$ {mes.despesaRealizada.toLocaleString("pt-BR")}</TableCell>
                            <TableCell>R$ {saldoPrevisto.toLocaleString("pt-BR")}</TableCell>
                            <TableCell className={`font-semibold ${saldoRealizado >= 0 ? 'text-primary-medium-green' : 'text-secondary-red'}`}>R$ {saldoRealizado.toLocaleString("pt-BR")}</TableCell>
                        </TableRow>
                    )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}