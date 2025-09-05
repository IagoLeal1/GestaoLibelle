// components/financial/settings-dashboard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MoreHorizontal, Library, Building, Users, Handshake, Landmark, Save, Briefcase, RefreshCw, Star } from "lucide-react";
import { AccountPlan, Supplier, Covenant, BankAccount } from "@/services/financialService";
import { CostCenter, CompanyData } from "@/services/settingsService";
import { Skeleton } from "../ui/skeleton";
import { formatCEP, formatCPF_CNPJ, formatPhone } from "@/lib/formatters";

// --- Sub-componente: Dados da Empresa ---
const CompanyInfoManager = ({ initialData, onSave, loading }: { initialData: CompanyData | null, onSave: (data: CompanyData) => Promise<void>, loading: boolean }) => {
    const [formData, setFormData] = useState<CompanyData>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setFormData(initialData || {});
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        
        let formattedValue = value;
        if (id === 'cnpj') formattedValue = formatCPF_CNPJ(value);
        else if (id === 'zipCode') formattedValue = formatCEP(value);
        else if (id === 'phone') formattedValue = formatPhone(value);

        setFormData(prev => ({ ...prev, [id]: formattedValue }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const dataToSave = {
            ...formData,
            cnpj: formData.cnpj?.replace(/\D/g, ''),
            zipCode: formData.zipCode?.replace(/\D/g, ''),
            phone: formData.phone?.replace(/\D/g, ''),
        };
        await onSave(dataToSave);
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Briefcase className="h-5 w-5" />Dados da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">Nome da Empresa</Label>{loading ? <Skeleton className="h-10" /> : <Input id="name" value={formData.name || ''} onChange={handleChange} placeholder="Casa Libelle - Terapias Integradas"/>}</div>
                    <div className="space-y-2"><Label htmlFor="cnpj">CPF/CNPJ</Label>{loading ? <Skeleton className="h-10" /> : <Input id="cnpj" value={formData.cnpj || ''} onChange={handleChange} placeholder="00.000.000/0000-00" />}</div>
                    <div className="space-y-2"><Label htmlFor="address">Endereço</Label>{loading ? <Skeleton className="h-10" /> : <Input id="address" value={formData.address || ''} onChange={handleChange} placeholder="Rua das Flores, 123 - Centro" />}</div>
                    <div className="space-y-2"><Label htmlFor="city">Cidade</Label>{loading ? <Skeleton className="h-10" /> : <Input id="city" value={formData.city || ''} onChange={handleChange} placeholder="São Paulo - SP" />}</div>
                    <div className="space-y-2"><Label htmlFor="zipCode">CEP</Label>{loading ? <Skeleton className="h-10" /> : <Input id="zipCode" value={formData.zipCode || ''} onChange={handleChange} placeholder="01234-567" />}</div>
                    <div className="space-y-2"><Label htmlFor="phone">Telefone</Label>{loading ? <Skeleton className="h-10" /> : <Input id="phone" value={formData.phone || ''} onChange={handleChange} placeholder="(11) 99999-9999" />}</div>
                    <div className="space-y-2 md:col-span-2"><Label htmlFor="email">E-mail</Label>{loading ? <Skeleton className="h-10" /> : <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="contato@casalibelle.com.br" />}</div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={loading || isSaving}><Save className="mr-2 h-4 w-4" />{isSaving ? "Salvando..." : "Salvar Dados da Empresa"}</Button>
                </div>
            </CardContent>
        </Card>
    );
};

// --- Interfaces de Props Corrigidas ---
interface PlanoContasManagerProps {
    accountPlans: { receitas: AccountPlan[]; despesas: AccountPlan[] };
    loading: boolean;
    onAdd: (category: 'receita' | 'despesa') => void;
    onEdit: (plan: AccountPlan) => void;
    onDelete: (id: string) => void;
}

const PlanoContasManager = ({ accountPlans, loading, onAdd, onEdit, onDelete }: PlanoContasManagerProps) => { 
    const renderPlanTable = (title: string, plans: AccountPlan[]) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <Button size="sm" onClick={() => onAdd(title === "Categorias de Receita" ? "receita" : "despesa")}><Plus className="mr-2 h-4 w-4" /> Adicionar Categoria</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome da Conta</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? (<TableRow><TableCell colSpan={3} className="text-center h-24">Carregando...</TableCell></TableRow>) : (
                            plans.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>{plan.code}</TableCell>
                                    <TableCell className="font-medium">{plan.name}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit(plan)}>Editar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(plan.id)}>Excluir</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Library className="h-5 w-5" />Plano de Contas</CardTitle></CardHeader>
            <CardContent className="space-y-6"><div className="grid md:grid-cols-2 gap-6">{renderPlanTable("Categorias de Receita", accountPlans.receitas)}{renderPlanTable("Categorias de Despesa", accountPlans.despesas)}</div></CardContent>
        </Card>
    );
};
const CostCenterManager = ({ costCenters, loading, onAdd, onEdit, onDelete }: { costCenters: CostCenter[], loading: boolean, onAdd: () => void, onEdit: (center: CostCenter) => void, onDelete: (id: string) => void }) => ( 
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" />Centros de Custo</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Novo Centro</Button>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                    {loading ? <TableRow><TableCell colSpan={2} className="text-center h-24">Carregando...</TableCell></TableRow> :
                    costCenters.map((center) => (
                        <TableRow key={center.id}>
                            <TableCell className="font-medium">{center.name}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(center)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(center.id)}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);
const SupplierManager = ({ suppliers, loading, onAdd, onEdit, onDelete }: { suppliers: Supplier[], loading: boolean, onAdd: () => void, onEdit: (supplier: Supplier) => void, onDelete: (id: string) => void }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Fornecedores</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Novo Fornecedor</Button>
        </CardHeader>
        <CardContent>
             <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CNPJ</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                    {loading ? <TableRow><TableCell colSpan={4} className="text-center h-24">Carregando...</TableCell></TableRow> :
                    suppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell>{supplier.cnpj}</TableCell>
                            <TableCell><Badge variant={supplier.status === "Ativo" ? "default" : "secondary"}>{supplier.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(supplier)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(supplier.id)}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);
const CovenantManager = ({ covenants, loading, onAdd, onEdit, onDelete }: { covenants: Covenant[], loading: boolean, onAdd: () => void, onEdit: (covenant: Covenant) => void, onDelete: (id: string) => void }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Handshake className="h-5 w-5" />Convênios</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Novo Convênio</Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Valor/Consulta</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                    {loading ? <TableRow><TableCell colSpan={4} className="text-center h-24">Carregando...</TableCell></TableRow> :
                    covenants.map((covenant) => (
                        <TableRow key={covenant.id}>
                            <TableCell className="font-medium">{covenant.name}</TableCell>
                            <TableCell>R$ {covenant.valuePerConsult.toLocaleString("pt-BR")}</TableCell>
                            <TableCell><Badge variant={covenant.status === "Ativo" ? "default" : "secondary"}>{covenant.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(covenant)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(covenant.id)}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const BankAccountManager = ({ bankAccounts, loading, onAdd, onEdit, onDelete, onSetDefault }: { 
    bankAccounts: BankAccount[], 
    loading: boolean, 
    onAdd: () => void, 
    onEdit: (account: BankAccount) => void, 
    onDelete: (id: string) => void,
    onSetDefault: (id: string) => void 
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" />Contas Bancárias</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Nova Conta</Button>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Agência</TableHead><TableHead>Conta</TableHead><TableHead>Saldo Inicial</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                    {loading ? <TableRow><TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell></TableRow> :
                    bankAccounts.map((account) => (
                        <TableRow key={account.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                                {account.isDefault && <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />}
                                {account.name}
                            </TableCell>
                            <TableCell>{account.agency}</TableCell>
                            <TableCell>{account.account}</TableCell>
                            <TableCell>R$ {account.initialBalance.toLocaleString("pt-BR")}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {!account.isDefault && <DropdownMenuItem onClick={() => onSetDefault(account.id)}>Definir como Padrão</DropdownMenuItem>}
                                        <DropdownMenuItem onClick={() => onEdit(account)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => onDelete(account.id)}>Excluir</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);


// --- INTERFACE DE PROPS COMPLETA ---
interface SettingsDashboardProps {
    companyData: CompanyData | null;
    onUpdateCompanyData: (data: CompanyData) => Promise<void>;
    accountPlans: { receitas: AccountPlan[]; despesas: AccountPlan[] };
    costCenters: CostCenter[];
    suppliers: Supplier[];
    covenants: Covenant[];
    bankAccounts: BankAccount[];
    loading: boolean;
    onAddAccountPlan: (category: 'receita' | 'despesa') => void;
    onEditAccountPlan: (plan: AccountPlan) => void;
    onDeleteAccountPlan: (id: string) => void;
    onAddCostCenter: () => void;
    onEditCostCenter: (center: CostCenter) => void;
    onDeleteCostCenter: (id: string) => void;
    onAddSupplier: () => void;
    onEditSupplier: (supplier: Supplier) => void;
    onDeleteSupplier: (id: string) => void;
    onAddCovenant: () => void;
    onEditCovenant: (covenant: Covenant) => void;
    onDeleteCovenant: (id: string) => void;
    onAddBankAccount: () => void;
    onEditBankAccount: (account: BankAccount) => void;
    onDeleteBankAccount: (id: string) => void;
    onSetDefaultBankAccount: (id: string) => void;
    onRecalculateBalances: () => Promise<void>;
}

export function SettingsDashboard({
    companyData, onUpdateCompanyData,
    accountPlans, costCenters, suppliers, covenants, bankAccounts, loading,
    onAddAccountPlan, onEditAccountPlan, onDeleteAccountPlan,
    onAddCostCenter, onEditCostCenter, onDeleteCostCenter,
    onAddSupplier, onEditSupplier, onDeleteSupplier,
    onAddCovenant, onEditCovenant, onDeleteCovenant,
    onAddBankAccount, onEditBankAccount, onDeleteBankAccount,
    onSetDefaultBankAccount,
    onRecalculateBalances,
}: SettingsDashboardProps) {
    const [isRecalculating, setIsRecalculating] = useState(false);

    const handleRecalculate = async () => {
        if(confirm("Esta ação irá recalcular o saldo de todas as contas com base no histórico. Isso pode levar alguns segundos e só precisa ser feito uma vez ou para corrigir inconsistências. Deseja continuar?")) {
            setIsRecalculating(true);
            await onRecalculateBalances();
            setIsRecalculating(false);
        }
    }

    return (
        <div className="space-y-6">
            <CompanyInfoManager
                initialData={companyData}
                onSave={onUpdateCompanyData}
                loading={loading}
            />

            <Card>
                <CardHeader>
                    <CardTitle>Ações do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <div>
                        <p className="font-medium">Recalcular Saldos Bancários</p>
                        <p className="text-sm text-muted-foreground">Use esta função para sincronizar os saldos caso encontre alguma inconsistência.</p>
                    </div>
                    <Button onClick={handleRecalculate} disabled={isRecalculating}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRecalculating ? 'animate-spin' : ''}`} />
                        {isRecalculating ? "Recalculando..." : "Recalcular Agora"}
                    </Button>
                </CardContent>
            </Card>

            <PlanoContasManager
                accountPlans={accountPlans}
                loading={loading}
                onAdd={onAddAccountPlan}
                onEdit={onEditAccountPlan}
                onDelete={onDeleteAccountPlan}
            />
            <div className="grid lg:grid-cols-2 gap-6">
                <CostCenterManager
                    costCenters={costCenters}
                    loading={loading}
                    onAdd={onAddCostCenter}
                    onEdit={onEditCostCenter}
                    onDelete={onDeleteCostCenter}
                />
                <SupplierManager
                    suppliers={suppliers}
                    loading={loading}
                    onAdd={onAddSupplier}
                    onEdit={onEditSupplier}
                    onDelete={onDeleteSupplier}
                />
                 <CovenantManager
                    covenants={covenants}
                    loading={loading}
                    onAdd={onAddCovenant}
                    onEdit={onEditCovenant}
                    onDelete={onDeleteCovenant}
                />
                <BankAccountManager
                    bankAccounts={bankAccounts}
                    loading={loading}
                    onAdd={onAddBankAccount}
                    onEdit={onEditBankAccount}
                    onDelete={onDeleteBankAccount}
                    onSetDefault={onSetDefaultBankAccount}
                />
            </div>
        </div>
    );
}