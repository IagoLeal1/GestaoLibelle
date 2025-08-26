// components/financial/future-forecasts-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Eye, AlertTriangle } from "lucide-react";
import { getTransactionsForReport } from "@/services/financialService";
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "../ui/skeleton";

interface FutureForecastsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ForecastData {
  mes: string;
  receita: number;
  despesa: number;
  saldo: number;
}

interface Scenario {
  realista: ForecastData[];
  otimista: ForecastData[];
  pessimista: ForecastData[];
}

const ScenarioCard = ({ title, data, type, loading }: { title: string, data: ForecastData[], type: 'receita' | 'despesa' | 'saldo', loading: boolean }) => {
    const total = data.reduce((acc, item) => acc + item[type], 0);
    const Icon = type === 'receita' ? TrendingUp : TrendingDown;
    const color = type === 'receita' ? 'text-primary-teal' : type === 'despesa' ? 'text-secondary-red' : 'text-primary-medium-green';

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium flex items-center justify-between">
                    {title}
                    <Icon className={`h-4 w-4 ${color}`} />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>
                    {loading ? <Skeleton className="h-8 w-32" /> : `R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </div>
                <p className="text-xs text-muted-foreground">Total previsto para os próximos 3 meses.</p>
            </CardContent>
        </Card>
    );
};

export function FutureForecastsModal({ isOpen, onClose }: FutureForecastsModalProps) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'realista' | 'otimista' | 'pessimista'>('realista');

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);

      const hoje = new Date();
      const tresMesesAtras = startOfMonth(subMonths(hoje, 3));
      const fimDoMesPassado = endOfMonth(subMonths(hoje, 1));

      const transacoes = await getTransactionsForReport({
        startDate: tresMesesAtras,
        endDate: fimDoMesPassado,
        status: 'pago' // A previsão se baseia no que foi realizado
      });

      const totalReceitas = transacoes.filter(t => t.type === 'receita').reduce((acc, t) => acc + t.value, 0);
      const totalDespesas = transacoes.filter(t => t.type === 'despesa').reduce((acc, t) => acc + t.value, 0);

      const mediaReceitaMensal = totalReceitas / 3;
      const mediaDespesaMensal = totalDespesas / 3;

      const newScenario: Scenario = {
        realista: [],
        otimista: [],
        pessimista: [],
      };

      for (let i = 1; i <= 3; i++) {
        const mesFuturo = addMonths(hoje, i);
        const nomeMes = format(mesFuturo, 'MMMM', { locale: ptBR });

        // Cenário Realista
        const saldoRealista = mediaReceitaMensal - mediaDespesaMensal;
        newScenario.realista.push({ mes: nomeMes, receita: mediaReceitaMensal, despesa: mediaDespesaMensal, saldo: saldoRealista });
        
        // Cenário Otimista (+15% receita, -10% despesa)
        const receitaOtimista = mediaReceitaMensal * 1.15;
        const despesaOtimista = mediaDespesaMensal * 0.90;
        newScenario.otimista.push({ mes: nomeMes, receita: receitaOtimista, despesa: despesaOtimista, saldo: receitaOtimista - despesaOtimista });

        // Cenário Pessimista (-15% receita, +10% despesa)
        const receitaPessimista = mediaReceitaMensal * 0.85;
        const despesaPessimista = mediaDespesaMensal * 1.10;
        newScenario.pessimista.push({ mes: nomeMes, receita: receitaPessimista, despesa: despesaPessimista, saldo: receitaPessimista - despesaPessimista });
      }
      
      setScenario(newScenario);
      setLoading(false);
    };

    fetchData();
  }, [isOpen]);

  const activeData = scenario ? scenario[activeTab] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Previsões Futuras</DialogTitle>
          <DialogDescription>
            Projeção financeira para os próximos 3 meses com base na média de performance dos 3 meses anteriores.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6">
            <div className="flex justify-center">
                <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    <Button onClick={() => setActiveTab('pessimista')} variant={activeTab === 'pessimista' ? 'default' : 'ghost'} className="px-3 h-8">Pessimista</Button>
                    <Button onClick={() => setActiveTab('realista')} variant={activeTab === 'realista' ? 'default' : 'ghost'} className="px-3 h-8">Realista</Button>
                    <Button onClick={() => setActiveTab('otimista')} variant={activeTab === 'otimista' ? 'default' : 'ghost'} className="px-3 h-8">Otimista</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ScenarioCard title="Receita Prevista" data={activeData} type="receita" loading={loading} />
                <ScenarioCard title="Despesa Prevista" data={activeData} type="despesa" loading={loading} />
                <ScenarioCard title="Saldo Previsto" data={activeData} type="saldo" loading={loading} />
            </div>

            <Table>
              <TableHeader><TableRow><TableHead>Mês</TableHead><TableHead>Receita</TableHead><TableHead>Despesa</TableHead><TableHead>Saldo</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-5 w-full" /></TableCell></TableRow>
                    ))
                ) : (
                    activeData.map(item => (
                        <TableRow key={item.mes}>
                            <TableCell className="font-medium capitalize">{item.mes}</TableCell>
                            <TableCell className="text-primary-teal">R$ {item.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className="text-secondary-red">R$ {item.despesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                            <TableCell className={`font-semibold ${item.saldo >= 0 ? 'text-primary-medium-green' : 'text-secondary-red'}`}>R$ {item.saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}