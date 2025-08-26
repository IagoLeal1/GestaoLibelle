// src/components/modals/add-edit-covenant-modal.tsx
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
import { Covenant } from "@/services/financialService";
import { formatCPF_CNPJ, formatPhone } from "@/lib/formatters"; // Importando as funções

interface AddEditCovenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Covenant, 'id'>) => Promise<void>;
    covenant?: Covenant | null;
    isLoading: boolean;
}

export function AddEditCovenantModal({ isOpen, onClose, onSubmit, covenant, isLoading }: AddEditCovenantModalProps) {
    const [formData, setFormData] = useState<Omit<Covenant, 'id' | 'address'>>({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        status: 'Ativo',
        valuePerConsult: 0
    });

    useEffect(() => {
        if (covenant) {
            setFormData({
                name: covenant.name,
                cnpj: covenant.cnpj,
                phone: covenant.phone,
                email: covenant.email,
                status: covenant.status,
                valuePerConsult: covenant.valuePerConsult
            });
        } else {
            setFormData({
                name: '',
                cnpj: '',
                phone: '',
                email: '',
                status: 'Ativo',
                valuePerConsult: 0
            });
        }
    }, [covenant, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        
        let formattedValue = value;
        if (id === 'cnpj') {
            formattedValue = formatCPF_CNPJ(value);
        } else if (id === 'phone') {
            formattedValue = formatPhone(value);
        }

        setFormData(prev => ({ ...prev, [id]: formattedValue }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: parseFloat(value) || 0 }));
    };

    const handleSubmit = async () => {
        const dataToSubmit = {
            ...formData,
            cnpj: formData.cnpj.replace(/\D/g, ''),
            phone: formData.phone.replace(/\D/g, ''),
        };
        await onSubmit(dataToSubmit as any);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{covenant ? "Editar Convênio" : "Adicionar Novo Convênio"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="name">Nome do Convênio</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} placeholder="Digite o nome do convênio" />
                    </div>
                    <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input id="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" />
                    </div>
                    <div>
                        <Label htmlFor="valuePerConsult">Valor por Consulta</Label>
                        <Input id="valuePerConsult" type="number" step="0.01" value={formData.valuePerConsult} onChange={handleNumberChange} placeholder="0,00" />
                    </div>
                    <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="convenio@email.com" />
                    </div>
                    <div>
                        <Label htmlFor="status">Status</Label>
                        <select id="status" value={formData.status} onChange={handleChange} className="w-full p-2 border rounded-md">
                            <option value="Ativo">Ativo</option>
                            <option value="Inativo">Inativo</option>
                        </select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? "Salvando..." : covenant ? "Salvar Alterações" : "Adicionar Convênio"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}