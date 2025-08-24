// components/financial/financial-filters.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Filter, Search } from "lucide-react";

interface FinancialFiltersProps {
    dateFrom: string;
    dateTo: string;
    searchTerm: string;
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
    onSearchTermChange: (term: string) => void;
}

export function FinancialFilters({ 
    dateFrom, dateTo, searchTerm, 
    onDateFromChange, onDateToChange, onSearchTermChange 
}: FinancialFiltersProps) {
    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold"><Filter className="h-5 w-5 text-primary" />Filtros</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2">
                            <Label className="text-sm font-medium text-foreground">Período</Label>
                            <div className="flex gap-2">
                                <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
                                <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label className="text-sm font-medium text-foreground">Buscar por Descrição</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Ex: Repasse, Aluguel..." className="pl-9" value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}