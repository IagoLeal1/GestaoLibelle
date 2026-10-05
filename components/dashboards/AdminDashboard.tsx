"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Calendar, ChevronRight, UserCheck, UserPlus, Users } from "lucide-react";
import { getAppointmentsByDate, Appointment } from "@/services/appointmentService";
import { getRooms, Room } from "@/services/roomService";
import { AdminDashboardStats, getAdminDashboardStats } from "@/services/dashboardService";
import { CommunicationsWidget } from "@/components/dashboard/communications-widget";
import { AgoraEASeguir, Numero, useAgora } from "@/components/dashboards/comum";
import { agendaDeHoje, numerosDoDia } from "@/lib/telaInicial";
import { format } from "date-fns";

// A recepção vê quem chega a seguir; o resto do dia fica na agenda
const PROXIMOS = 6;

/** Só para o admin, e só quando há alguém esperando: leva direto à tela de aprovação. */
function PedidosDeAcesso({ quantos }: { quantos: number }) {
  return (
    <Link
      href="/admin/usuarios"
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
    >
      <UserPlus className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">
        {quantos === 1 ? "1 pedido de acesso esperando sua aprovação" : `${quantos} pedidos de acesso esperando sua aprovação`}
      </span>
      <span className="flex shrink-0 items-center font-medium">
        Ver
        <ChevronRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export function AdminDashboard() {
  const { firestoreUser } = useAuth();
  // Só o admin aprova pedidos de acesso: para a coordenação e a recepção, nem buscamos
  const ehAdmin = firestoreUser?.profile.role === 'admin';
  const agora = useAgora();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({ activePatients: 0, activeProfessionals: 0, pendingUsers: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // O dia no relógio do aparelho: em UTC, depois das 21h de Brasília já seria amanhã
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const [appointmentsData, roomsData, statsData] = await Promise.all([
        getAppointmentsByDate(todayString),
        getRooms(),
        getAdminDashboardStats({ comAprovacoes: ehAdmin })
    ]);
    setAppointments(appointmentsData);
    setRooms(roomsData);
    setStats(statsData);
    setLoading(false);
  }, [ehAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const doDia = useMemo(
    () => appointments.map(a => ({ ...a, start: a.start.toDate(), end: a.end?.toDate() })),
    [appointments]
  );
  const agenda = agendaDeHoje(doDia, { agora, salas: rooms, limite: PROXIMOS });
  const numeros = numerosDoDia(doDia);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Bem-vindo(a) de volta, {firestoreUser?.displayName}! Aqui está um resumo da clínica hoje.
        </p>
      </div>

      {ehAdmin && stats.pendingUsers > 0 && <PedidosDeAcesso quantos={stats.pendingUsers} />}

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Numero titulo="Pacientes ativos" valor={stats.activePatients} icone={Users} carregando={loading} />
        <Numero titulo="Profissionais ativos" valor={stats.activeProfessionals} icone={UserCheck} carregando={loading} />
        <Numero titulo="Atendimentos hoje" valor={numeros.hoje} icone={Calendar} carregando={loading} />
      </div>

      {/* grid-cols-1 prende a coluna na largura da tela no celular */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AgoraEASeguir
          agenda={agenda}
          hoje={numeros.hoje}
          carregando={loading}
          mostrar="profissional"
          agendaCompleta={{ href: "/agendamentos", rotulo: "Ver a agenda do dia" }}
          vazio="Nenhum atendimento hoje."
        />

        <CommunicationsWidget />
      </div>
    </div>
  )
}
