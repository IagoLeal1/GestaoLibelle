// components/pages/grade-terapias-client-page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

// Icons
import { ChevronLeft, ChevronRight, ChevronsUpDown, Check, Calendar, Search, Palette, MapPin } from "lucide-react";

// Services and Types
import { Professional, getProfessionals } from "@/services/professionalService";
import { Specialty, getSpecialties } from "@/services/specialtyService";
import { Appointment, getAppointmentsBySpecialties } from "@/services/appointmentService";
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
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTherapyGroup, setSelectedTherapyGroup] = useState<string>("");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popoverOpen, setPopoverOpen] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            const [professionalsData, specialtiesData, roomsData] = await Promise.all([ 
                getProfessionals('ativo'), 
                getSpecialties(),
                getRooms() 
            ]);
            setProfessionals(professionalsData);
            setSpecialties(specialtiesData);
            setRooms(roomsData);
            setLoading(false);
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

    const fetchWeekAppointments = useCallback(async () => {
        if (!selectedTherapyGroup) {
            setAppointments([]);
            return;
        }
        setLoading(true);
        const matchingSpecialtyNames = specialties.filter(s => s.name.toLowerCase().startsWith(selectedTherapyGroup.toLowerCase())).map(s => s.name);
        if (matchingSpecialtyNames.length === 0) {
            setAppointments([]);
            setLoading(false);
            return;
        }
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        const allAppointments = await getAppointmentsBySpecialties(matchingSpecialtyNames, start, end);
        setAppointments(allAppointments);
        setLoading(false);
    }, [selectedTherapyGroup, currentDate, specialties]);

    useEffect(() => {
        fetchWeekAppointments();
    }, [fetchWeekAppointments]);

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
                    <div className="w-full md:w-1/3" />
                </CardContent>
            </Card>
            
            {visibleProfessionals.length > 0 && (
                <Card><CardHeader className="p-3"><CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4"/> Legenda de Profissionais</CardTitle></CardHeader><CardContent className="p-3 pt-0"><div className="flex flex-wrap gap-x-4 gap-y-2">{visibleProfessionals.map(prof => (<div key={prof.id} className="flex items-center gap-2"><div className="h-4 w-4 rounded-full" style={{ backgroundColor: professionalColors.get(prof.id) }} /><span className="text-sm font-medium">{prof.fullName}</span></div>))}</div></CardContent></Card>
            )}

            <div className="overflow-x-auto">
                {!selectedTherapyGroup && <p className="text-center text-muted-foreground p-8">Selecione uma terapia para ver a grade.</p>}
                {loading && selectedTherapyGroup && <Skeleton className="h-[calc(13*6rem)] w-full"/>}
                {!loading && selectedTherapyGroup && appointments.length === 0 && <p className="text-center text-muted-foreground p-8">Nenhum agendamento encontrado para esta terapia na semana selecionada.</p>}
                {!loading && appointments.length > 0 && (
                    <table className="w-full border-collapse">
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
                                                <td key={day.toISOString()} className="p-1 border align-top">
                                                    {/* NOVO: Usando .map() para renderizar cada agendamento encontrado */}
                                                    <div className="space-y-1">
                                                        {appointmentsInSlot.map(appointment => (
                                                            <div key={appointment.id} className="p-2 rounded shadow-sm text-xs bg-white border-l-4" style={{ borderColor: professionalColors.get(appointment.professionalId) || '#ccc' }}>
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
                )}
            </div>
        </div>
    );
}