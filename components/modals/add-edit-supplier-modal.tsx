// src/components/modals/add-edit-supplier-modal.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { Supplier } from "@/services/financialService";

interface AddEditSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Supplier, 'id'>) => Promise<void>;
    supplier?: Supplier | null;
    isLoading: boolean;
}

export function AddEditSupplierModal({ isOpen, onClose, onSubmit, supplier, isLoading }: AddEditSupplierModalProps) {
    const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
        name: '',
        cnpj: '',
        phone: '',
        email: '',
        address: '',
        status: 'Ativo'
    });

    useEffect(() => {
        if (supplier) {
            setFormData({
                name: supplier.name,
                cnpj: supplier.cnpj,
                phone: supplier.phone,
                email: supplier.email,
                address: supplier.address,
                status: supplier.status
            });
        } else {
            setFormData({
                name: '',
                cnpj: '',
                phone: '',
                email: '',
                address: '',
                status: 'Ativo'
            });
        }
    }, [supplier, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async () => {
        await onSubmit(formData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{supplier ? "Editar Fornecedor" : "Adicionar Novo Fornecedor"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="name">Nome do Fornecedor</Label>
                        <Input id="name" value={formData.name} onChange={handleChange} placeholder="Digite o nome do fornecedor" />
                    </div>
                    <div>
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input id="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" />
                    </div>
                    <div>
                        <Label htmlFor="phone">Telefone</Label>
                        <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" />
                    </div>
                    <div>
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="fornecedor@email.com" />
                    </div>
                    <div>
                        <Label htmlFor="address">Endereço</Label>
                        <Input id="address" value={formData.address} onChange={handleChange} placeholder="Rua, número, bairro, cidade" />
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
                        {isLoading ? "Salvando..." : supplier ? "Salvar Alterações" : "Adicionar Fornecedor"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}