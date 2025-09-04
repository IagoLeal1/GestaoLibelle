"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Transaction } from "@/services/financialService";
import { Professional } from "@/services/settingsService";
import { RepasseDetailsModal } from "@/components/modals/repasse-details-modal";

interface RepasseDetails {
    name: string;
    totalRepasse: number;
    transacoes: Transaction[];
}

interface ProfessionalRepasseDashboardProps {
    transactions: Transaction[];
    professionals: Professional[];
    loading: boolean;
}

export function ProfessionalRepasseDashboard({ transactions, professionals, loading }: ProfessionalRepasseDashboardProps) {
    const [modalDetails, setModalDetails] = useState<RepasseDetails | null>(null);

    const handleOpenDetails = (professionalData: any) => {
        const transacoesDoProfissional = transactions.filter(
            tx => tx.type === 'despesa' && tx.professionalId === professionalData.id
        );
        
        setModalDetails({
            name: professionalData.name,
            totalRepasse: professionalData.totalRepasse,
            transacoes: transacoesDoProfissional
        });
    };

    const repassesPorProfissional = useMemo(() => {
        const repasses = transactions.filter(tx => tx.type === 'despesa' && !!tx.professionalId);
        
        return professionals.map(prof => {
            const transacoesDoProfissional = repasses.filter(tx => tx.professionalId === prof.id);
            const totalRepasse = transacoesDoProfissional.reduce((acc, tx) => acc + tx.value, 0);
            const ultimosRepasses = transacoesDoProfissional
                // --- CORREÇÃO APLICADA AQUI ---
                .sort((a, b) => b.dataMovimento.toDate().getTime() - a.dataMovimento.toDate().getTime())
                .slice(0, 1);

            return {
                ...prof,
                totalRepasse,
                ultimoRepasse: ultimosRepasses[0],
                quantidade: transacoesDoProfissional.length,
            };
        });
    }, [transactions, professionals]);

    const totalGeralRepasses = repassesPorProfissional.reduce((acc, prof) => acc + prof.totalRepasse, 0);

    return (
        <>
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card><CardHeader><CardTitle className="text-sm font-medium">Total de Repasses</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">R$ {totalGeralRepasses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p><p className="text-xs text-muted-foreground mt-1">Total de despesas com repasses</p></CardContent></Card>
                    <Card><CardHeader><CardTitle className="text-sm font-medium">Profissionais com Repasse</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{repassesPorProfissional.filter(p => p.totalRepasse > 0).length}</p><p className="text-xs text-muted-foreground mt-1">Receberam no período</p></CardContent></Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Repasses por Profissional</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Profissional</TableHead>
                                        <TableHead className="text-center">Qtd. Lançamentos</TableHead>
                                        <TableHead>Último Lançamento</TableHead>
                                        <TableHead className="text-right">Total Repassado (Período)</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center h-24">A calcular repasses...</TableCell></TableRow>
                                    ) : (
                                        repassesPorProfissional.map(prof => (
                                            <TableRow key={prof.id}>
                                                <TableCell className="font-medium">{prof.name}</TableCell>
                                                <TableCell className="text-center">{prof.quantidade}</TableCell>
                                                <TableCell>
                                                    {prof.ultimoRepasse 
                                                        // --- CORREÇÃO APLICADA AQUI ---
                                                        ? `${format(prof.ultimoRepasse.dataMovimento.toDate(), 'dd/MM/yyyy')} - R$ ${prof.ultimoRepasse.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                        : 'Nenhum lançamento no período'
                                                    }
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-red-600">R$ {prof.totalRepasse.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenDetails(prof)}>Ver Detalhes</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <RepasseDetailsModal 
                isOpen={!!modalDetails}
                onClose={() => setModalDetails(null)}
                details={modalDetails}
            />
        </>
    );
}