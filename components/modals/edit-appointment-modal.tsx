'use client';

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Copy, Calendar, Clock, User, Stethoscope, Trash2 } from "lucide-react";
import { Appointment, AppointmentFormData, AppointmentStatus } from "@/services/appointmentService";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ✅ CORREÇÃO 1: Definindo explicitamente como boolean para casar com a Grade
  onSave: (
    data: AppointmentFormData & { status: AppointmentStatus; statusSecundario?: string },
    isBlockUpdate: boolean
  ) => void;
  // ✅ CORREÇÃO 2: Definindo explicitamente como boolean
  onDelete: (isBlockDeletion: boolean) => void;
  appointment: Appointment | null;
  professionals: any[];
  patients: any[];
}

export function EditAppointmentModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  appointment,
  professionals,
  patients,
}: EditAppointmentModalProps) {
  const [formData, setFormData] = useState<AppointmentFormData & { status: AppointmentStatus; statusSecundario?: string }>({
    patientId: "",
    professionalId: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    tipo: "",
    sala: "",
    convenio: "",
    valorConsulta: 0,
    observacoes: "",
    status: "agendado",
    statusSecundario: "",
  });

  const [isBlockUpdate, setIsBlockUpdate] = useState(false);

  useEffect(() => {
    if (appointment) {
      const start = appointment.start.toDate();
      const end = appointment.end.toDate();
      // Formata data YYYY-MM-DD para o input HTML
      const dateStr = start.toLocaleDateString('pt-BR').split('/').reverse().join('-');
      
      setFormData({
        patientId: appointment.patientId,
        professionalId: appointment.professionalId,
        data: dateStr,
        horaInicio: start.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        horaFim: end.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        tipo: appointment.tipo || "",
        sala: appointment.sala || "",
        convenio: appointment.convenio || "",
        valorConsulta: appointment.valorConsulta || 0,
        observacoes: appointment.observacoes || "",
        status: appointment.status,
        statusSecundario: appointment.statusSecundario || "",
      });
      setIsBlockUpdate(false);
    }
  }, [appointment]);

  const handleSave = () => {
    onSave(formData, isBlockUpdate);
  };

  const handleDelete = () => {
    const message = isBlockUpdate 
        ? "⚠️ CUIDADO: Você está prestes a excluir TODA a série de agendamentos futuros.\n\nIsso apagará este agendamento e todos os seguintes. Tem certeza?" 
        : "Tem certeza que deseja excluir este agendamento?";

    if (confirm(message)) {
        onDelete(isBlockUpdate);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!appointment) return null;

  const hasBlock = !!appointment.blockId;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1 py-2">
            <div className="grid gap-6">
            
            {/* Linha 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="patient" className="flex items-center gap-2"><User className="h-4 w-4" /> Paciente</Label>
                <Select value={formData.patientId} onValueChange={(val) => handleChange('patientId', val)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                    {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
                    </SelectContent>
                </Select>
                </div>

                <div className="space-y-2">
                <Label htmlFor="professional" className="flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Profissional</Label>
                <Select value={formData.professionalId} onValueChange={(val) => handleChange('professionalId', val)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                    {professionals.map((p) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
                    </SelectContent>
                </Select>
                </div>
            </div>

            {/* Linha 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Data</Label>
                <Input type="date" value={formData.data} onChange={(e) => handleChange('data', e.target.value)} />
                </div>
                <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Início</Label>
                <Input type="time" value={formData.horaInicio} onChange={(e) => handleChange('horaInicio', e.target.value)} />
                </div>
                <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Fim</Label>
                <Input type="time" value={formData.horaFim} onChange={(e) => handleChange('horaFim', e.target.value)} />
                </div>
            </div>

            {/* Linha 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => handleChange('status', val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input value={formData.tipo} onChange={(e) => handleChange('tipo', e.target.value)} placeholder="Ex: Psicologia" />
                </div>
            </div>
            
            {/* Linha 4 */}
            <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={formData.observacoes} onChange={(e) => handleChange('observacoes', e.target.value)} placeholder="Detalhes..." className="h-20" />
            </div>

            {/* SEÇÃO DE SÉRIE / BLOCO */}
            {hasBlock && (
                <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-all">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="bg-blue-100 dark:bg-blue-800 p-2 rounded-full text-blue-600 dark:text-blue-200">
                        <Copy className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                        <Label htmlFor="block-mode" className="text-base font-medium cursor-pointer">
                        Aplicar a toda a série?
                        </Label>
                        <p className="text-sm text-muted-foreground">
                        Deseja alterar ou <strong>excluir</strong> os agendamentos futuros também?
                        </p>
                    </div>
                    </div>
                    <Switch id="block-mode" checked={isBlockUpdate} onCheckedChange={setIsBlockUpdate} />
                </div>

                {isBlockUpdate && (
                    <div className="mt-3 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                        <strong>Modo Série Ativado:</strong> O botão "Salvar" recriará a série e o botão "Excluir" apagará todos os futuros.
                    </p>
                    </div>
                )}
                </div>
            )}
            </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-4">
            <Button 
                variant="destructive" 
                onClick={handleDelete}
                className="gap-2 sm:w-auto w-full"
            >
                <Trash2 className="h-4 w-4" />
                {isBlockUpdate ? "Excluir Série Futura" : "Excluir"}
            </Button>

            <div className="flex gap-2 justify-end w-full sm:w-auto">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button 
                    onClick={handleSave} 
                    className={isBlockUpdate ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                >
                    {isBlockUpdate ? "Salvar Série Inteira" : "Salvar Alterações"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}