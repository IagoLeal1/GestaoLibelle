"use client"

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getAppointmentsByProfessional, Appointment } from "@/services/appointmentService";
import { getRooms, Room } from "@/services/roomService"; // <-- IMPORTAR AS SALAS
import { CommunicationsWidget } from "@/components/dashboard/communications-widget";
import { Badge } from "@/components/ui/badge";

// Função de ajuda para os badges de status
const getStatusBadge = (status: string) => {
  const statusConfig: { [key: string]: { label: string; className: string } } = {
    agendado: { label: "Agendado", className: "bg-blue-100 text-blue-800" },
    finalizado: { label: "Finalizado", className: "bg-green-100 text-green-800" },
    nao_compareceu: { label: "Faltou", className: "bg-red-100 text-red-800" },
    cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800" },
    em_atendimento: { label: "Em Atendimento", className: "bg-orange-100 text-orange-800" },
  };
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100' };
  return <Badge variant="outline" className={`font-semibold ${config.className}`}>{config.label}</Badge>;
};

// Componente para os Cards de Estatísticas com Skeleton
const StatCard = ({ title, value, description, icon: Icon, loading }: { title: string, value: number, description: string, icon: React.ElementType, loading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
);

export function ProfessionalDashboard() {
  const { firestoreUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]); // <-- ESTADO PARA AS SALAS
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (firestoreUser?.profile.professionalId) {
      setLoading(true);
      const todayString = new Date().toISOString().split('T')[0];
      
      const [appointmentsData, roomsData] = await Promise.all([
        getAppointmentsByProfessional(firestoreUser.profile.professionalId, todayString),
        getRooms() // <-- BUSCAR AS SALAS
      ]);

      setAppointments(appointmentsData);
      setRooms(roomsData); // <-- GUARDAR AS SALAS
      setLoading(false);
    } else {
        setLoading(false);
    }
  }, [firestoreUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função de "tradução" de ID para nome
  const getRoomNameById = (roomId?: string): string => {
    if (!roomId) return "N/A";
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : "Sala Excluída";
  };

  const stats = {
    total: appointments.length,
    emAtendimento: appointments.filter(a => a.status === 'em_atendimento').length,
    finalizados: appointments.filter(a => a.status === 'finalizado').length,
    faltasCancelados: appointments.filter(a => a.status === 'nao_compareceu' || a.status === 'cancelado').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Seu Dashboard, {firestoreUser?.displayName}!</h2>
        <p className="text-muted-foreground">
            Aqui está um resumo dos seus atendimentos e atividades de hoje.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Meus Agendamentos Hoje" value={stats.total} description="Sua agenda para hoje" icon={Calendar} loading={loading} />
        <StatCard title="Em Atendimento" value={stats.emAtendimento} description="Ocorrendo agora" icon={Activity} loading={loading} />
        <StatCard title="Finalizados" value={stats.finalizados} description="Concluídos por você hoje" icon={CheckCircle} loading={loading} />
        <StatCard title="Faltas/Cancelados" value={stats.faltasCancelados} description="Em sua agenda hoje" icon={XCircle} loading={loading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seus Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
              <div className="space-y-0">
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento para você hoje.</p>
                ) : (
                  appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{appointment.patientName}</p>
                            <p className="text-sm text-muted-foreground truncate">{appointment.tipo}</p>
                        </div>
                        <div className="text-sm text-muted-foreground w-16 text-center">{appointment.start.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                        
                        {/* --- CAMPO CORRIGIDO --- */}
                        <div className="w-auto text-center px-2"><Badge variant="outline">{getRoomNameById(appointment.sala)}</Badge></div>

                        <div className="w-28 text-right">{getStatusBadge(appointment.status)}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <CommunicationsWidget />
      </div>
    </div>
  )
}