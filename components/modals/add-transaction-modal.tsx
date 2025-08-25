// src/components/modals/add-transaction-modal.tsx
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
import { Switch } from "@/components/ui/switch"; // Importar o Switch
import { Repeat } from "lucide-react"; // Opcional: ícone para o switch
import { AccountPlan } from "@/services/financialService";
import { CostCenter } from "@/services/settingsService";
import { useState, useEffect } from "react"; // Importar useState

// Atualizar o schema para incluir o campo de repetições
const formSchema = z.object({
    type: z.enum(["receita", "despesa"]),
    description: z.string().min(1, "A descrição é obrigatória."),
    value: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
    date: z.string(),
    status: z.enum(["pendente", "pago"]),
    category: z.string().min(1, "A categoria é obrigatória."),
    costCenter: z.string().min(1, "O centro de custo é obrigatório."),
    bankAccountId: z.string().optional(),
    repetitions: z.coerce.number().optional(), // Campo opcional para repetições
});

type FormValues = z.infer<typeof formSchema>;

interface AddTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    // A prop onSubmit agora pode lidar com os dois cenários
    onSubmit: (data: FormValues, isBlock: boolean) => Promise<void>;
    accountPlans: { receitas: AccountPlan[]; despesas: AccountPlan[] };
    costCenters: CostCenter[];
    isLoading: boolean;
}

export function AddTransactionModal({ isOpen, onClose, onSubmit, accountPlans, costCenters, isLoading }: AddTransactionModalProps) {
    // Estado para controlar o modo sequencial
    const [isRecurring, setIsRecurring] = useState(false);

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
            repetitions: 1, // Valor inicial
        },
    });

    const selectedType = form.watch("type");

    useEffect(() => {
        if (!isOpen) {
            form.reset();
            setIsRecurring(false); // Garante que o switch resete ao fechar
        }
    }, [isOpen, form]);

    const handleFormSubmit = async (data: FormValues) => {
        // Validação extra para o modo sequencial
        if (isRecurring && (!data.repetitions || data.repetitions < 1)) {
            form.setError("repetitions", { message: "Deve ser no mínimo 1." });
            return;
        }
        // Chama a função onSubmit da página, passando os dados e se é um bloco ou não
        await onSubmit(data, isRecurring);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Movimentação</DialogTitle>
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
                                    <FormLabel>Data da primeira parcela</FormLabel>
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
                        
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="recurring-switch"
                                    checked={isRecurring}
                                    onCheckedChange={setIsRecurring}
                                    disabled={isLoading}
                                />
                                <Label htmlFor="recurring-switch" className="cursor-pointer flex items-center gap-2">
                                    <Repeat className="h-4 w-4" />
                                    Lançamento Sequencial (Mensal)
                                </Label>
                            </div>
                            {isRecurring && (
                                <FormField
                                    control={form.control}
                                    name="repetitions"
                                    render={({ field }) => (
                                        <FormItem className="pt-4 border-t">
                                            <FormLabel>Número de Parcelas/Repetições</FormLabel>
                                            <FormControl>
                                                <Input type="number" min={1} {...field} disabled={isLoading} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

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