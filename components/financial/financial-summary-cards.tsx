// components/financial/financial-summary-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Activity } from "lucide-react";

interface FinancialSummaryCardsProps {
    totalDespesas: number;
    totalReceitas: number;
    saldoFinal: number;
    totalTransacoes: number;
}

export function FinancialSummaryCards({ totalDespesas, totalReceitas, saldoFinal, totalTransacoes }: FinancialSummaryCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Despesas</CardTitle>
                    <div className="p-2 rounded-lg bg-secondary-red/20"><TrendingDown className="h-4 w-4 text-secondary-red" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">R$ {totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-secondary-red flex items-center mt-1"><TrendingDown className="h-3 w-3 mr-1" />Despesas do período</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Receitas</CardTitle>
                    <div className="p-2 rounded-lg bg-primary-medium-green/20"><TrendingUp className="h-4 w-4 text-primary-medium-green" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">R$ {totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-primary-medium-green flex items-center mt-1"><TrendingUp className="h-3 w-3 mr-1" />Receitas do período</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Saldo do Período</CardTitle>
                    <div className={`p-2 rounded-lg ${saldoFinal >= 0 ? "bg-primary-teal/20" : "bg-secondary-red/20"}`}><Wallet className={`h-4 w-4 ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`} /></div>
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`}>R$ {saldoFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                    <p className={`text-xs flex items-center mt-1 ${saldoFinal >= 0 ? "text-primary-teal" : "text-secondary-red"}`}>
                        {saldoFinal >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {saldoFinal >= 0 ? "Saldo positivo" : "Saldo negativo"}
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Transações</CardTitle>
                    <div className="p-2 rounded-lg bg-primary-teal/20"><Activity className="h-4 w-4 text-primary-teal" /></div>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{totalTransacoes}</div>
                    <p className="text-xs text-primary-teal flex items-center mt-1">Movimentações no período</p>
                </CardContent>
            </Card>
        </div>
    );
}