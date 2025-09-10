"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
    startOfWeek, endOfWeek, addDays, eachDayOfInterval, format, 
    addWeeks, subWeeks, setHours, setMinutes, setSeconds, setMilliseconds 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// Components
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickAppointmentModal } from "@/components/modals/quick-appointment-modal";
import { EditAppointmentModal } from "@/components/modals/edit-appointment-modal";

// Icons
import { ChevronLeft, ChevronRight, User, Calendar, Save } from "lucide-react";

// Services and Types
import { Patient, getPatients } from "@/services/patientService";
import { Professional, getProfessionals } from "@/services/professionalService";
import { Specialty, getSpecialties } from "@/services/specialtyService";
import { Room, getRooms } from "@/services/roomService";
import { 
    Appointment, getAppointmentsForReport, createMultipleAppointments, 
    QuickAppointmentData, updateAppointment, deleteAppointment, AppointmentFormData, AppointmentStatus
} from "@/services/appointmentService";
import { Badge } from "@/components/ui/badge";

// Horários fixos da clínica
const HORARIOS_CLINICA = [
    '07:20', '08:10', '09:00', '09:50', '10:40', '11:30', '12:20',
    '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'
];

export function GradeAgendamentosClientPage() {
    // Estados de dados
    const [patients, setPatients] = useState<Patient[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    
    // Estados de controle da UI
    const [loading, setLoading] = useState(true);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const [pendingAppointments, setPendingAppointments] = useState<Map<string, QuickAppointmentData[]>>(new Map());

    // Estados dos modais
    const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    const getRoomNameById = (roomId?: string): string => {
        if (!roomId) return "N/A";
        const room = rooms.find(r => r.id === roomId);
        return room ? room.name : "Sala Excluída";
    };

    // Busca inicial de dados
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const [patientsData, professionalsData, specialtiesData, roomsData] = await Promise.all([
                getPatients(), getProfessionals(), getSpecialties(), getRooms(),
            ]);
            setPatients(patientsData);
            setProfessionals(professionalsData);
            setSpecialties(specialtiesData);
            setRooms(roomsData);
            setLoading(false);
        };
        fetchInitialData();
    }, []);

    // Busca agendamentos da semana
    const fetchWeekAppointments = useCallback(async () => {
        if (!selectedPatientId) {
            setAppointments([]);
            return;
        };
        setLoading(true);
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        const data = await getAppointmentsForReport({ patientId: selectedPatientId, startDate: start, endDate: end });
        setAppointments(data);
        setLoading(false);
    }, [selectedPatientId, currentDate]);

    useEffect(() => {
        fetchWeekAppointments();
    }, [fetchWeekAppointments]);

    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    });

    const selectedPatient = useMemo(() => {
        return patients.find(p => p.id === selectedPatientId) || null;
    }, [selectedPatientId, patients]);

    // Funções para abrir os modais
    const handleOpenQuickModal = (date: Date, time: string) => {
        if (!selectedPatientId) {
            toast.error("Por favor, selecione um paciente primeiro.");
            return;
        }
        setSelectedSlot({ date, time });
        setIsQuickModalOpen(true);
    };

    const handleOpenEditModal = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setIsEditModalOpen(true);
    };

    const handleSaveQuickAppointment = (data: QuickAppointmentData) => {
        const key = `${format(data.start, 'yyyy-MM-dd-HH-mm')}`;
        setPendingAppointments(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(key) || [];
            newMap.set(key, [...existing, data]);
            return newMap;
        });
        setIsQuickModalOpen(false);
    };
    
    const handleSaveAllAppointments = async () => {
        const allPending = Array.from(pendingAppointments.values()).flat();
        if (!selectedPatientId || allPending.length === 0) {
            toast.info("Nenhum novo agendamento para salvar.");
            return;
        }
        setLoading(true);
        const result = await createMultipleAppointments(selectedPatientId, allPending);
        if (result.success) {
            toast.success("Agenda da semana salva com sucesso!");
            setPendingAppointments(new Map());
            fetchWeekAppointments();
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    };

    const handleUpdateAppointment = async (formData: Partial<AppointmentFormData & { status: AppointmentStatus }>) => {
        if (!selectedAppointment) return;
        const result = await updateAppointment(selectedAppointment.id, formData);
        if (result.success) {
            toast.success("Agendamento atualizado com sucesso!");
            setIsEditModalOpen(false);
            fetchWeekAppointments();
        } else {
            toast.error(result.error || "Falha ao atualizar.");
        }
    };
  
    const handleDeleteAppointment = () => {
        toast.success("Operação de exclusão concluída.");
        setIsEditModalOpen(false);
        fetchWeekAppointments();
    };

    const totalPending = Array.from(pendingAppointments.values()).flat().length;
    const weekLabel = `${format(weekDays[0], 'd MMM', { locale: ptBR })} - ${format(weekDays[6], 'd MMM yyyy', { locale: ptBR })}`;

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="w-full md:w-1/3 space-y-2">
                        <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Selecione o Paciente</Label>
                        <Select onValueChange={(id) => { setSelectedPatientId(id); setPendingAppointments(new Map()); }} value={selectedPatientId || ""}>
                            <SelectTrigger disabled={loading}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{patients.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                        <div className="text-center font-semibold w-48"><Calendar className="inline h-4 w-4 mr-2"/>{weekLabel}</div>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
                    </div>

                    <div className="w-full md:w-1/3 flex justify-end">
                        <Button onClick={handleSaveAllAppointments} disabled={loading || totalPending === 0}>
                            <Save className="mr-2 h-4 w-4" /> Salvar Agenda ({totalPending})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="overflow-x-auto">
                {loading && !selectedPatientId ? <p className="text-center text-muted-foreground p-8">Selecione um paciente para ver a grade.</p> : null}
                {loading && selectedPatientId ? <Skeleton className="h-96 w-full"/> : (
                    selectedPatientId &&
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-muted">
                                <th className="p-2 border w-32">Horário</th>
                                {weekDays.map(day => (
                                    <th key={day.toISOString()} className="p-2 border text-center capitalize">
                                        {format(day, 'EEEE', { locale: ptBR })} <br/>
                                        <span className="font-normal text-sm">{format(day, 'dd/MM')}</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {HORARIOS_CLINICA.map(time => (
                                <tr key={time}>
                                    <td className="p-2 border font-semibold text-center bg-muted">{time}</td>
                                    {weekDays.map(day => {
                                        const slotDate = new Date(`${format(day, 'yyyy-MM-dd')}T${time}`);
                                        const slotKey = format(slotDate, 'yyyy-MM-dd-HH-mm');
                                        
                                        const existingAppointments = appointments.filter(a => format(a.start.toDate(), 'HH:mm') === time && format(a.start.toDate(), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
                                        const pendingAppointmentsInSlot = pendingAppointments.get(slotKey) || [];

                                        const allAppointmentsInSlot = [...existingAppointments, ...pendingAppointmentsInSlot];

                                        return (
                                            <td key={day.toISOString()} className="p-1 border align-top hover:bg-green-50 transition-colors cursor-pointer" onClick={() => handleOpenQuickModal(day, time)}>
                                                <div className="space-y-1">
                                                {allAppointmentsInSlot.map((app, index) => {
                                                    const isExisting = 'id' in app;
                                                    const professional = professionals.find(p => p.id === (isExisting ? (app as Appointment).professionalId : (app as QuickAppointmentData).professionalId));
                                                    
                                                    return (
                                                        <div 
                                                          key={isExisting ? (app as Appointment).id : `${slotKey}-${index}`} 
                                                          className={`p-2 rounded shadow-sm text-xs ${isExisting ? 'bg-white' : 'bg-yellow-100 border-l-4 border-yellow-500'}`}
                                                          onClick={(e) => {
                                                              if(isExisting) {
                                                                  e.stopPropagation();
                                                                  handleOpenEditModal(app as Appointment);
                                                              }
                                                          }}
                                                        >
                                                            {/* --- ALTERAÇÃO APLICADA AQUI --- */}
                                                            <p className="font-bold">{isExisting ? (app as Appointment).tipo : (app as QuickAppointmentData).specialty}</p>
                                                            <p className="text-muted-foreground">{professional?.fullName}</p>
                                                            {/* --- FIM DA ALTERAÇÃO --- */}

                                                            <p className="text-blue-600">Sala: {getRoomNameById(isExisting ? (app as Appointment).sala : (app as QuickAppointmentData).roomId)}</p>
                                                            {!isExisting && (app as QuickAppointmentData).isRecurring && <Badge variant="secondary" className="mt-1">Repete {(app as QuickAppointmentData).sessions}x</Badge>}
                                                        </div>
                                                    );
                                                })}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <QuickAppointmentModal 
                isOpen={isQuickModalOpen}
                onClose={() => setIsQuickModalOpen(false)}
                onSave={handleSaveQuickAppointment}
                slotInfo={selectedSlot}
                patient={selectedPatient}
                professionals={professionals}
                specialties={specialties}
                rooms={rooms}
            />
            <EditAppointmentModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdateAppointment}
                onDelete={handleDeleteAppointment}
                appointment={selectedAppointment}
                patients={patients}
                professionals={professionals}
            />
        </div>
    );
}