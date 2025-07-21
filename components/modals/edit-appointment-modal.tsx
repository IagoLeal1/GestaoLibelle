"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, AppointmentFormData, AppointmentStatus } from "@/services/appointmentService";
import { Patient } from "@/services/patientService";
import { Professional } from "@/services/professionalService";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: AppointmentFormData & { status: AppointmentStatus }) => void;
  onDelete: () => void;
  appointment: Appointment | null;
  patients: Patient[];
  professionals: Professional[];
}

export function EditAppointmentModal({ isOpen, onClose, onSave, onDelete, appointment, patients, professionals }: EditAppointmentModalProps) {
  const [formData, setFormData] = useState<Partial<AppointmentFormData & { status: AppointmentStatus }>>({});

  useEffect(() => {
    if (appointment) {
      const startDate = appointment.start.toDate();
      setFormData({
        patientId: appointment.patientId,
        professionalId: appointment.professionalId,
        data: startDate.toISOString().split('T')[0],
        hora: startDate.toTimeString().split(' ')[0].substring(0, 5),
        tipo: appointment.tipo,
        sala: appointment.sala,
        convenio: appointment.convenio,
        observacoes: appointment.observacoes,
        status: appointment.status,
      });
    }
  }, [appointment]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => onSave(formData as AppointmentFormData & { status: AppointmentStatus });
  const handleDelete = () => { if (window.confirm("Tem certeza que deseja excluir este agendamento?")) { onDelete(); } };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>{appointment.patientName} com {appointment.professionalName}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Paciente</Label><Select value={formData.patientId} onValueChange={(v) => handleInputChange("patientId", v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{patients.map(p=><SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Profissional</Label><Select value={formData.professionalId} onValueChange={(v) => handleInputChange("professionalId", v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{professionals.map(p=><SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.data} onChange={(e) => handleInputChange("data", e.target.value)} /></div>
            <div className="space-y-2"><Label>Hora</Label><Input type="time" value={formData.hora} onChange={(e) => handleInputChange("hora", e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="agendado">Agendado</SelectItem><SelectItem value="em_atendimento">Em Atendimento</SelectItem><SelectItem value="finalizado">Finalizado</SelectItem><SelectItem value="nao_compareceu">Não compareceu</SelectItem><SelectItem value="cancelado">Cancelado</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Observações</Label><Textarea value={formData.observacoes} onChange={(e) => handleInputChange("observacoes", e.target.value)} /></div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}