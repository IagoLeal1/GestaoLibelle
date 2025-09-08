// components/modals/edit-appointment-modal.tsx
"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Appointment, AppointmentFormData, AppointmentStatus, deleteAppointment, deleteFutureAppointmentsInBlock } from "@/services/appointmentService";
import { Patient } from "@/services/patientService";
import { Professional } from "@/services/professionalService";
import { getSpecialties, Specialty } from "@/services/specialtyService";
import { getRooms, Room } from "@/services/roomService";
import { getOccupiedRoomIdsByTime } from "@/services/appointmentService";
import { format } from "date-fns";
import { DollarSign } from "lucide-react";
import { toast } from "sonner";

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: Partial<AppointmentFormData & { status: AppointmentStatus }>) => void;
  onDelete: (isBlockDeletion: boolean) => void;
  appointment: Appointment | null;
  patients: Patient[];
  professionals: Professional[];
}

const secondaryStatusOptions = [
    { value: "confirmado", label: "Confirmado" },
    { value: "pendente_confirmacao", label: "Pendente" },
    { value: "pago", label: "Pago" },
    { value: "sem_justificativa", label: "S/ Justificativa" },
    { value: "reagendado", label: "Reagendado" },
    { value: "em_sala", label: "Em Sala" },
    { value: "fnj_paciente", label: "FNJ Paciente" },
    { value: "f_terapeuta", label: "F Terapeuta" },
    { value: "fj_paciente", label: "FJ Paciente" },
    { value: "f_dupla", label: "F Dupla" },
    { value: "suspenso_plano", label: "Suspenso pelo Plano" },
    { value: "nenhum", label: "Nenhum" },
];

export function EditAppointmentModal({ isOpen, onClose, onSave, onDelete, appointment, patients, professionals }: EditAppointmentModalProps) {
  const [formData, setFormData] = useState<Partial<AppointmentFormData & { status: AppointmentStatus }>>({});
  
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [occupiedRoomIds, setOccupiedRoomIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Efeito para carregar dados essenciais (especialidades e salas) quando o modal abre
  useEffect(() => {
    if (isOpen) {
        setIsLoadingData(true);
        const fetchDropdownData = async () => {
            const [specialtiesData, roomsData] = await Promise.all([
                getSpecialties(),
                getRooms()
            ]);
            setSpecialties(specialtiesData);
            setRooms(roomsData.filter(r => r.status === 'ativa'));
            setIsLoadingData(false);
        };
        fetchDropdownData();
    }
  }, [isOpen]);

  // Efeito para popular o formulário APÓS os dados essenciais serem carregados
  useEffect(() => {
    if (isOpen && !isLoadingData && appointment) {
      const startDate = appointment.start.toDate();
      const endDate = appointment.end.toDate();

      setFormData({
        patientId: appointment.patientId,
        professionalId: appointment.professionalId,
        data: format(startDate, 'yyyy-MM-dd'),
        horaInicio: format(startDate, 'HH:mm'),
        horaFim: format(endDate, 'HH:mm'),
        tipo: appointment.tipo,
        sala: appointment.sala,
        convenio: appointment.convenio,
        valorConsulta: appointment.valorConsulta,
        observacoes: appointment.observacoes,
        status: appointment.status,
        statusSecundario: appointment.statusSecundario,
      });

      // Filtra as especialidades com base no paciente selecionado
      const selectedPatient = patients.find(p => p.id === appointment.patientId);
      const patientConvenio = (selectedPatient?.convenio || 'particular').toLowerCase();
      
      const filtered = specialties.filter(spec => {
          const specNameLower = spec.name.toLowerCase();
          if (patientConvenio === 'particular') {
              return !['unimed', 'bradesco', 'amil', 'sulamerica'].some(conv => specNameLower.includes(conv));
          }
          return specNameLower.includes(patientConvenio);
      });
      setAvailableSpecialties(filtered);
    }
  }, [isOpen, isLoadingData, appointment, patients, specialties]);
  
  // Efeito para verificar a disponibilidade da sala
  useEffect(() => {
    const checkRoomAvailability = async () => {
      if (formData.data && formData.horaInicio && formData.horaFim) {
        const [year, month, day] = formData.data.split('-').map(Number);
        const [startHour, startMinute] = formData.horaInicio.split(':').map(Number);
        const [endHour, endMinute] = formData.horaFim.split(':').map(Number);
        
        const startTime = new Date(year, month - 1, day, startHour, startMinute);
        const endTime = new Date(year, month - 1, day, endHour, endMinute);

        if (endTime <= startTime) return;

        const occupiedIds = await getOccupiedRoomIdsByTime(startTime, endTime);
        // Exclui a sala do próprio agendamento da lista de ocupadas
        setOccupiedRoomIds(occupiedIds.filter(id => id !== appointment?.sala));
      }
    };
    checkRoomAvailability();
  }, [formData.data, formData.horaInicio, formData.horaFim, appointment]);

  const handleInputChange = (field: keyof typeof formData, value: string | number | undefined) => {
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
    setFormData(prev => ({ ...prev, patientId, convenio: selectedPatient.convenio || "", tipo: '', valorConsulta: 0 }));
  };

  const handleSpecialtyChange = (specialtyName: string) => {
    const selectedSpecialty = specialties.find(s => s.name === specialtyName);
    setFormData(prev => ({ ...prev, tipo: specialtyName, valorConsulta: selectedSpecialty?.value || 0 }));
  };

  const handleRoomChange = (roomId: string) => {
    if (occupiedRoomIds.includes(roomId)) {
      if (!window.confirm("Esta sala já está em uso neste horário. Deseja agendar mesmo assim?")) return;
    }
    handleInputChange("sala", roomId);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };
  
  const handleDelete = async () => {
    if (!appointment) return;
    setIsSubmitting(true);

    if (appointment.blockId) {
      const userChoice = confirm(
        `Este agendamento faz parte de uma sequência.\n\nClique em 'OK' para apagar este e todos os futuros agendamentos da sequência.\n\nClique em 'Cancelar' para apagar APENAS o agendamento de ${format(appointment.start.toDate(), 'dd/MM/yyyy')}.`
      );

      if (userChoice) {
        await deleteFutureAppointmentsInBlock(appointment);
        onDelete(true); 
      } else {
        const singleDeleteChoice = confirm("Confirmar a exclusão APENAS deste agendamento?");
        if (singleDeleteChoice) {
            await deleteAppointment(appointment.id);
            onDelete(false);
        }
      }
    } else {
      if (window.confirm("Tem certeza que deseja excluir este agendamento?")) {
        await deleteAppointment(appointment.id);
        onDelete(false);
      }
    }
    setIsSubmitting(false);
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>{appointment.patientName} com {appointment.professionalName}</DialogDescription>
        </DialogHeader>
        {isLoadingData ? (<div className="py-4">Carregando dados...</div>) : (
        <div className="grid gap-6 py-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Paciente</Label><Select value={formData.patientId} onValueChange={handlePatientChange}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{patients.map(p=><SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Profissional</Label><Select value={formData.professionalId} onValueChange={(v) => handleInputChange("professionalId", v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{professionals.map(p=><SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent></Select></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2"><Label>Especialidade</Label><Select value={formData.tipo} onValueChange={handleSpecialtyChange} disabled={!formData.patientId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{availableSpecialties.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.data || ''} onChange={(e) => handleInputChange("data", e.target.value)} /></div>
                <div className="space-y-2"><Label>Horário Inicial</Label><Input type="time" value={formData.horaInicio || ''} onChange={(e) => handleInputChange("horaInicio", e.target.value)} /></div>
                <div className="space-y-2"><Label>Horário Final</Label><Input type="time" value={formData.horaFim || ''} onChange={(e) => handleInputChange("horaFim", e.target.value)} /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Label>Sala</Label><Select value={formData.sala} onValueChange={handleRoomChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{rooms.map(r => <SelectItem key={r.id} value={r.id} className={occupiedRoomIds.includes(r.id) ? 'text-red-500 font-semibold' : ''}>{r.name} {occupiedRoomIds.includes(r.id) ? '(Ocupada)' : ''}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Convênio</Label><Input value={formData.convenio || ''} readOnly /></div>
                <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <div className="relative">
                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="number"
                            step="0.01"
                            value={formData.valorConsulta || ''} 
                            onChange={(e) => handleInputChange("valorConsulta", parseFloat(e.target.value) || 0)} 
                            className="pl-8" 
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>Status Principal</Label>
                  <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v as AppointmentStatus)}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="agendado">Agendado</SelectItem>
                          <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                          <SelectItem value="finalizado">Finalizado</SelectItem>
                          <SelectItem value="nao_compareceu">Não compareceu</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
              <div className="space-y-2">
                  <Label>Status Secundário</Label>
                  <Select value={formData.statusSecundario || 'nenhum'} onValueChange={(v) => handleInputChange("statusSecundario", v)}>
                      <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      <SelectContent>
                          {secondaryStatusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
            </div>

            <div className="space-y-2"><Label>Observações</Label><Textarea value={formData.observacoes || ''} onChange={(e) => handleInputChange("observacoes", e.target.value)} /></div>
        </div>
        )}
        <DialogFooter className="justify-between sm:justify-between">
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Excluir Agendamento</Button>
            <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>Cancelar</Button>
                <Button onClick={handleSave} disabled={isSubmitting || isLoadingData}>
                    {isSubmitting ? "Salvando..." : "Salvar Alterações"}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}