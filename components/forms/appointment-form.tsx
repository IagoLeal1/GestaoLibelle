"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createAppointment, AppointmentFormData } from "@/services/appointmentService";
import { getPatients, Patient } from "@/services/patientService";
import { getProfessionals, Professional } from "@/services/professionalService";

export function AppointmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [formData, setFormData] = useState<Partial<AppointmentFormData>>({});

  useEffect(() => {
    const fetchDataForSelects = async () => {
        const [patientsData, professionalsData] = await Promise.all([getPatients(), getProfessionals()]);
        setPatients(patientsData);
        setProfessionals(professionalsData);
    };
    fetchDataForSelects();
  }, []);

  const handleInputChange = (field: keyof AppointmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        // A CORREÇÃO ESTÁ AQUI: Adicionamos um parâmetro aleatório para forçar a atualização
        router.push(`/agendamentos?refresh=${Date.now()}`);
    } else {
        setError(result.error || "Ocorreu um erro desconhecido.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Informações do Agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2"><Label>Paciente *</Label><Select onValueChange={(v) => handleInputChange("patientId", v)}><SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Profissional *</Label><Select onValueChange={(v) => handleInputChange("professionalId", v)}><SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger><SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Data *</Label><Input type="date" onChange={(e) => handleInputChange("data", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Horário *</Label><Input type="time" onChange={(e) => handleInputChange("hora", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Sala</Label><Input placeholder="Ex: Sala 1, Online" onChange={(e) => handleInputChange("sala", e.target.value)} /></div>
            <div className="space-y-2"><Label>Convênio</Label><Input placeholder="Ex: Unimed, Particular" onChange={(e) => handleInputChange("convenio", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Tipo de Atendimento *</Label><Select onValueChange={(v) => handleInputChange("tipo", v)}><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent><SelectItem value="Consulta">Consulta</SelectItem><SelectItem value="Retorno">Retorno</SelectItem><SelectItem value="Avaliação">Avaliação</SelectItem></SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label>Observações</Label><Textarea placeholder="Observações..." onChange={(e) => handleInputChange("observacoes", e.target.value)} rows={3} /></div>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar Agendamento"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}