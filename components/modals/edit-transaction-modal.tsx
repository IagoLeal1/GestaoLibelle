// src/components/modals/edit-transaction-modal.tsx
"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { AccountPlan, Transaction, BankAccount } from "@/services/financialService";
import { CostCenter } from "@/services/settingsService";
import { useEffect } from "react";
import { format } from "date-fns";

// Schema atualizado com os novos campos de data
const formSchema = z.object({
    type: z.enum(["receita", "despesa"]),
    description: z.string().min(1, "A descrição é obrigatória."),
    value: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
    dataMovimento: z.string().min(1, "A data de movimento é obrigatória."),
    dataEmissao: z.string().optional(),
    status: z.enum(["pendente", "pago"]),
    category: z.string().min(1, "A categoria é obrigatória."),
    costCenter: z.string().min(1, "O centro de custo é obrigatório."),
    bankAccountId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    transaction: Transaction | null;
    accountPlans: { receitas: AccountPlan[]; despesas: AccountPlan[] };
    costCenters: CostCenter[];
    bankAccounts: BankAccount[];
    isLoading: boolean;
}

export function EditTransactionModal({ isOpen, onClose, onSubmit, transaction, accountPlans, costCenters, bankAccounts, isLoading }: EditTransactionModalProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
    });
    
    // useEffect atualizado para formatar as datas corretamente
    useEffect(() => {
        if (transaction && isOpen) {
            form.reset({
                type: transaction.type,
                description: transaction.description,
                value: transaction.value,
                dataMovimento: format(transaction.dataMovimento.toDate(), 'yyyy-MM-dd'),
                dataEmissao: transaction.dataEmissao ? format(transaction.dataEmissao.toDate(), 'yyyy-MM-dd') : undefined,
                status: transaction.status,
                category: transaction.category,
                costCenter: transaction.costCenter,
                bankAccountId: transaction.bankAccountId || "none",
            });
        }
    }, [transaction, form, isOpen]);

    const selectedType = form.watch("type");

    // Função de submit atualizada para converter as datas de volta para objetos Date
    const handleFormSubmit = async (data: FormValues) => {
        const submissionData = {
            ...data,
            dataMovimento: new Date(data.dataMovimento),
            dataEmissao: data.dataEmissao ? new Date(data.dataEmissao) : undefined,
            bankAccountId: data.bankAccountId === "none" ? undefined : data.bankAccountId,
        };
        await onSubmit(submissionData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Movimentação</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                        {/* Tipo */}
                        <FormField control={form.control} name="type" render={({ field }) => ( <FormItem> <FormLabel>Tipo</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}> <FormControl> <SelectTrigger><SelectValue /></SelectTrigger> </FormControl> <SelectContent> <SelectItem value="receita">Receita</SelectItem> <SelectItem value="despesa">Despesa</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        {/* Descrição */}
                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descrição</FormLabel> <FormControl> <Textarea placeholder="Descrição detalhada" {...field} disabled={isLoading} /> </FormControl> <FormMessage /> </FormItem> )} />
                        
                        {/* Valor e Datas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="value" render={({ field }) => ( <FormItem> <FormLabel>Valor (R$)</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} disabled={isLoading} /> </FormControl> <FormMessage /> </FormItem> )} />
                            <FormField control={form.control} name="dataEmissao" render={({ field }) => ( <FormItem> <FormLabel>Data de Emissão</FormLabel> <FormControl> <Input type="date" {...field} disabled={isLoading} /> </FormControl> <FormMessage /> </FormItem> )} />
                            <FormField control={form.control} name="dataMovimento" render={({ field }) => ( <FormItem> <FormLabel>Data de Movimento</FormLabel> <FormControl> <Input type="date" {...field} disabled={isLoading} /> </FormControl> <FormMessage /> </FormItem> )} />
                        </div>

                        {/* Plano de Contas */}
                        <FormField control={form.control} name="category" render={({ field }) => ( <FormItem> <FormLabel>Plano de Contas</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}> <FormControl> <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger> </FormControl> <SelectContent> {(selectedType === 'receita' ? accountPlans.receitas : accountPlans.despesas).map((plan) => ( <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        {/* Centro de Custo */}
                        <FormField control={form.control} name="costCenter" render={({ field }) => ( <FormItem> <FormLabel>Centro de Custo</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}> <FormControl> <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger> </FormControl> <SelectContent> {costCenters.map((center) => ( <SelectItem key={center.id} value={center.name}>{center.name}</SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        {/* Conta Bancária */}
                        <FormField control={form.control} name="bankAccountId" render={({ field }) => ( <FormItem> <FormLabel>Conta Bancária</FormLabel> <Select onValueChange={field.onChange} value={field.value || 'none'} disabled={isLoading}> <FormControl> <SelectTrigger> <SelectValue placeholder="Selecione..." /> </SelectTrigger> </FormControl> <SelectContent> <SelectItem value="none">Nenhuma</SelectItem> {bankAccounts.map((account) => ( <SelectItem key={account.id} value={account.id}> {account.name} </SelectItem> ))} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        {/* Status */}
                        <FormField control={form.control} name="status" render={({ field }) => ( <FormItem> <FormLabel>Status</FormLabel> <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}> <FormControl> <SelectTrigger><SelectValue /></SelectTrigger> </FormControl> <SelectContent> <SelectItem value="pendente">Pendente</SelectItem> <SelectItem value="pago">Pago</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
                        
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}> {isLoading ? "Salvando..." : "Salvar Alterações"} </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}