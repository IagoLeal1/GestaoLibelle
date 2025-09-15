"use client"

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, User, Settings, CheckCircle, RefreshCw, Plus, Edit, Calendar, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Room, getRooms, RoomFormData, createRoom, updateRoom, deleteRoom } from "@/services/roomService";
import { getAppointmentsByDate, Appointment } from "@/services/appointmentService";
import { RoomModal } from "@/components/modals/room-modal";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { format, setHours, setMinutes, setSeconds, setMilliseconds, addMinutes, isWithinInterval, parseISO } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { formatSpecialtyName } from "@/lib/formatters";

// --- INTERFACES ATUALIZADAS ---
interface AppointmentDetails {
  patientName?: string;
  professionalName?: string;
  terapia?: string; // <-- 1. CAMPO ADICIONADO
}

interface TimeSlot {
  time: string;
  start: Date;
  end: Date;
  status: 'livre' | 'ocupada';
  isConflict: boolean;
  appointments: AppointmentDetails[];
}

interface ProcessedRoom extends Room {
  dynamicStatus: 'livre' | 'ocupada' | 'manutencao';
  schedule: TimeSlot[];
}

// --- FUNÇÕES DE AJUDA ---
const getStatusInfo = (status?: string) => {
    const defaultConfig = { label: "Inativa", color: "bg-gray-400", textColor: "text-white", icon: Settings, borderColor: "border-gray-400" };
    if (!status) return defaultConfig;
    const statusConfig = {
      ocupada: { label: "Ocupada", color: "bg-red-500", textColor: "text-white", icon: User, borderColor: "border-red-500" },
      livre: { label: "Livre", color: "bg-green-500", textColor: "text-white", icon: CheckCircle, borderColor: "border-green-500" },
      manutencao: { label: "Manutenção", color: "bg-purple-600", textColor: "text-white", icon: Settings, borderColor: "border-purple-600" },
    };
    return statusConfig[status as keyof typeof statusConfig] || defaultConfig;
};

const generateTimeSlots = (forDate: Date): Omit<TimeSlot, 'status' | 'isConflict' | 'appointments'>[] => {
  const specificStartTimes = [
    '07:20', '08:10', '09:00', '09:50', '10:40', '11:30', '12:20',
    '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'
  ];
  return specificStartTimes.map(timeStr => {
    const [hour, minute] = timeStr.split(':').map(Number);
    const startTime = setMilliseconds(setSeconds(setMinutes(setHours(forDate, hour), minute), 0), 0);
    const endTime = addMinutes(startTime, 50);
    return {
      time: format(startTime, 'HH:mm'),
      start: startTime,
      end: endTime,
    };
  });
};

// --- Componente Principal ---
export function RoomsClientPage() {
  const { firestoreUser } = useAuth();
  const [baseRooms, setBaseRooms] = useState<Room[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [processedRooms, setProcessedRooms] = useState<ProcessedRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalState, setEditModalState] = useState<{ isOpen: boolean; data?: Room | null }>({ isOpen: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [andarSelecionado, setAndarSelecionado] = useState("todos");
  const [tipoSelecionado, setTipoSelecionado] = useState("todos");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [roomsData, appointmentsData] = await Promise.all([
      getRooms(),
      getAppointmentsByDate(selectedDate)
    ]);
    setBaseRooms(roomsData);
    setAppointments(appointmentsData);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const dateForSlots = parseISO(`${selectedDate}T00:00:00`);
    const dayTimeSlots = generateTimeSlots(dateForSlots);
    
    const updatedRooms: ProcessedRoom[] = baseRooms.map(room => {
      const appointmentsForRoom = appointments.filter(a => a.sala === room.id && a.status !== 'cancelado');
      const now = new Date();
      const isToday = selectedDate === new Date().toISOString().split('T')[0];
      const isCurrentlyOccupied = isToday && appointmentsForRoom.some(a => isWithinInterval(now, { start: a.start.toDate(), end: a.end.toDate() }));
      
      const dynamicStatus = room.status !== 'ativa' ? 'manutencao' : isCurrentlyOccupied ? 'ocupada' : 'livre';

      const schedule: TimeSlot[] = dayTimeSlots.map(slot => {
        const occupyingAppointments = appointmentsForRoom.filter(app => 
          isWithinInterval(slot.start, { start: app.start.toDate(), end: app.end.toDate() }) ||
          isWithinInterval(app.start.toDate(), { start: slot.start, end: slot.end })
        );

        const uniquePatientIds = new Set(occupyingAppointments.map(app => app.patientId));
        const isConflict = uniquePatientIds.size > 1;

        return {
          ...slot,
          status: occupyingAppointments.length > 0 ? 'ocupada' : 'livre',
          isConflict: isConflict,
          // --- 2. DADOS DA TERAPIA SÃO ADICIONADOS AQUI ---
          appointments: occupyingAppointments.map(app => ({
            patientName: app.patientName,
            professionalName: app.professionalName,
            terapia: app.tipo // Adiciona a terapia aos detalhes
          }))
        };
      });

      return { ...room, dynamicStatus, schedule };
    });
    setProcessedRooms(updatedRooms);
  }, [baseRooms, appointments, selectedDate]);

  const handleFormSubmit = async (data: RoomFormData) => {
    setIsSubmitting(true);
    const isEditMode = !!editModalState.data?.id;
    const result = isEditMode
      ? await updateRoom(editModalState.data!.id, data)
      : await createRoom(data);

    if (result.success) {
      toast.success(`Sala ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
      setEditModalState({ isOpen: false, data: null });
      fetchData();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const salasFiltradas = useMemo(() => processedRooms.filter((sala) => {
    const filtroAndar = andarSelecionado === "todos" || sala.floor.toString() === andarSelecionado;
    const filtroTipo = tipoSelecionado === "todos" || sala.type === tipoSelecionado;
    return filtroAndar && filtroTipo;
  }), [processedRooms, andarSelecionado, tipoSelecionado]);

  const estatisticas = useMemo(() => ({
    total: processedRooms.length,
    ocupadas: processedRooms.filter((s) => s.dynamicStatus === "ocupada").length,
    livres: processedRooms.filter((s) => s.dynamicStatus === "livre").length,
    manutencao: processedRooms.filter((s) => s.dynamicStatus === "manutencao").length,
  }), [processedRooms]);

  const salasAgrupadas = useMemo(() => 
    salasFiltradas.reduce((acc, sala) => {
      const floor = sala.floor || 0;
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(sala);
      return acc;
    }, {} as Record<number, ProcessedRoom[]>),
  [salasFiltradas]);
  
  if (loading) return <p className="p-4 text-center">A carregar o mapeamento das salas...</p>;

  return (
    <>
      <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                  <h2 className="text-2xl font-bold tracking-tight">Mapeamento de Salas</h2>
                  <p className="text-muted-foreground">Visualize a ocupação das salas em tempo real</p>
              </div>
              <div className="flex w-full sm:w-auto gap-2">
                  <Button variant="outline" onClick={fetchData} className="w-full"><RefreshCw className="mr-2 h-4 w-4" /> Atualizar</Button>
                  <Button onClick={() => setEditModalState({ isOpen: true, data: null })} className="w-full"><Plus className="mr-2 h-4 w-4" /> Gerir Salas</Button>
              </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total de Salas</p><p className="text-2xl font-bold">{estatisticas.total}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Ocupadas (Agora)</p><p className="text-2xl font-bold">{estatisticas.ocupadas}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Livres (Agora)</p><p className="text-2xl font-bold">{estatisticas.livres}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Em Manutenção</p><p className="text-2xl font-bold">{estatisticas.manutencao}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Filtros</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date-filter" className="flex items-center gap-2"><Calendar className="h-4 w-4"/>Data de Visualização</Label>
                  <Input id="date-filter" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Andar</Label>
                  <Select value={andarSelecionado} onValueChange={setAndarSelecionado}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por andar..."/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os andares</SelectItem>
                      {[...new Set(baseRooms.map(r => r.floor))].sort().map(floor => <SelectItem key={floor} value={String(floor)}>{floor}º Andar</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Sala</Label>
                  <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                    <SelectTrigger><SelectValue placeholder="Filtrar por tipo..."/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os tipos</SelectItem>
                      {[...new Set(baseRooms.map(r => r.type))].sort().map(type => <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            {Object.keys(salasAgrupadas).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma sala encontrada com os filtros selecionados.</p>
            ) : Object.entries(salasAgrupadas).sort(([a], [b]) => Number(a) - Number(b)).map(([floor, roomsInFloor]) => (
              <div key={floor}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5" /> {floor}º Andar</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {roomsInFloor.map((sala) => {
                    const statusInfo = getStatusInfo(sala.dynamicStatus);
                    return (
                      <Dialog key={sala.id}>
                        <DialogTrigger asChild>
                          <Card className="cursor-pointer hover:shadow-lg transition-shadow border hover:border-primary">
                            <CardHeader className="flex-row items-center justify-between p-4 space-y-0">
                              <CardTitle className="text-base font-semibold">Sala {sala.number}</CardTitle>
                              <Badge className={`${statusInfo.color} ${statusInfo.textColor}`}>{statusInfo.label}</Badge>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <p className="text-sm font-medium text-muted-foreground mb-4">{sala.name}</p>
                                <div className="space-y-1">
                                    <Label className="text-xs">Agenda do Dia</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {sala.schedule.slice(0, 6).map(slot => (
                                            <Badge key={slot.time} variant="outline" className={`font-semibold ${slot.isConflict ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : slot.status === 'ocupada' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                {slot.time}
                                            </Badge>
                                        ))}
                                        {sala.schedule.length > 6 && <Badge variant="secondary">...</Badge>}
                                    </div>
                                </div>
                            </CardContent>
                          </Card>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Sala {sala.number} - {sala.name}</DialogTitle>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="flex justify-between items-center">
                                <div className="space-y-1">
                                    <Label>Status (Agora)</Label>
                                    <div><Badge className={`${statusInfo.color} ${statusInfo.textColor}`}>{statusInfo.label}</Badge></div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setEditModalState({ isOpen: true, data: sala })}>
                                    <Edit className="h-3 w-3 mr-2" /> Editar Sala
                                </Button>
                            </div>
                            <div>
                                <Label>Agenda para {format(parseISO(`${selectedDate}T00:00:00`), 'dd/MM/yyyy')}</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-72 overflow-y-auto pr-2">
                                    {sala.schedule.map(slot => (
                                        <div key={slot.time} className={`p-2 rounded-md ${slot.isConflict ? 'bg-yellow-100 border border-yellow-400' : slot.status === 'ocupada' ? 'bg-red-50' : 'bg-green-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <p className={`font-semibold text-sm ${slot.isConflict ? 'text-yellow-800' : slot.status === 'ocupada' ? 'text-red-800' : 'text-green-800'}`}>
                                                    {slot.time}
                                                </p>
                                                {slot.isConflict && <AlertTriangle className="h-4 w-4 text-yellow-600"/>}
                                            </div>
                                            {slot.appointments.length > 0 ? slot.appointments.map((app, index) => (
                                                <div key={index} className="mt-1 border-t pt-1 space-y-1">
                                                    {/* --- 3. EXIBIÇÃO DA TERAPIA, PACIENTE E PROFISSIONAL --- */}
                                                    <p className="text-xs truncate font-bold text-gray-900">{formatSpecialtyName(app.terapia || '')}</p>
                                                    <p className="text-xs truncate font-medium text-gray-800">{app.patientName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{app.professionalName}</p>
                                                </div>
                                            )) : (
                                                <p className="text-xs text-green-700">Livre</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
      </div>
      
      <RoomModal 
          isOpen={editModalState.isOpen}
          onClose={() => setEditModalState({ isOpen: false, data: null })}
          onSubmit={handleFormSubmit}
          room={editModalState.data}
          isLoading={isSubmitting}
      />
    </>
  )
}