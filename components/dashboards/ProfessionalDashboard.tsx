"use client"

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { getAppointmentsByProfessional, Appointment } from "@/services/appointmentService";
import { getProfessionals } from "@/services/professionalService";
import { getRooms, Room } from "@/services/roomService";
import { CommunicationsWidget } from "@/components/dashboard/communications-widget";
import { AgoraEASeguir, Numero, useAgora } from "@/components/dashboards/comum";
import { agendaDeHoje, numerosDoDia } from "@/lib/telaInicial";
import { format } from "date-fns";

export function ProfessionalDashboard() {
  const { firestoreUser } = useAuth();
  const agora = useAgora();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [semCadastro, setSemCadastro] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!firestoreUser) return;
    setLoading(true);
    // Contas antigas não têm o professionalId no perfil: aí vale o userId do cadastro dele, como na grade
    const professionalId: string | undefined = firestoreUser.profile.professionalId
      ?? (await getProfessionals()).find(p => p.userId === firestoreUser.uid)?.id;
    if (!professionalId) {
      setSemCadastro(true);
      setLoading(false);
      return;
    }

    // O dia no relógio do aparelho: em UTC, depois das 21h de Brasília já seria amanhã
    const todayString = format(new Date(), 'yyyy-MM-dd');
    const [appointmentsData, roomsData] = await Promise.all([
      getAppointmentsByProfessional(professionalId, todayString),
      getRooms()
    ]);
    setAppointments(appointmentsData);
    setRooms(roomsData);
    setLoading(false);
  }, [firestoreUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const doDia = useMemo(
    () => appointments.map(a => ({ ...a, start: a.start.toDate(), end: a.end?.toDate() })),
    [appointments]
  );
  // O terapeuta vê o resto do dia inteiro: são poucos atendimentos por pessoa
  const agenda = agendaDeHoje(doDia, { agora, salas: rooms });
  const numeros = numerosDoDia(doDia);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Olá, {firestoreUser?.displayName?.split(' ')[0]}!</h2>
        <p className="text-muted-foreground">
            Aqui está um resumo dos seus atendimentos de hoje.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Numero titulo="Atendimentos hoje" valor={numeros.hoje} icone={Calendar} carregando={loading} />
        <Numero titulo="Finalizados" valor={numeros.finalizados} icone={CheckCircle} carregando={loading} />
        <Numero titulo="Faltas e cancelados" valor={numeros.faltasECancelados} icone={XCircle} carregando={loading} />
      </div>

      {/* grid-cols-1 prende a coluna na largura da tela no celular */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <AgoraEASeguir
          agenda={agenda}
          hoje={numeros.hoje}
          carregando={loading}
          mostrar="terapia"
          agendaCompleta={{ href: "/agendamentos/terapeuta", rotulo: "Ver minha semana" }}
          vazio="Nenhum atendimento seu hoje."
          aviso={semCadastro ? "Não encontramos seu cadastro de profissional, então sua agenda não aparece aqui. Peça à coordenação para conferir." : undefined}
        />

        <CommunicationsWidget />
      </div>
    </div>
  )
}
