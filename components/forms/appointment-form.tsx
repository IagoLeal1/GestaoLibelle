"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, AlertCircle, Repeat, DollarSign } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

import { createAppointment, createAppointmentBlock, getOccupiedRoomIdsByTime, AppointmentFormData, AppointmentBlockFormData } from "@/services/appointmentService";
import { getPatients, Patient } from "@/services/patientService";
import { getProfessionals, Professional } from "@/services/professionalService";
import { getSpecialties, Specialty } from "@/services/specialtyService";
import { getRooms, Room } from "@/services/roomService";

export function AppointmentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);
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
      if (formData.data && formData.horaInicio && formData.horaFim) {
        const [year, month, day] = formData.data.split('-').map(Number);
        const [startHour, startMinute] = formData.horaInicio.split(':').map(Number);
        const [endHour, endMinute] = formData.horaFim.split(':').map(Number);
        
        const startTime = new Date(year, month - 1, day, startHour, startMinute);
        const endTime = new Date(year, month - 1, day, endHour, endMinute);

        if (endTime <= startTime) {
            setOccupiedRoomIds([]);
            return;
        }

        const occupiedIds = await getOccupiedRoomIdsByTime(startTime, endTime);
        setOccupiedRoomIds(occupiedIds);
      }
    };
    checkRoomAvailability();
  }, [formData.data, formData.horaInicio, formData.horaFim]);

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePatientChange = (patientId: string) => {
    const selectedPatient = patients.find(p => p.id === patientId);
    if (!selectedPatient) return;

    const patientConvenio = (selectedPatient.convenio || 'particular').toLowerCase();
    
    const filteredSpecialties = specialties.filter(spec => {
        const specNameLower = spec.name.toLowerCase();
        
        if (patientConvenio === 'particular') {
            return !['unimed', 'bradesco', 'amil', 'sulamerica'].some(conv => specNameLower.includes(conv));
        }
        
        return specNameLower.includes(patientConvenio);
    });

    setAvailableSpecialties(filteredSpecialties);

    setFormData(prev => ({
        ...prev,
        patientId: patientId,
        convenio: selectedPatient.convenio || "",
        tipo: '',
        valorConsulta: 0,
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
    
    if (!formData.patientId || !formData.professionalId || !formData.data || !formData.horaInicio || !formData.horaFim || !formData.tipo) {
        setError("Todos os campos marcados com * são obrigatórios.");
        setLoading(false);
        return;
    }

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
        setError(result.error || "Ocorreu um erro desconhecido.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Agendamento</CardTitle>
        <CardDescription>Preencha os detalhes abaixo para criar um novo agendamento.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>)}
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
            
            <div className="space-y-2 lg:col-span-3">
                <Label>Paciente *</Label>
                <Select onValueChange={handlePatientChange} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                    <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2 lg:col-span-3">
                <Label>Profissional *</Label>
                <Select onValueChange={(v) => handleInputChange("professionalId", v)} required>
                    <SelectTrigger><SelectValue placeholder="Selecione o profissional" /></SelectTrigger>
                    <SelectContent>{professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
                </Select>
            </div>

            <div className="space-y-2 lg:col-span-2">
                <Label>Especialidade *</Label>
                <Select onValueChange={handleSpecialtyChange} value={formData.tipo} disabled={!formData.patientId} required>
                    <SelectTrigger><SelectValue placeholder={!formData.patientId ? "Selecione um paciente" : "Selecione..."} /></SelectTrigger>
                    <SelectContent>{availableSpecialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
                <Label>Data *</Label>
                <Input type="date" onChange={(e) => handleInputChange("data", e.target.value)} required />
            </div>
            <div className="space-y-2 lg:col-span-1">
                <Label>Horário Inicial *</Label>
                <Input type="time" onChange={(e) => handleInputChange("horaInicio", e.target.value)} required />
            </div>
            <div className="space-y-2 lg:col-span-1">
                <Label>Horário Final *</Label>
                <Input type="time" onChange={(e) => handleInputChange("horaFim", e.target.value)} required />
            </div>

            <div className="space-y-2 lg:col-span-2">
                <Label>Sala</Label>
                <Select onValueChange={handleRoomChange} value={formData.sala}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id} className={occupiedRoomIds.includes(r.id) ? 'text-red-500 font-semibold' : ''}>{r.name} {occupiedRoomIds.includes(r.id) ? '(Ocupada)' : ''}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2 lg:col-span-2">
                <Label>Convênio</Label>
                <Input value={formData.convenio || ''} readOnly placeholder="Automático"/>
            </div>
            <div className="space-y-2 lg:col-span-2">
                <Label>Valor da Consulta (R$)</Label>
                <div className="relative"><DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={formData.valorConsulta?.toFixed(2).replace('.', ',') || '0,00'} readOnly className="pl-8" /></div>
            </div>

          </div>
          
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center space-x-2">
                <Switch id="recurring-switch" checked={isRecurring} onCheckedChange={setIsRecurring} />
                <Label htmlFor="recurring-switch" className="cursor-pointer">Repetir Semanalmente</Label>
            </div>
            {isRecurring && (
              <div className="space-y-2 pt-4 border-t mt-4">
                <Label>Número de Sessões *</Label>
                <Input type="number" value={formData.sessions} onChange={(e) => handleInputChange("sessions", Number(e.target.value))} required min={1} />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea placeholder="Adicione observações sobre o agendamento..." onChange={(e) => handleInputChange("observacoes", e.target.value)} />
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