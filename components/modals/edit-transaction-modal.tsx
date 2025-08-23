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
import { Label } from "@/components/ui/label";
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
import { AccountPlan, Transaction } from "@/services/financialService";
import { CostCenter } from "@/services/settingsService";
import { useEffect } from "react";
import { format } from "date-fns";

const formSchema = z.object({
    type: z.enum(["receita", "despesa"]),
    description: z.string().min(1, "A descrição é obrigatória."),
    value: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
    date: z.string(),
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
    isLoading: boolean;
}

export function EditTransactionModal({ isOpen, onClose, onSubmit, transaction, accountPlans, costCenters, isLoading }: EditTransactionModalProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "despesa",
            description: "",
            value: 0,
            date: new Date().toISOString().split('T')[0],
            status: "pendente",
            category: "",
            costCenter: "",
            bankAccountId: "",
        },
    });

    useEffect(() => {
        if (transaction) {
            form.reset({
                type: transaction.type,
                description: transaction.description,
                value: transaction.value,
                date: format(transaction.date.toDate(), 'yyyy-MM-dd'),
                status: transaction.status,
                category: transaction.category,
                costCenter: transaction.costCenter,
                bankAccountId: transaction.bankAccountId,
            });
        }
    }, [transaction, form]);

    const selectedType = form.watch("type");

    const handleFormSubmit = async (data: FormValues) => {
        await onSubmit({ ...data, date: new Date(data.date) });
        if (!isLoading) {
            onClose();
            form.reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Movimentação</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="receita">Receita</SelectItem>
                                            <SelectItem value="despesa">Despesa</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plano de Contas</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma categoria" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {(selectedType === 'receita' ? accountPlans.receitas : accountPlans.despesas).map((plan) => (
                                                <SelectItem key={plan.id} value={plan.name}>{plan.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="costCenter"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Centro de Custo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o centro de custo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {costCenters.map((center) => (
                                                <SelectItem key={center.id} value={center.name}>{center.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descrição</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Descrição detalhada" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="value"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="pendente">Pendente</SelectItem>
                                            <SelectItem value="pago">Pago</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}