"use client"

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Patient } from "@/services/patientService";
import type { Professional } from "@/services/professionalService";
import { useState } from "react";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: { patientId: string, professionalId: string }) => void;
  slotInfo: { start: Date; end: Date } | null;
  patients: Patient[];
  professionals: Professional[];
}

export function AppointmentModal({ isOpen, onClose, onSubmit, slotInfo, patients, professionals }: AppointmentModalProps) {
  const [patientId, setPatientId] = useState("");
  const [professionalId, setProfessionalId] = useState("");

  const handleSubmit = () => {
    if (!patientId || !professionalId) {
      alert("Por favor, selecione um paciente e um profissional.");
      return;
    }
    onSubmit({ patientId, professionalId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          {slotInfo && (
            <DialogDescription>
              Para: {slotInfo.start.toLocaleDateString('pt-BR')} das {slotInfo.start.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} às {slotInfo.end.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
            </DialogDescription>
          )}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="patient">Paciente</Label>
            <Select onValueChange={setPatientId} value={patientId}>
              <SelectTrigger><SelectValue placeholder="Selecione um paciente..." /></SelectTrigger>
              <SelectContent>
                {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="professional">Profissional</Label>
            <Select onValueChange={setProfessionalId} value={professionalId}>
              <SelectTrigger><SelectValue placeholder="Selecione um profissional..." /></SelectTrigger>
              <SelectContent>
                {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar Agendamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}