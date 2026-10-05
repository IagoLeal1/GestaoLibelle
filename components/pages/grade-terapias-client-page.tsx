// components/pages/grade-terapias-client-page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, addWeeks, subWeeks, set } from "date-fns";
import { ptBR } from "date-fns/locale";

// Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickAppointmentModal } from "@/components/modals/quick-appointment-modal";
import { SemanaNoCelular } from "@/components/agenda/semana-no-celular";
import { statusDoAtendimento } from "@/lib/statusDoAtendimento";
import type { ItemDaSemana } from "@/lib/semanaNoCelular";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Icons
import { ChevronLeft, ChevronRight, ChevronsUpDown, Check, Calendar, Search, Palette, MapPin } from "lucide-react";

// Services and Types
import { Professional, getProfessionals } from "@/services/professionalService";
import { Specialty, getSpecialties } from "@/services/specialtyService";
import { Appointment, QuickAppointmentData, createAppointmentFromTherapyGrid, getAppointmentsBySpecialties } from "@/services/appointmentService";
import { Patient, getPatients } from "@/services/patientService";
import { Room, getRooms } from "@/services/roomService";
import { formatSpecialtyName } from "@/lib/formatters";

// Função para gerar uma cor pastel a partir de uma string (nome do profissional)
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 85%)`;
};

export function GradeTerapiasClientPage() {
    const { firestoreUser } = useAuth();
    const canCreate = ['admin', 'coordenador', 'funcionario'].includes(firestoreUser?.profile.role ?? '');
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingWeek, setLoadingWeek] = useState(false);
    const [weekError, setWeekError] = useState(false);
    const [selectedTherapyGroup, setSelectedTherapyGroup] = useState<string>("");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [patientsLoaded, setPatientsLoaded] = useState(false);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
    const [quickModalOpen, setQuickModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);
    const requestIdRef = useRef(0);
    const [refreshVersion, setRefreshVersion] = useState(0);

    useEffect(() => {
        const fetchInitialData = async () => {
            const [professionalsData, specialtiesData, roomsData] = await Promise.all([ 
                getProfessionals('ativo'), 
                getSpecialties(),
                getRooms() 
            ]);
            setProfessionals(professionalsData);
            setSpecialties(specialtiesData);
            setRooms(roomsData);
            setLoadingInitial(false);
        };
        fetchInitialData();
    }, []);

    const roomNameMap = useMemo(() => {
        const map = new Map<string, string>();
        rooms.forEach(room => {
            map.set(room.id, room.name);
        });
        return map;
    }, [rooms]);

    const therapyGroups = useMemo(() => {
        const groups = new Set<string>();
        specialties.forEach(s => {
            const nameParts = s.name.trim().split(' ').slice(0, 2);
            if (nameParts.length > 0) groups.add(nameParts.join(' '));
        });
        return Array.from(groups).sort();
    }, [specialties]);

    const matchingSpecialtyNames = useMemo(() => specialties
        .filter(s => s.name.toLowerCase().startsWith(selectedTherapyGroup.toLowerCase()))
        .map(s => s.name), [specialties, selectedTherapyGroup]);
    const selectedPatient = patients.find(patient => patient.id === selectedPatientId) ?? null;

    const fetchWeekAppointments = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        if (loadingInitial || !selectedTherapyGroup || matchingSpecialtyNames.length === 0) {
            setAppointments([]);
            setLoadingWeek(false);
            return;
        }
        setLoadingWeek(true);
        setWeekError(false);
        setAppointments([]);
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        try {
            const allAppointments = await getAppointmentsBySpecialties(matchingSpecialtyNames, start, end);
            if (requestId === requestIdRef.current) setAppointments(allAppointments);
        } catch (error) {
            console.error('Erro ao carregar grade por terapia:', error);
            if (requestId === requestIdRef.current) setWeekError(true);
        } finally {
            if (requestId === requestIdRef.current) setLoadingWeek(false);
        }
    }, [selectedTherapyGroup, currentDate, loadingInitial, matchingSpecialtyNames]);

    useEffect(() => {
        fetchWeekAppointments();
        return () => { requestIdRef.current++; };
    }, [fetchWeekAppointments, refreshVersion]);

    const loadPatients = async () => {
        if (patientsLoaded || loadingPatients) return;
        setLoadingPatients(true);
        try {
            setPatients(await getPatients('ativo'));
            setPatientsLoaded(true);
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
            toast.error('Não foi possível carregar os pacientes.');
        } finally {
            setLoadingPatients(false);
        }
    };

    const openSlot = (date: Date, time: string) => {
        if (!canCreate || loadingWeek || weekError) return;
        setSelectedSlot({ date, time });
        setSelectedPatientId('');
        setQuickModalOpen(true);
        void loadPatients();
    };

    const saveAppointment = async (data: QuickAppointmentData) => {
        if (savingRef.current || !selectedPatient || !matchingSpecialtyNames.includes(data.specialty)) return;
        savingRef.current = true;
        setSaving(true);
        try {
            const result = await createAppointmentFromTherapyGrid(selectedPatient.id, data, matchingSpecialtyNames);
            if (!result.success) {
                toast.error(result.error || 'Não foi possível salvar o agendamento.');
                return;
            }
            toast.success(data.isRecurring ? 'Sessões agendadas com sucesso.' : 'Agendamento salvo com sucesso.');
            setQuickModalOpen(false);
            setSelectedSlot(null);
            setRefreshVersion(version => version + 1);
        } catch (error) {
            console.error('Erro inesperado ao salvar agendamento:', error);
            toast.error('Não foi possível salvar o agendamento.');
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const weekDays = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
    });

    const weekLabel = `${format(weekDays[0], 'd MMM', { locale: ptBR })} - ${format(weekDays[6], 'd MMM yyyy', { locale: ptBR })}`;

    const timeSlots = [
        '07:20', '08:10', '09:00', '09:50', '10:40', '11:30', '12:20',
        '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'
    ];

    const professionalColors = useMemo(() => {
        const colorMap = new Map<string, string>();
        professionals.forEach(p => colorMap.set(p.id, stringToColor(p.fullName)));
        return colorMap;
    }, [professionals]);

    // No celular, um dia por vez (components/agenda/semana-no-celular)
    const sessoesDoDia = (dia: Date): ItemDaSemana[] =>
        appointments
            .filter(app => format(app.start.toDate(), 'yyyy-MM-dd') === format(dia, 'yyyy-MM-dd'))
            .map(app => ({
                id: app.id,
                hora: format(app.start.toDate(), 'HH:mm'),
                fim: format(app.end.toDate(), 'HH:mm'),
                titulo: app.patientName,
                detalhe: [app.professionalName, app.sala ? roomNameMap.get(app.sala) : undefined].filter(Boolean).join(' · '),
                status: statusDoAtendimento(app.status),
                marca: app.status === 'cancelado' ? 'cancelada' : undefined,
            }));

    const visibleProfessionals = useMemo(() => {
        if (!selectedTherapyGroup) return [];
        const visibleIds = new Set(appointments.map(a => a.professionalId));
        return professionals.filter(p => visibleIds.has(p.id));
    }, [appointments, professionals, selectedTherapyGroup]);

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="w-full md:w-1/3 space-y-2">
                        <Label className="flex items-center gap-2"><Search className="h-4 w-4" /> Buscar Terapia</Label>
                        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                            <PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between">{selectedTherapyGroup || "Selecione..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command><CommandInput placeholder="Buscar..." /><CommandEmpty>Nenhum resultado.</CommandEmpty><CommandGroup><ScrollArea className="h-72">{therapyGroups.map((group) => (<CommandItem key={group} value={group} onSelect={(value) => { setSelectedTherapyGroup(value === selectedTherapyGroup ? "" : value); setPopoverOpen(false); }}><Check className={`mr-2 h-4 w-4 ${selectedTherapyGroup.toLowerCase() === group.toLowerCase() ? "opacity-100" : "opacity-0"}`}/>{group}</CommandItem>))}</ScrollArea></CommandGroup></Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                        <div className="text-center font-semibold w-48"><Calendar className="inline h-4 w-4 mr-2"/>{weekLabel}</div>
                        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                    <div className="hidden w-1/3 md:block" />
                </CardContent>
            </Card>
            
            {visibleProfessionals.length > 0 && (
                <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4"/> Legenda de Profissionais</CardTitle></CardHeader><CardContent className="p-3 pt-0"><div className="flex flex-wrap gap-x-4 gap-y-2">{visibleProfessionals.map(prof => (<div key={prof.id} className="flex items-center gap-2"><div className="h-4 w-4 rounded-full" style={{ backgroundColor: professionalColors.get(prof.id) }} /><span className="text-sm font-medium">{prof.fullName}</span></div>))}</div></CardContent></Card>
            )}

            <div className="overflow-x-auto">
                {!selectedTherapyGroup && <p className="text-center text-muted-foreground p-8">Selecione uma terapia para ver a grade.</p>}
                {canCreate && selectedTherapyGroup && !loadingInitial && !loadingWeek && !weekError && <p className="hidden pb-2 text-xs text-muted-foreground md:block">Clique ou toque em um espaço da grade para agendar.</p>}
                {(loadingInitial || loadingWeek) && selectedTherapyGroup && <Skeleton className="h-[calc(13*6rem)] w-full"/>}
                {!loadingInitial && !loadingWeek && weekError && selectedTherapyGroup && <p role="alert" className="text-center text-destructive p-8">Não foi possível carregar a grade. Tente mudar de semana e voltar.</p>}
                {!loadingInitial && !loadingWeek && !weekError && selectedTherapyGroup && appointments.length === 0 && <p className="text-center text-muted-foreground p-4">Nenhum agendamento nesta semana.{canCreate ? ' Você pode adicionar um pelo horário desejado.' : ''}</p>}
                {!loadingInitial && !loadingWeek && !weekError && selectedTherapyGroup && (<>
                    <SemanaNoCelular
                        className="md:hidden"
                        dias={weekDays}
                        horarios={timeSlots}
                        itensDoDia={sessoesDoDia}
                        aoAgendar={canCreate ? (dia, hora) => openSlot(dia, hora) : undefined}
                    />
                    <table className="hidden w-full min-w-[900px] border-collapse md:table">
                        <thead><tr className="bg-muted"><th className="p-2 border w-24">Horário</th>{weekDays.map(day => (<th key={day.toISOString()} className="p-2 border text-center capitalize">{format(day, 'EEEE', { locale: ptBR })} <br/><span className="font-normal text-sm">{format(day, 'dd/MM')}</span></th>))}</tr></thead>
                        <tbody>
                            {timeSlots.map(time => {
                                const [hours, minutes] = time.split(':').map(Number);
                                return (
                                    <tr key={time} className="h-24">
                                        <td className="p-2 border text-sm text-center bg-muted align-middle">{time}</td>
                                        {weekDays.map(day => {
                                            const slotTime = set(day, { hours, minutes });
                                            
                                            // CORREÇÃO: Usando .filter() para encontrar TODOS os agendamentos no slot
                                            const appointmentsInSlot = appointments.filter(app => 
                                                format(app.start.toDate(), 'HH:mm') === time && 
                                                format(app.start.toDate(), 'yyyy-MM-dd') === format(slotTime, 'yyyy-MM-dd')
                                            );
                                            
                                            return (
                                                <td key={day.toISOString()} className={`p-1 border align-top ${canCreate ? 'cursor-pointer transition-colors hover:bg-green-50' : ''}`} onClick={canCreate ? () => openSlot(day, time) : undefined}>
                                                    <div className="min-h-20 space-y-1">
                                                        {appointmentsInSlot.map(appointment => (
                                                            <div key={appointment.id} className="p-2 rounded shadow-sm text-xs bg-white border-l-4" style={{ borderColor: professionalColors.get(appointment.professionalId) || '#ccc' }} onClick={event => event.stopPropagation()}>
                                                                <p className="font-bold">{appointment.patientName}</p>
                                                                <p className="text-sm">{appointment.professionalName}</p>
                                                                <p className="text-muted-foreground">{format(appointment.start.toDate(), 'HH:mm')} - {format(appointment.end.toDate(), 'HH:mm')}</p>
                                                                <p className="text-blue-600 font-semibold">{formatSpecialtyName(appointment.tipo)}</p>
                                                                {appointment.sala && (
                                                                    <p className="text-muted-foreground flex items-center gap-1 pt-1">
                                                                        <MapPin className="h-3 w-3" />
                                                                        {roomNameMap.get(appointment.sala) || appointment.sala}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>)}
            </div>
            {canCreate && (
                    <QuickAppointmentModal
                        isOpen={quickModalOpen}
                        onClose={() => { if (!savingRef.current) setQuickModalOpen(false); }}
                        onSave={saveAppointment}
                        slotInfo={selectedSlot}
                        patient={selectedPatient}
                        patientOptions={patients}
                        onPatientChange={setSelectedPatientId}
                        loadingPatients={loadingPatients}
                        professionals={professionals}
                        specialties={specialties}
                        rooms={rooms}
                        allowedSpecialtyNames={matchingSpecialtyNames}
                        restrictProfessionalsToSpecialty
                        saveLabel="Salvar agendamento"
                        saving={saving}
                        maxSessions={24}
                    />
            )}
        </div>
    );
}
