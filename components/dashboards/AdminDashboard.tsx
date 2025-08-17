"use client"

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, XCircle, Activity, UserCheck, Users } from "lucide-react";
import { getAppointmentsByDate, Appointment } from "@/services/appointmentService";
import { getRooms, Room } from "@/services/roomService"; // <-- 1. IMPORTAR AS SALAS
import { AdminDashboardStats, getAdminDashboardStats } from "@/services/dashboardService"; // Importando as estatísticas
import { CommunicationsWidget } from "@/components/dashboard/communications-widget";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
const StatCard = ({ title, value, icon: Icon, loading }: { title: string, value: number, icon: React.ElementType, loading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
);

export function AdminDashboard() {
  const { firestoreUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]); // <-- 2. ESTADO PARA AS SALAS
  const [stats, setStats] = useState<AdminDashboardStats>({ activePatients: 0, activeProfessionals: 0, appointmentsToday: 0, pendingUsers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const todayString = new Date().toISOString().split('T')[0];
    const [appointmentsData, roomsData, statsData] = await Promise.all([
        getAppointmentsByDate(todayString),
        getRooms(), // <-- 3. BUSCAR AS SALAS
        getAdminDashboardStats()
    ]);
    setAppointments(appointmentsData);
    setRooms(roomsData); // <-- 4. GUARDAR AS SALAS
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // <-- 5. FUNÇÃO DE "TRADUÇÃO"
  const getRoomNameById = (roomId?: string): string => {
    if (!roomId) return "N/A";
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : "Sala Excluída";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vindo(a) de volta, {firestoreUser?.displayName}! Aqui está um resumo da clínica hoje.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pacientes Ativos" value={stats.activePatients} icon={Users} loading={loading} />
        <StatCard title="Profissionais Ativos" value={stats.activeProfessionals} icon={UserCheck} loading={loading} />
        <StatCard title="Agendamentos Hoje" value={stats.appointmentsToday} icon={Calendar} loading={loading} />
        <StatCard title="Aprovações Pendentes" value={stats.pendingUsers} icon={Activity} loading={loading} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p>Carregando...</p> : (
              <div className="space-y-0">
                {appointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum agendamento para hoje.</p>
                ) : (
                  appointments.slice(0, 5).map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">{appointment.patientName}</p>
                            <p className="text-sm text-muted-foreground truncate">{appointment.professionalName}</p>
                        </div>
                        <div className="text-sm text-muted-foreground w-16 text-center">{appointment.start.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
                        
                        {/* --- 6. CAMPO CORRIGIDO --- */}
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