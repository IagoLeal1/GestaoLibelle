// components/financial/overdue-expenses-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Transaction } from "@/services/financialService";
import { format, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OverdueExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onUpdateStatus: (transaction: Transaction) => void;
}

export function OverdueExpensesModal({ isOpen, onClose, transactions, onUpdateStatus }: OverdueExpensesModalProps) {
  
  const totalOverdue = transactions.reduce((acc, tx) => acc + tx.value, 0);

  const formatDate = (date: Date) => {
    if (isToday(date)) return <span className="text-orange-600 font-semibold">Vence Hoje</span>
    if (isPast(date)) return <span className="text-red-600 font-semibold">{format(date, 'dd/MM/yyyy')}</span>
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" />
            Controle de Inadimplência
          </DialogTitle>
          <DialogDescription>
            Lista de todas as despesas pendentes que estão vencidas ou vencem hoje.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Card>
            <CardContent className="p-4 flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">Contas Vencidas</p>
                    <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold text-red-600">
                        R$ {totalOverdue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </CardContent>
          </Card>

          <div className="max-h-[40vh] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhuma conta vencida ou vencendo hoje.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.dataMovimento.toDate())}</TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell>{tx.category}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        R$ {tx.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm" variant="outline" onClick={() => onUpdateStatus(tx)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Pagar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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