"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Patient } from "@/services/patientService";
import type { Professional } from "@/services/professionalService";
import { AppointmentFormData, createAppointment } from "@/services/appointmentService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Para atualizar o calendário na página pai
  slotInfo: { start: Date; end: Date } | null;
  patients: Patient[];
  professionals: Professional[];
}

export function AppointmentModal({ isOpen, onClose, onSuccess, slotInfo, patients, professionals }: AppointmentModalProps) {
  const [formData, setFormData] = useState<Partial<AppointmentFormData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Preenche a data e hora quando o modal abre
    if (slotInfo) {
      setFormData({
        data: slotInfo.start.toISOString().split('T')[0],
        hora: slotInfo.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      });
    }
  }, [slotInfo]);


  const handleInputChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    if (!formData.patientId || !formData.professionalId || !formData.data || !formData.hora) {
      setError("Paciente, profissional, data e hora são obrigatórios.");
      setLoading(false);
      return;
    }
    
    const result = await createAppointment(formData as AppointmentFormData);

    setLoading(false);
    if (result.success) {
        alert("Agendamento criado com sucesso!");
        onSuccess(); // Chama a função para atualizar o calendário
    } else {
        // A CORREÇÃO ESTÁ AQUI
        setError(result.error || "Ocorreu um erro desconhecido.");
    }
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
            <Label htmlFor="patient">Paciente *</Label>
            <Select onValueChange={(value) => handleInputChange("patientId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione um paciente..." /></SelectTrigger>
              <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="professional">Profissional *</Label>
            <Select onValueChange={(value) => handleInputChange("professionalId", value)}>
              <SelectTrigger><SelectValue placeholder="Selecione um profissional..." /></SelectTrigger>
              <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
              <Label>Tipo de Atendimento *</Label>
              <Select onValueChange={(value) => handleInputChange("tipo", value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Consulta">Consulta</SelectItem>
                      <SelectItem value="Retorno">Retorno</SelectItem>
                      <SelectItem value="Avaliação">Avaliação</SelectItem>
                  </SelectContent>
              </Select>
          </div>
           {/* Adicione os campos de Sala e Convênio aqui se desejar */}
        </div>
        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? "Salvando..." : "Salvar Agendamento"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}