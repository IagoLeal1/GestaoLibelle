// components/forms/FormRecurringSwitch.tsx
"use client";

import { useFormContext } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Repeat } from "lucide-react";

interface FormRecurringSwitchProps {
    isRecurring: boolean;
}

export function FormRecurringSwitch({ isRecurring }: FormRecurringSwitchProps) {
    const { control } = useFormContext(); // Acessa o controle do formulário "pai"

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <FormField
                control={control}
                name="isRecurring"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                        <Label htmlFor="recurring-switch" className="cursor-pointer flex items-center gap-2 text-base">
                            <Repeat className="h-4 w-4" />
                            Lançamento Sequencial
                        </Label>
                        <FormControl>
                            <Switch
                                id="recurring-switch"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
            
            {isRecurring && (
                <div className="pt-4 border-t">
                    <FormField
                        control={control}
                        name="repetitions"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Número de Parcelas/Repetições</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="number" 
                                        min={1} 
                                        {...field} 
                                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    );
}