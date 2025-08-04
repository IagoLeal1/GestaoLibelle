"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, AlertCircle, Repeat, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

import { createAppointment, createAppointmentBlock, getOccupiedRoomIdsByTime, AppointmentFormData, AppointmentBlockFormData } from "@/services/appointmentService";
import { getPatients, Patient } from "@/services/patientService";
import { getProfessionals, Professional } from "@/services/professionalService";
import { getSpecialties, Specialty } from "@/services/specialtyService";
import { getRooms, Room } from "@/services/roomService";

// --- NOVA LISTA DE HORÁRIOS ---
const timeSlots = [
    '07:20', '08:10', '09:00', '09:50', '10:40', '11:30', '12:20',
    '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'
];

export function AppointmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [occupiedRoomIds, setOccupiedRoomIds] = useState<string[]>([]);

  const [isRecurring, setIsRecurring] = useState(false);
  const [formData, setFormData] = useState<Partial<AppointmentFormData & AppointmentBlockFormData>>({
    sessions: 4,
  });

  useEffect(() => {
    const fetchData = async () => {
        const [patientsData, professionalsData, specialtiesData, roomsData] = await Promise.all([
            getPatients(), 
            getProfessionals(),
            getSpecialties(),
            getRooms()
        ]);
        setPatients(patientsData);
        setProfessionals(professionalsData);
        setSpecialties(specialtiesData);
        setRooms(roomsData.filter(r => r.status === 'ativa'));
    };
    fetchData();
  }, []);

  useEffect(() => {
    const checkRoomAvailability = async () => {
      // A verificação agora é mais segura, pois 'hora' sempre será um valor completo
      if (formData.data && formData.hora) {
        const [year, month, day] = formData.data.split('-').map(Number);
        const [hour, minute] = formData.hora.split(':').map(Number);
        const startTime = new Date(year, month - 1, day, hour, minute);
        const endTime = new Date(startTime.getTime() + 50 * 60000);

        const occupiedIds = await getOccupiedRoomIdsByTime(startTime, endTime);
        setOccupiedRoomIds(occupiedIds);
      }
    };
    checkRoomAvailability();
  }, [formData.data, formData.hora]);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientChange = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId);
    setFormData(prev => ({
        ...prev,
        patientId: patientId,
        convenio: selectedPatient?.convenio || ""
    }));
  };

  const handleSpecialtyChange = (specialtyName: string) => {
    const selectedSpecialty = specialties.find(s => s.name === specialtyName);
    setFormData(prev => ({
        ...prev,
        tipo: specialtyName,
        valorConsulta: selectedSpecialty?.value || 0
    }));
  };

  const handleRoomChange = (roomId: string) => {
    if (occupiedRoomIds.includes(roomId)) {
      if (!window.confirm("Esta sala já está em uso neste horário. Deseja agendar mesmo assim?")) {
        return;
      }
    }
    handleInputChange("sala", roomId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let result;
    if (isRecurring) {
        result = await createAppointmentBlock(formData as AppointmentBlockFormData);
    } else {
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
            <Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2"><Label>Paciente *</Label><Select onValueChange={handlePatientChange}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Profissional *</Label><Select onValueChange={(v) => handleInputChange("professionalId", v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Convênio</Label><Input value={formData.convenio || ''} onChange={(e) => handleInputChange("convenio", e.target.value)} placeholder="Preenchido ao selecionar paciente"/></div>
            
            <div className="space-y-2"><Label>Data {isRecurring ? 'do 1º Atendimento' : ''} *</Label><Input type="date" onChange={(e) => handleInputChange("data", e.target.value)} required /></div>
            
            {/* --- INPUT DE HORA TROCADO POR SELECT --- */}
            <div className="space-y-2"><Label>Horário *</Label>
                <Select onValueChange={(v) => handleInputChange("hora", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                        {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            
            {isRecurring && (
              <div className="space-y-2">
                <Label>Nº de Sessões *</Label>
                <Input type="number" value={formData.sessions} onChange={(e) => handleInputChange("sessions", Number(e.target.value))} required min={1} />
              </div>
            )}

            <div className="space-y-2"><Label>Especialidade (Tipo) *</Label><Select onValueChange={handleSpecialtyChange}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{specialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Valor da Consulta (R$)</Label><div className="relative"><DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={formData.valorConsulta?.toFixed(2).replace('.', ',') || '0,00'} readOnly className="pl-8" /></div></div>
            <div className="space-y-2"><Label>Sala</Label><Select onValueChange={handleRoomChange} value={formData.sala}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id} className={occupiedRoomIds.includes(r.id) ? 'text-red-500 font-semibold' : ''}>{r.name} {occupiedRoomIds.includes(r.id) ? '(Ocupada)' : ''}</SelectItem>)}</SelectContent></Select></div>
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