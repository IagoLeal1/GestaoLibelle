"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, AlertCircle, Repeat } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch"; // Importamos o Switch

import { createAppointment, createAppointmentBlock, AppointmentFormData, AppointmentBlockFormData } from "@/services/appointmentService";
import { getPatients, Patient } from "@/services/patientService";
import { getProfessionals, Professional } from "@/services/professionalService";

export function AppointmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isRecurring, setIsRecurring] = useState(false); // Estado para o switch
  const [formData, setFormData] = useState<Partial<AppointmentFormData & AppointmentBlockFormData>>({
    sessions: 4, // Valor padrão
  });

  useEffect(() => {
    const fetchData = async () => {
        const [patientsData, professionalsData] = await Promise.all([getPatients(), getProfessionals()]);
        setPatients(patientsData);
        setProfessionals(professionalsData);
    };
    fetchData();
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let result;
    if (isRecurring) {
        // Chama a função de criar em lote
        result = await createAppointmentBlock(formData as AppointmentBlockFormData);
    } else {
        // Chama a função de criar agendamento único
        result = await createAppointment(formData as AppointmentFormData);
    }

    setLoading(false);
    if (result.success) {
        alert(`Agendamento(s) criado(s) com sucesso!`);
        router.push("/agendamentos");
        router.refresh();
    } else {
        setError(result.error || "Ocorreu um erro.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Informações do Agendamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
          
          <div className="flex items-center space-x-2 rounded-lg border p-4">
            <Repeat className="h-5 w-5" />
            <Label htmlFor="recurring-switch" className="flex-1">Repetir semanalmente</Label>
            <Switch
              id="recurring-switch"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2"><Label>Paciente *</Label><Select onValueChange={(v) => handleInputChange("patientId", v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Profissional *</Label><Select onValueChange={(v) => handleInputChange("professionalId", v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Data {isRecurring ? 'do Primeiro Atendimento' : ''} *</Label><Input type="date" onChange={(e) => handleInputChange("data", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Horário *</Label><Input type="time" onChange={(e) => handleInputChange("hora", e.target.value)} required /></div>
            
            {isRecurring && (
              <div className="space-y-2">
                <Label>Número de Sessões *</Label>
                <Input type="number" value={formData.sessions} onChange={(e) => handleInputChange("sessions", Number(e.target.value))} required min={1} />
              </div>
            )}

            <div className="space-y-2 md:col-span-2"><Label>Tipo de Atendimento *</Label><Select onValueChange={(v) => handleInputChange("tipo", v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="Terapia">Terapia</SelectItem><SelectItem value="Consulta">Consulta</SelectItem></SelectContent></Select></div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar Agendamento(s)"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
