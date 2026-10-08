"use client"

// Pacientes › Detalhes › Diagnóstico, seguindo o desenho aprovado: um cartão por diagnóstico (com a
// situação e o CID), a equipe tirada da agenda com os dias da semana, quem atualizou e, só para a
// gestão e a recepção, o botão de editar. A equipe só é lida quando esta aba abre.
import { useState } from "react";
import { format } from "date-fns";
import { PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { corDaTerapia } from "@/lib/coresDasTerapias";
import { diagnosticosDaFicha, ROTULO_DA_SITUACAO, type Diagnostico, type SituacaoDoDiagnostico } from "@/lib/diagnostico";
import { cn } from "@/lib/utils";
import { useEquipeDaCrianca } from "@/hooks/use-equipe-da-crianca";
import { salvarDiagnostico } from "@/services/diagnosticoService";
import { EditarDiagnostico } from "@/components/diagnostico/editar-diagnostico";

export interface PacienteComDiagnostico {
  id: string;
  fullName: string;
  diagnosticos?: unknown;
  diagnosticoAtualizadoEm?: unknown;
  diagnosticoAtualizadoPor?: string;
}

export interface DiagnosticoSalvo {
  diagnosticos: Diagnostico[];
  diagnosticoAtualizadoEm: Date;
  diagnosticoAtualizadoPor: string;
}

/** A data vem do banco (Timestamp) ou da tela, logo depois de salvar (Date). */
const comoData = (valor: unknown): Date | null =>
  valor instanceof Date ? valor : ((valor as { toDate?: () => Date })?.toDate?.() ?? null);

const SELO: Record<SituacaoDoDiagnostico, string> = {
  confirmado: "bg-[#e6f4ec] text-[#1f6b45]",
  investigacao: "bg-[#fff3cf] text-[#6b4a00]",
};

export function AbaDoDiagnostico({ paciente, podeEditar, autorNome, onSalvo }: {
  paciente: PacienteComDiagnostico;
  podeEditar: boolean;
  autorNome: string;
  onSalvo: (salvo: DiagnosticoSalvo) => void;
}) {
  const diagnosticos = diagnosticosDaFicha(paciente.diagnosticos);
  const { equipe, erro } = useEquipeDaCrianca(paciente.id);
  const [editando, setEditando] = useState(false);
  const atualizadoEm = comoData(paciente.diagnosticoAtualizadoEm);

  const salvar = async (lista: Partial<Diagnostico>[]) => {
    const gravados = await salvarDiagnostico(paciente.id, lista, autorNome);
    onSalvo({ diagnosticos: gravados, diagnosticoAtualizadoEm: new Date(), diagnosticoAtualizadoPor: autorNome });
  };

  return (
    <div className="space-y-3">
      {diagnosticos.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card p-4 text-sm text-muted-foreground">Nenhum diagnóstico preenchido ainda.</p>
      ) : (
        <ul aria-label="Diagnósticos" className="space-y-2.5">
          {diagnosticos.map((d, i) => (
            <li key={`${d.nome}-${i}`} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 text-[15px] font-bold leading-snug [overflow-wrap:anywhere]">{d.nome}</h3>
                <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", SELO[d.situacao] ?? SELO.confirmado)}>
                  {ROTULO_DA_SITUACAO[d.situacao] ?? ROTULO_DA_SITUACAO.confirmado}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{d.cid ? `CID ${d.cid}` : "Sem CID"}</p>
            </li>
          ))}
        </ul>
      )}

      <section aria-labelledby={`equipe-${paciente.id}`} className="rounded-2xl border bg-card p-4">
        <h3 id={`equipe-${paciente.id}`} className="text-xs font-extrabold uppercase tracking-wide text-[#127a7e]">Equipe</h3>
        {erro ? (
          <p className="mt-2 text-sm text-muted-foreground">Não foi possível carregar a equipe agora.</p>
        ) : equipe === null ? (
          <div className="mt-2.5 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : equipe.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma sessão nos últimos 30 dias nem marcada.</p>
        ) : (
          <ul aria-label="Equipe" className="mt-2.5 space-y-2">
            {equipe.map((m) => (
              <li key={`${m.terapia}-${m.professionalId}`} className="flex items-center gap-2.5 text-sm">
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: corDaTerapia(m.terapia) }} />
                <span className="min-w-0 flex-1"><b>{m.terapia}</b> · {m.profissional}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{m.dias}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2.5 text-xs text-muted-foreground">Sai da agenda: quem atendeu nos últimos 30 dias ou tem sessão marcada.</p>
      </section>

      {atualizadoEm && (
        <p className="text-xs text-muted-foreground">
          {`Atualizado em ${format(atualizadoEm, "dd/MM/yyyy")}${paciente.diagnosticoAtualizadoPor ? ` por ${paciente.diagnosticoAtualizadoPor}` : ""}`}
        </p>
      )}

      {podeEditar && (
        <Button onClick={() => setEditando(true)} className="h-11 w-full bg-[#127a7e] text-[15px] hover:bg-[#0d5c5f] sm:w-auto">
          <PencilLine className="mr-2 h-4 w-4" />
          {diagnosticos.length > 0 ? "Editar diagnóstico" : "Preencher diagnóstico"}
        </Button>
      )}

      {podeEditar && (
        <EditarDiagnostico
          aberto={editando}
          onFechar={() => setEditando(false)}
          nomeDaCrianca={paciente.fullName}
          inicial={diagnosticos}
          onSalvar={salvar}
        />
      )}
    </div>
  );
}
