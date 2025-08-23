// src/components/modals/add-edit-account-plan-modal.tsx
"use client";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { AccountPlan } from "@/services/financialService";
import { useEffect } from "react";

const formSchema = z.object({
    code: z.string().min(1, "O código é obrigatório."),
    name: z.string().min(1, "O nome da conta é obrigatório."),
    category: z.enum(["receita", "despesa"], { message: "A categoria é obrigatória." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddEditAccountPlanModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormValues) => Promise<void>;
    accountPlan?: AccountPlan | null;
    isLoading: boolean;
}

export function AddEditAccountPlanModal({ isOpen, onClose, onSubmit, accountPlan, isLoading }: AddEditAccountPlanModalProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: "",
            name: "",
            category: "receita",
        },
    });

    useEffect(() => {
        if (accountPlan) {
            form.reset({
                code: accountPlan.code,
                name: accountPlan.name,
                category: accountPlan.category,
            });
        }
    }, [accountPlan, form]);

    const isEditing = !!accountPlan?.id;

    const handleFormSubmit = async (data: FormValues) => {
        await onSubmit(data);
        if (!isLoading) {
            onClose();
            form.reset();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Conta" : "Adicionar Nova Conta"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Altere as informações desta conta." : "Preencha os dados para criar uma nova conta no plano."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: 1.1.1.01" disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Conta</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Honorários Médicos" disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a categoria" />
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
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Conta"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}