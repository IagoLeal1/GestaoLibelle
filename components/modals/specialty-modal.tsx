"use client"

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Specialty, SpecialtyFormData } from "@/services/specialtyService";

interface SpecialtyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SpecialtyFormData) => void;
  specialty?: Specialty | null;
  isLoading: boolean;
}

export function SpecialtyModal({ isOpen, onClose, onSubmit, specialty, isLoading }: SpecialtyModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<SpecialtyFormData>();

  const isEditMode = !!specialty;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        reset(specialty);
      } else {
        reset({ name: "", value: 0, description: "" });
      }
    }
  }, [isOpen, isEditMode, specialty, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Especialidade" : "Nova Especialidade"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Especialidade *</Label>
            <Input id="name" {...register("name", { required: "O nome é obrigatório" })} />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="value">Valor da Consulta (R$) *</Label>
            <Input id="value" type="number" step="0.01" {...register("value", { required: "O valor é obrigatório", valueAsNumber: true })} />
            {errors.value && <p className="text-xs text-red-500">{errors.value.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}