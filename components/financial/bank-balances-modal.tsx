// components/financial/bank-balances-modal.tsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BankAccount } from "@/services/financialService";
import { Skeleton } from "../ui/skeleton";
import { Landmark } from "lucide-react";

interface BankBalancesModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[]; // <-- Agora recebe a interface original
  loading: boolean;
}

export function BankBalancesModal({ isOpen, onClose, accounts, loading }: BankBalancesModalProps) {
  // O saldo total é calculado com base no campo 'currentBalance'
  const totalBalance = accounts.reduce((acc, account) => acc + (account.currentBalance || account.initialBalance), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Landmark /> Saldos Bancários</DialogTitle>
          <DialogDescription>
            Visão geral dos saldos atuais em cada conta bancária.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome da Conta</TableHead>
                            <TableHead>Agência / Conta</TableHead>
                            <TableHead className="text-right">Saldo Atual (R$)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : accounts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    Nenhuma conta bancária cadastrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            accounts.map((account) => {
                                const balance = account.currentBalance ?? account.initialBalance;
                                return (
                                <TableRow key={account.id}>
                                    <TableCell className="font-medium">{account.name}</TableCell>
                                    <TableCell>{account.agency} / {account.account}</TableCell>
                                    <TableCell className={`text-right font-semibold ${balance >= 0 ? 'text-primary-medium-green' : 'text-secondary-red'}`}>
                                        {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                    </TableCell>
                                </TableRow>
                            )})
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between border-t pt-4">
            <div className="text-lg font-bold">
                Saldo Total: <span className={totalBalance >= 0 ? 'text-primary-medium-green' : 'text-secondary-red'}>
                    R$ {totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
            </div>
            <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}