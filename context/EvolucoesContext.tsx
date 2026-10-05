"use client"

// context/EvolucoesContext.tsx
// As sessões da janela de cobrança das evoluções (lib/evolucoes), carregadas uma vez por visita:
// o terapeuta, as dele; a coordenação e o admin, as da clínica. O menu, as telas iniciais e a
// página de evoluções leem daqui. Só a agenda é lida: a marca da evolução está na própria sessão.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addDays, endOfDay } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { getAppointmentsByProfessionalInRange, getAppointmentsForReport } from "@/services/appointmentService";
import { getProfessionals } from "@/services/professionalService";
import { entrarNasEquipes, sessaoDaAgenda } from "@/services/evolucaoService";
import { useAgora } from "@/components/dashboards/comum";
import { inicioDaJanela, paraEscrever, type MarcaDaEvolucao, type Pendencia, type SessaoDaAgenda } from "@/lib/evolucoes";

/** O terapeuta vê as sessões dele; o admin e a coordenação, as da equipe toda. */
export type EscopoDasEvolucoes = "terapeuta" | "equipe" | null;

export const escopoDasEvolucoes = (papel?: string): EscopoDasEvolucoes =>
  papel === "profissional" ? "terapeuta" : papel === "admin" || papel === "coordenador" ? "equipe" : null;

interface EvolucoesContextType {
  escopo: EscopoDasEvolucoes;
  carregando: boolean;
  erro: boolean;
  /** Terapeuta sem cadastro de profissional: não há agenda para cobrar. */
  semCadastro: boolean;
  professionalId?: string;
  agora: Date;
  desde: Date;
  sessoes: SessaoDaAgenda[];
  pendentes: Pendencia[];
  /** Atualiza a marca de uma sessão depois de escrever, corrigir ou apagar, sem buscar de novo. */
  marcar: (appointmentId: string, marca?: MarcaDaEvolucao) => void;
  recarregar: () => void;
}

const SEM_EVOLUCOES: EvolucoesContextType = {
  escopo: null,
  carregando: false,
  erro: false,
  semCadastro: false,
  agora: new Date(),
  desde: new Date(),
  sessoes: [],
  pendentes: [],
  marcar: () => {},
  recarregar: () => {},
};

const EvolucoesContext = createContext<EvolucoesContextType>(SEM_EVOLUCOES);

export function EvolucoesProvider({ children }: { children: React.ReactNode }) {
  const { firestoreUser } = useAuth();
  const uid = firestoreUser?.uid;
  const escopo = escopoDasEvolucoes(firestoreUser?.profile.role);
  const agora = useAgora();
  const [sessoes, setSessoes] = useState<SessaoDaAgenda[]>([]);
  const [professionalId, setProfessionalId] = useState<string>();
  const [semCadastro, setSemCadastro] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [versao, setVersao] = useState(0);
  // A janela é fixada na hora de carregar; a lista de pendências anda com o relógio
  const [desde, setDesde] = useState(() => inicioDaJanela(new Date()));

  useEffect(() => {
    if (!uid || !escopo || !firestoreUser) {
      setCarregando(false);
      return;
    }
    let ativo = true;
    (async () => {
      setCarregando(true);
      setErro(false);
      try {
        const hoje = new Date();
        const inicio = inicioDaJanela(hoje);
        if (escopo === "terapeuta") {
          // Contas antigas não têm o professionalId no perfil: aí vale o userId do cadastro, como na grade
          const meuId: string | undefined = firestoreUser.profile.professionalId
            ?? (await getProfessionals()).find((p) => p.userId === uid)?.id;
          if (!ativo) return;
          setProfessionalId(meuId);
          setSemCadastro(!meuId);
          if (!meuId) {
            setSessoes([]);
            return;
          }
          // A semana que vem entra só para o terapeuta já ler a história das crianças novas
          const agenda = (await getAppointmentsByProfessionalInRange(meuId, inicio, addDays(hoje, 7))).map(sessaoDaAgenda);
          await entrarNasEquipes(uid, agenda).catch((e) => console.error("Erro ao entrar nas equipes das crianças:", e));
          if (ativo) setSessoes(agenda);
        } else {
          const agenda = (await getAppointmentsForReport({ startDate: inicio, endDate: endOfDay(hoje) })).map(sessaoDaAgenda);
          if (ativo) setSessoes(agenda);
        }
        if (ativo) setDesde(inicio);
      } catch (e) {
        console.error("Erro ao carregar as evoluções:", e);
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
    // firestoreUser muda de identidade a cada atualização do perfil; o que importa é quem e qual papel
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, escopo, versao]);

  const pendentes = useMemo(() => paraEscrever(sessoes, { agora, desde }), [sessoes, agora, desde]);
  const marcar = useCallback((appointmentId: string, marca?: MarcaDaEvolucao) => {
    setSessoes((atuais) => atuais.map((s) => (s.id === appointmentId ? { ...s, evolucao: marca } : s)));
  }, []);
  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return (
    <EvolucoesContext.Provider
      value={{ escopo, carregando, erro, semCadastro, professionalId, agora, desde, sessoes, pendentes, marcar, recarregar }}
    >
      {children}
    </EvolucoesContext.Provider>
  );
}

export const useEvolucoes = () => useContext(EvolucoesContext);
