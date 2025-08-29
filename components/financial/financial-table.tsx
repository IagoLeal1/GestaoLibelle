// components/financial/financial-table.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Transaction, BankAccount } from "@/services/financialService";

interface FinancialTableProps {
    title: string;
    data: Transaction[];
    type: 'receita' | 'despesa';
    loading: boolean;
    onAddTransaction: () => void;
    onEditTransaction: (transaction: Transaction) => void;
    onUpdateStatus: (transaction: Transaction) => void;
    onDeleteTransaction: (transaction: Transaction) => void;
    bankAccounts: BankAccount[];
}

// O componente de linha foi atualizado para mostrar as duas datas
const TransactionRow = ({ tx, onEdit, onUpdateStatus, onDelete, getBankNameById }: { 
    tx: Transaction,
    onEdit: (tx: Transaction) => void;
    onUpdateStatus: (tx: Transaction) => void;
    onDelete: (tx: Transaction) => void;
    getBankNameById: (id?: string) => string;
}) => (
    <TableRow key={tx.id}>
        <TableCell className="font-medium text-sm">{tx.category}</TableCell>
        <TableCell>{tx.description}</TableCell>
        <TableCell><Badge variant="outline">{tx.costCenter || 'N/A'}</Badge></TableCell>
        <TableCell>{getBankNameById(tx.bankAccountId)}</TableCell>
        <TableCell className={`text-right font-medium ${tx.type === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
            {tx.type === 'despesa' ? '- ' : ''}R$ {tx.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </TableCell>
        {/* Data de Emissão */}
        <TableCell>
            {tx.dataEmissao ? format(tx.dataEmissao.toDate(), 'dd/MM/yyyy') : 'N/A'}
        </TableCell>
        {/* Data de Movimento */}
        <TableCell>
            {format(tx.dataMovimento.toDate(), 'dd/MM/yyyy')}
        </TableCell>
        <TableCell>
            <Badge className={tx.status === 'pago' ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
            </Badge>
        </TableCell>
        <TableCell className="text-right">
            <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(tx)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdateStatus(tx)}>Marcar como {tx.status === 'pago' ? 'Pendente' : 'Pago'}</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => onDelete(tx)}>Excluir</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </TableCell>
    </TableRow>
);

export function FinancialTable({ title, data, type, loading, onAddTransaction, onEditTransaction, onUpdateStatus, onDeleteTransaction, bankAccounts }: FinancialTableProps) {
    const getBankNameById = (id?: string) => {
        if (!id) return 'N/A';
        const account = bankAccounts.find(acc => acc.id === id);
        return account ? account.name : 'Excluído';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <CardTitle>{title} ({data.length})</CardTitle>
                    <Button onClick={onAddTransaction} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Nova {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        {/* Cabeçalho atualizado */}
                        <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead>Descrição</TableHead><TableHead>Centro de Custo</TableHead><TableHead>Banco</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Data Emissão</TableHead><TableHead>Data Movimento</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {loading ?
                                <TableRow><TableCell colSpan={9} className="text-center h-24">Carregando...</TableCell></TableRow>
                                : data.length === 0 ?
                                    <TableRow><TableCell colSpan={9} className="text-center h-24">Nenhuma movimentação encontrada.</TableCell></TableRow>
                                    : data.map(tx => (
                                        <TransactionRow 
                                            key={tx.id} 
                                            tx={tx} 
                                            onEdit={onEditTransaction}
                                            onUpdateStatus={onUpdateStatus}
                                            onDelete={onDeleteTransaction}
                                            getBankNameById={getBankNameById}
                                        />
                                    ))
                            }
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}