// components/financial/settings-dashboard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { AccountPlan, Supplier, Covenant, BankAccount } from "@/services/financialService";
import { CostCenter } from "@/services/settingsService";

// --- INTERFACES DE PROPS CORRIGIDAS ---
// Props base, comuns a todos os 'Managers'
interface BaseManagerProps {
    loading: boolean;
    onEdit: (item: any) => void;
    onDelete: (id: string) => void;
}

// Props específicas para cada 'Manager'
interface PlanoContasManagerProps extends BaseManagerProps { 
    accountPlans: { receitas: AccountPlan[]; despesas: AccountPlan[] }; 
    onAdd: (category: 'receita' | 'despesa') => void; // onAdd requer uma categoria
}
interface CostCenterManagerProps extends BaseManagerProps { 
    costCenters: CostCenter[]; 
    onAdd: () => void; // onAdd não tem argumentos
}
interface SupplierManagerProps extends BaseManagerProps { 
    suppliers: Supplier[]; 
    onAdd: () => void;
}
interface CovenantManagerProps extends BaseManagerProps { 
    covenants: Covenant[]; 
    onAdd: () => void;
}
interface BankAccountManagerProps extends BaseManagerProps { 
    bankAccounts: BankAccount[]; 
    onAdd: () => void;
}
// --- FIM DAS CORREÇÕES DE INTERFACE ---

// Sub-componente para o Plano de Contas (agora usa a prop correta)
const PlanoContasManager = ({ accountPlans, loading, onAdd, onEdit, onDelete }: PlanoContasManagerProps) => {
    const renderPlanTable = (title: string, plans: AccountPlan[]) => (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{title}</CardTitle>
                <Button size="sm" onClick={() => onAdd(title === "Receitas" ? "receita" : "despesa")}><Plus className="mr-2 h-4 w-4" /> Adicionar Conta</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome da Conta</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={3} className="text-center h-24">Carregando...</TableCell></TableRow>
                        ) : (
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
        <div className="space-y-6">
            <h3 className="text-xl font-semibold">Plano de Contas</h3>
            <div className="grid md:grid-cols-2 gap-6">
                {renderPlanTable("Receitas", accountPlans.receitas)}
                {renderPlanTable("Despesas", accountPlans.despesas)}
            </div>
        </div>
    );
};

// (O restante dos componentes Manager permanece igual, mas agora usam as suas interfaces específicas)
const CostCenterManager = ({ costCenters, loading, onAdd, onEdit, onDelete }: CostCenterManagerProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Centros de Custo</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Novo Centro</Button>
        </CardHeader>
        <CardContent>
            {loading ? <p>Carregando...</p> :
                <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {costCenters.map((center) => (
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
            }
        </CardContent>
    </Card>
);

const SupplierManager = ({ suppliers, loading, onAdd, onEdit, onDelete }: SupplierManagerProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Fornecedores</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Novo Fornecedor</Button>
        </CardHeader>
        <CardContent>
             {loading ? <p>Carregando...</p> :
                <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>CNPJ</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {suppliers.map((supplier) => (
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
            }
        </CardContent>
    </Card>
);

const CovenantManager = ({ covenants, loading, onAdd, onEdit, onDelete }: CovenantManagerProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Convênios</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Novo Convênio</Button>
        </CardHeader>
        <CardContent>
            {loading ? <p>Carregando...</p> :
                <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Valor/Consulta</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {covenants.map((covenant) => (
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
            }
        </CardContent>
    </Card>
);

const BankAccountManager = ({ bankAccounts, loading, onAdd, onEdit, onDelete }: BankAccountManagerProps) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contas Bancárias</CardTitle>
            <Button size="sm" onClick={onAdd}><Plus className="mr-2 h-4 w-4" /> Nova Conta</Button>
        </CardHeader>
        <CardContent>
            {loading ? <p>Carregando...</p> :
                <Table>
                    <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Agência</TableHead><TableHead>Conta</TableHead><TableHead>Saldo Inicial</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {bankAccounts.map((account) => (
                            <TableRow key={account.id}>
                                <TableCell className="font-medium">{account.name}</TableCell>
                                <TableCell>{account.agency}</TableCell>
                                <TableCell>{account.account}</TableCell>
                                <TableCell>R$ {account.initialBalance.toLocaleString("pt-BR")}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(account)}>Editar</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600" onClick={() => onDelete(account.id)}>Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            }
        </CardContent>
    </Card>
);

// Props para o Dashboard de Configurações
interface SettingsDashboardProps {
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
}

// Componente principal do Dashboard de Configurações
export function SettingsDashboard({
    accountPlans, costCenters, suppliers, covenants, bankAccounts, loading,
    onAddAccountPlan, onEditAccountPlan, onDeleteAccountPlan,
    onAddCostCenter, onEditCostCenter, onDeleteCostCenter,
    onAddSupplier, onEditSupplier, onDeleteSupplier,
    onAddCovenant, onEditCovenant, onDeleteCovenant,
    onAddBankAccount, onEditBankAccount, onDeleteBankAccount,
}: SettingsDashboardProps) {
    return (
        <div className="space-y-6">
            <PlanoContasManager 
                accountPlans={accountPlans}
                loading={loading}
                onAdd={onAddAccountPlan}
                onEdit={onEditAccountPlan}
                onDelete={onDeleteAccountPlan}
            />
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
            />
        </div>
    );
}