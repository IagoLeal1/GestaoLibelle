// components/modals/add-transaction-modal.tsx
"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Repeat } from "lucide-react";
import { AccountPlan, BankAccount } from "@/services/financialService";
import { CostCenter } from "@/services/settingsService";
import { useEffect } from "react";
import { FormRecurringSwitch } from "../forms/FormRecurringSwitch";

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
    isRecurring: z.boolean().default(false),
    repetitions: z.coerce.number().optional(),
});

export type FormValues = z.infer<typeof formSchema>;

export interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormValues, isBlock: boolean) => Promise<void>;
    accountPlans: { receitas: AccountPlan[]; despesas: AccountPlan[] };
    costCenters: CostCenter[];
    bankAccounts: BankAccount[];
    isLoading: boolean;
}

export function AddTransactionModal({ isOpen, onClose, onSubmit, accountPlans, costCenters, bankAccounts, isLoading }: AddTransactionModalProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: "receita",
            description: "",
            value: 0,
            dataMovimento: new Date().toISOString().split('T')[0],
            dataEmissao: new Date().toISOString().split('T')[0],
            status: "pendente",
            category: "",
            costCenter: "",
            bankAccountId: "none",
            isRecurring: false,
            repetitions: 1,
        },
    });

    const isRecurring = form.watch("isRecurring");
    const selectedType = form.watch("type");

    useEffect(() => {
        if (!isOpen) {
            form.reset({
                type: "receita", description: "", value: 0,
                dataMovimento: new Date().toISOString().split('T')[0],
                dataEmissao: new Date().toISOString().split('T')[0],
                status: "pendente", category: "", costCenter: "",
                bankAccountId: "none", isRecurring: false, repetitions: 1,
            });
        }
    }, [isOpen, form]);

    const handleFormSubmit = async (data: FormValues) => {
        if (data.isRecurring && (!data.repetitions || data.repetitions < 1)) {
            form.setError("repetitions", { message: "Deve ser no mínimo 1." });
            return;
        }
        await onSubmit(data, data.isRecurring);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
           <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
                        
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
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

                        <FormField control={form.control} name="description" render={({ field }) => ( <FormItem> <FormLabel>Descrição *</FormLabel> <FormControl> <Textarea placeholder="Ex: Consulta, Repasse..." {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="value" render={({ field }) => ( <FormItem> <FormLabel>Valor (R$) *</FormLabel> <FormControl> <Input type="number" step="0.01" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                            <FormField control={form.control} name="dataEmissao" render={({ field }) => ( <FormItem> <FormLabel>Data de Emissão</FormLabel> <FormControl> <Input type="date" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        </div>
                        <FormField control={form.control} name="dataMovimento" render={({ field }) => ( <FormItem> <FormLabel>Data de Movimento *</FormLabel> <FormControl> <Input type="date" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                        
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Plano de Contas *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
                                    <FormLabel>Centro de Custo *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
                            name="bankAccountId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Conta Bancária</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhuma</SelectItem>
                                            {bankAccounts.map((account) => (
                                                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                        
                        <FormRecurringSwitch isRecurring={isRecurring} />

                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Salvando..." : "Salvar Movimentação"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}