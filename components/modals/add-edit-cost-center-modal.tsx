// src/components/modals/add-edit-cost-center-modal.tsx
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CostCenter } from "@/services/settingsService";
import { useEffect } from "react";

const formSchema = z.object({
    name: z.string().min(1, "O nome do centro de custo é obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;

interface AddEditCostCenterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: FormValues) => Promise<void>;
    costCenter?: CostCenter | null;
    isLoading: boolean;
}

export function AddEditCostCenterModal({ isOpen, onClose, onSubmit, costCenter, isLoading }: AddEditCostCenterModalProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });

    useEffect(() => {
        if (costCenter) {
            form.reset({ name: costCenter.name });
        }
    }, [costCenter, form]);

    const isEditing = !!costCenter?.id;

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
                    <DialogTitle>{isEditing ? "Editar Centro de Custo" : "Adicionar Novo Centro de Custo"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Altere o nome deste centro." : "Preencha o nome para criar um novo centro de custo."}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="grid gap-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Centro</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex: Psicologia" disabled={isLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Adicionar Centro"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}