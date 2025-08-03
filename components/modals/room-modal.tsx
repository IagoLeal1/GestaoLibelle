"use client"

import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Room, RoomFormData } from "@/services/roomService";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormData) => void;
  room?: Room | null;
  isLoading: boolean;
}

export function RoomModal({ isOpen, onClose, onSubmit, room, isLoading }: RoomModalProps) {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RoomFormData>();
  const isEditMode = !!room;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && room) {
        // --- CORREÇÃO AQUI ---
        // Converte o array 'equipment' em uma string separada por vírgulas para o formulário
        const formData = {
          ...room,
          equipment: room.equipment?.join(', ') || ''
        };
        reset(formData);
        // -------------------------
      } else {
        // Estado inicial para criação de uma nova sala
        reset({ name: "", number: "", floor: 1, type: "psicologia", description: "", capacity: 1, equipment: "", status: "ativa" });
      }
    }
  }, [isOpen, isEditMode, room, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Editar Sala" : "Nova Sala"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Sala *</Label>
              <Input id="name" {...register("name", { required: "O nome é obrigatório" })} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número *</Label>
              <Input id="number" {...register("number", { required: "O número é obrigatório" })} />
              {errors.number && <p className="text-xs text-red-500">{errors.number.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" placeholder="Ex: Sala equipada para terapia ocupacional" {...register("description")} />
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="floor">Andar *</Label>
                <Input id="floor" type="number" {...register("floor", { required: true, valueAsNumber: true })} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="type">Tipo de Sala *</Label>
                <Input id="type" placeholder="Ex: psicologia, fono..." {...register("type", { required: true })} />
             </div>
           </div>
          <div className="space-y-2">
            <Label htmlFor="equipment">Equipamentos (separados por vírgula)</Label>
            <Input id="equipment" {...register("equipment")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} defaultValue="ativa">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="inativa">Inativa</SelectItem>
                    <SelectItem value="manutencao">Em Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
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