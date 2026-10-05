"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addWeeks, eachDayOfInterval, endOfWeek, format, startOfWeek, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Appointment, QuickAppointmentData, createAppointmentFromTherapyGrid, getAppointmentsByProfessionalInRange } from "@/services/appointmentService";
import { Professional, getProfessionals } from "@/services/professionalService";
import { Patient, getPatients } from "@/services/patientService";
import { Specialty, getSpecialties } from "@/services/specialtyService";
import { Room, getRooms } from "@/services/roomService";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { formatSpecialtyName } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { QuickAppointmentModal } from "@/components/modals/quick-appointment-modal";

const CLINIC_TIMES = [
  "07:20", "08:10", "09:00", "09:50", "10:40", "11:30", "12:20",
  "13:20", "14:10", "15:00", "15:50", "16:40", "17:30",
];

const STATUS_LABELS: Record<Appointment["status"], string> = {
  agendado: "Agendado",
  finalizado: "Finalizado",
  nao_compareceu: "Não compareceu",
  cancelado: "Cancelado",
  em_atendimento: "Em atendimento",
};

type Props = { initialProfessionalId: string };

export function GradeTerapeutaClientPage({ initialProfessionalId }: Props) {
  const { firestoreUser } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(initialProfessionalId);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingProfessionals, setLoadingProfessionals] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadedWeekKey, setLoadedWeekKey] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookingDataLoaded, setBookingDataLoaded] = useState(false);
  const [bookingDataLoading, setBookingDataLoading] = useState(false);
  const bookingLoadRef = useRef<Promise<void> | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | null>(null);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    let active = true;
    getProfessionals().then(data => {
      if (active) setProfessionals(data);
    }).finally(() => {
      if (active) setLoadingProfessionals(false);
    });
    return () => { active = false; };
  }, []);

  // O terapeuta abre a grade na própria agenda, a não ser que o endereço já traga um profissional.
  // Contas antigas não têm o professionalId no perfil: aí vale o userId do cadastro dele.
  useEffect(() => {
    if (initialProfessionalId || firestoreUser?.profile.role !== 'profissional') return;
    const proprio = professionals.find(p => p.id === firestoreUser.profile.professionalId || p.userId === firestoreUser.uid);
    if (proprio) setSelectedProfessionalId(atual => atual || proprio.id);
  }, [professionals, firestoreUser, initialProfessionalId]);

  const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);
  const canCreate = ['admin', 'coordenador', 'funcionario'].includes(firestoreUser?.profile.role ?? '') && selectedProfessional?.status === 'ativo';
  const selectedPatient = patients.find(patient => patient.id === selectedPatientId) ?? null;
  const allowedSpecialtyNames = useMemo(() => specialties
    .filter(specialty => selectedProfessional?.especialidade && specialty.name.toLowerCase().startsWith(selectedProfessional.especialidade.trim().toLowerCase()))
    .map(specialty => specialty.name), [specialties, selectedProfessional?.especialidade]);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekLabel = `${format(weekStart, "d MMM", { locale: ptBR })} - ${format(weekEnd, "d MMM yyyy", { locale: ptBR })}`;
  const weekKey = `${selectedProfessionalId}:${format(weekStart, "yyyy-MM-dd")}`;

  useEffect(() => {
    if (loadingProfessionals || !selectedProfessional) {
      setAppointments([]);
      setLoadingAppointments(false);
      return;
    }

    let active = true;
    setLoadingAppointments(true);
    setLoadError(false);
    setAppointments([]);
    setLoadedWeekKey("");
    getAppointmentsByProfessionalInRange(selectedProfessional.id, weekStart, weekEnd)
      .then(data => {
        if (active) {
          setAppointments(data);
          setLoadedWeekKey(weekKey);
        }
      })
      .catch(error => {
        console.error("Erro ao carregar grade do terapeuta:", error);
        if (active) {
          setLoadError(true);
          setLoadedWeekKey(weekKey);
        }
      })
      .finally(() => {
        if (active) setLoadingAppointments(false);
      });
    return () => { active = false; };
  }, [loadingProfessionals, selectedProfessional?.id, currentDate, refreshVersion]);

  const ensureBookingData = async () => {
    if (bookingDataLoaded) return;
    if (!bookingLoadRef.current) {
      setBookingDataLoading(true);
      bookingLoadRef.current = Promise.all([getPatients('ativo'), getSpecialties(), getRooms()])
        .then(([patientData, specialtyData, roomData]) => {
          setPatients(patientData);
          setSpecialties(specialtyData);
          setRooms(roomData);
          setBookingDataLoaded(true);
        })
        .finally(() => {
          setBookingDataLoading(false);
          bookingLoadRef.current = null;
        });
    }
    await bookingLoadRef.current;
  };

  const openSlot = async (date: Date, time: string) => {
    if (!canCreate || loadingAppointments || loadError) return;
    setSelectedSlot({ date, time });
    setSelectedPatientId("");
    setQuickModalOpen(true);
    try {
      await ensureBookingData();
    } catch (error) {
      console.error('Erro ao carregar dados para agendamento:', error);
      toast.error('Não foi possível carregar os dados para agendamento.');
    }
  };

  const saveAppointment = async (data: QuickAppointmentData) => {
    if (savingRef.current || !selectedPatient || !selectedProfessional || !allowedSpecialtyNames.includes(data.specialty)) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const result = await createAppointmentFromTherapyGrid(selectedPatient.id, data, allowedSpecialtyNames, selectedProfessional.id);
      if (!result.success) {
        toast.error(result.error || 'Não foi possível salvar o agendamento.');
        return;
      }
      toast.success(data.isRecurring ? 'Sessões agendadas com sucesso.' : 'Agendamento salvo com sucesso.');
      setQuickModalOpen(false);
      setSelectedSlot(null);
      setLoadingAppointments(true);
      setRefreshVersion(version => version + 1);
    } catch (error) {
      console.error('Erro inesperado ao salvar agendamento:', error);
      toast.error('Não foi possível salvar o agendamento.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const timeSlots = useMemo(
    () => [...new Set([...CLINIC_TIMES, ...appointments.map(a => format(a.start.toDate(), "HH:mm"))])].sort(),
    [appointments]
  );

  const appointmentsBySlot = useMemo(() => {
    const grouped = new Map<string, Appointment[]>();
    appointments.forEach(appointment => {
      const key = format(appointment.start.toDate(), "yyyy-MM-dd HH:mm");
      const current = grouped.get(key) ?? [];
      current.push(appointment);
      grouped.set(key, current);
    });
    return grouped;
  }, [appointments]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center justify-between gap-4 p-4 md:flex-row">
          <div className="w-full space-y-2 md:w-1/3">
            <Label htmlFor="professional-select">Profissional</Label>
            <Select value={selectedProfessionalId || undefined} onValueChange={setSelectedProfessionalId}>
              <SelectTrigger id="professional-select" disabled={loadingProfessionals}>
                <SelectValue placeholder="Selecione um profissional" />
              </SelectTrigger>
              <SelectContent>
                {professionals.map(professional => (
                  <SelectItem key={professional.id} value={professional.id}>
                    {professional.fullName}{professional.status !== "ativo" ? ` (${professional.status})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(date => subWeeks(date, 1))} aria-label="Semana anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="w-48 text-center font-semibold"><Calendar className="mr-2 inline h-4 w-4" />{weekLabel}</div>
            <Button variant="outline" size="icon" onClick={() => setCurrentDate(date => addWeeks(date, 1))} aria-label="Próxima semana">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="hidden w-1/3 md:block" />
        </CardContent>
      </Card>

      {loadingProfessionals && <Skeleton className="h-96 w-full" />}
      {!loadingProfessionals && professionals.length === 0 && (
        <p className="p-8 text-center text-muted-foreground">Nenhum profissional encontrado.</p>
      )}
      {!loadingProfessionals && professionals.length > 0 && !selectedProfessional && (
        <p className="p-8 text-center text-muted-foreground">
          {selectedProfessionalId ? "Profissional não encontrado. Selecione outro profissional." : "Selecione um profissional para ver a grade."}
        </p>
      )}
      {selectedProfessional && (loadingAppointments || loadedWeekKey !== weekKey) && <Skeleton className="h-96 w-full" />}
      {selectedProfessional && !loadingAppointments && loadedWeekKey === weekKey && loadError && (
        <p role="alert" className="p-8 text-center text-destructive">Não foi possível carregar os agendamentos desta semana.</p>
      )}
      {selectedProfessional && !loadingAppointments && loadedWeekKey === weekKey && !loadError && (
        <div className="overflow-x-auto">
          {canCreate && <p className="pb-2 text-xs text-muted-foreground">Clique ou toque em um espaço da grade para agendar.</p>}
          {appointments.length === 0 && (
            <p className="pb-4 text-center text-muted-foreground">Nenhum agendamento nesta semana.</p>
          )}
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-muted">
                <th scope="col" className="w-24 border p-2 text-center">Horário</th>
                {weekDays.map(day => (
                  <th scope="col" key={format(day, "yyyy-MM-dd")} className="border p-2 text-center capitalize">
                    {format(day, "EEEE", { locale: ptBR })}<br />
                    <span className="text-sm font-normal">{format(day, "dd/MM")}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} className="h-24">
                  <th scope="row" className="border bg-muted p-2 text-center text-sm font-normal">{time}</th>
                  {weekDays.map(day => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const slotAppointments = appointmentsBySlot.get(`${dayKey} ${time}`) ?? [];
                    return (
                      <td key={dayKey} className={`border p-1 align-top ${canCreate ? 'cursor-pointer transition-colors hover:bg-green-50' : ''}`} onClick={canCreate ? () => void openSlot(day, time) : undefined}>
                        <div className="min-h-20 space-y-1">
                          {slotAppointments.map(appointment => (
                            <div key={appointment.id} className={`rounded border-l-4 bg-card p-2 text-xs shadow-sm ${appointment.status === "cancelado" ? "border-gray-400 opacity-60" : "border-primary"}`} onClick={event => event.stopPropagation()}>
                              <p className="font-bold">{appointment.patientName}</p>
                              <p className="text-muted-foreground">{format(appointment.start.toDate(), "HH:mm")} - {format(appointment.end.toDate(), "HH:mm")}</p>
                              <p className="font-semibold text-blue-600">{formatSpecialtyName(appointment.tipo)}</p>
                              <p className="text-muted-foreground">{STATUS_LABELS[appointment.status] ?? appointment.status}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canCreate && selectedProfessional && (
          <QuickAppointmentModal
            isOpen={quickModalOpen}
            onClose={() => { if (!savingRef.current) setQuickModalOpen(false); }}
            onSave={saveAppointment}
            slotInfo={selectedSlot}
            patient={selectedPatient}
            patientOptions={patients}
            onPatientChange={setSelectedPatientId}
            loadingPatients={bookingDataLoading}
            professionals={[selectedProfessional]}
            specialties={specialties}
            rooms={rooms}
            allowedSpecialtyNames={allowedSpecialtyNames}
            restrictProfessionalsToSpecialty
            fixedProfessionalId={selectedProfessional.id}
            saveLabel="Salvar agendamento"
            saving={saving}
            maxSessions={24}
          />
      )}
    </div>
  );
}
