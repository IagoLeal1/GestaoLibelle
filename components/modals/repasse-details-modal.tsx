// components/modals/repasse-details-modal.tsx
"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { Transaction } from "@/services/financialService";

// Criamos uma interface para os dados que o modal vai receber
interface RepasseDetails {
    name: string;
    totalRepasse: number;
    transacoes: Transaction[];
}

interface RepasseDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    details: RepasseDetails | null;
}

export function RepasseDetailsModal({ isOpen, onClose, details }: RepasseDetailsModalProps) {
    if (!details) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Detalhes do Repasse - {details.name}</DialogTitle>
                    <DialogDescription>
                        Lista de todos os lançamentos de despesa para este profissional no período selecionado.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="overflow-y-auto max-h-[60vh]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead className="text-right">Valor (R$)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {details.transacoes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            Nenhum lançamento encontrado para este profissional no período.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    details.transacoes.map((tx) => (
                                        <TableRow key={tx.id}>
                                            {/* --- CORREÇÃO APLICADA AQUI --- */}
                                            <TableCell>{format(tx.dataMovimento.toDate(), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell><Badge variant="outline">{tx.category}</Badge></TableCell>
                                            <TableCell className="text-right font-medium text-red-600">
                                                {tx.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <DialogFooter>
                    <div className="w-full flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            Total Repassado: <span className="font-bold text-red-600">R$ {details.totalRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                        </p>
                        <Button onClick={onClose}>Fechar</Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}