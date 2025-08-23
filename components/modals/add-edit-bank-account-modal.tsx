// src/components/modals/add-edit-bank-account-modal.tsx
"use client";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BankAccount } from "@/services/financialService";

interface AddEditBankAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<BankAccount, 'id'>) => Promise<void>;
    bankAccount?: BankAccount | null;
    isLoading: boolean;
}

export function AddEditBankAccountModal({ isOpen, onClose, onSubmit, bankAccount, isLoading }: AddEditBankAccountModalProps) {
    const [formData, setFormData] = useState<Omit<BankAccount, 'id'>>({
        name: '',
        agency: '',
        account: '',
        type: 'Conta Corrente',
        initialBalance: 0
    });

    useEffect(() => {
        if (bankAccount) {
            setFormData({
                name: bankAccount.name,
                agency: bankAccount.agency,
                account: bankAccount.account,
                type: bankAccount.type,
                initialBalance: bankAccount.initialBalance
            });
        } else {
            setFormData({
                name: '',
                agency: '',
                account: '',
                type: 'Conta Corrente',
                initialBalance: 0
            });
        }
    }, [bankAccount, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
    };

    const handleSubmit = async () => {
        await onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{bankAccount ? "Editar Conta Bancária" : "Adicionar Nova Conta Bancária"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="name">Nome do Banco</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} placeholder="Ex: Banco do Brasil" />
                    </div>
                    <div>
                        <Label htmlFor="type">Tipo de Conta</Label>
                        <select id="type" value={formData.type} onChange={handleChange} className="w-full p-2 border rounded-md">
                            <option value="Conta Corrente">Conta Corrente</option>
                            <option value="Conta Poupança">Conta Poupança</option>
                            <option value="Conta Salário">Conta Salário</option>
                        </select>
                    </div>
                    <div>
                        <Label htmlFor="agency">Agência</Label>
                        <Input id="agency" value={formData.agency} onChange={handleChange} placeholder="Ex: 1234-5" />
                    </div>
                    <div>
                        <Label htmlFor="account">Número da Conta</Label>
                        <Input id="account" value={formData.account} onChange={handleChange} placeholder="Ex: 12345-6" />
                    </div>
                    <div>
                        <Label htmlFor="initialBalance">Saldo Inicial (R$)</Label>
                        <Input id="initialBalance" type="number" step="0.01" value={formData.initialBalance} onChange={handleNumberChange} placeholder="0,00" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Salvando..." : bankAccount ? "Salvar Alterações" : "Adicionar Conta"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}