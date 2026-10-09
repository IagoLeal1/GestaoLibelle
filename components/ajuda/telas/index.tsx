// As telas de exemplo da Ajuda, pelo nome que os guias usam (lib/guias.ts: passo.tela). Cada uma diz os
// lugares que podem acender, e um teste confere que todo passo aponta para uma tela e um lugar que existem.
import type { IdDaTela, TelaDoPasso } from "@/lib/ajuda";
import { TelaAgenda, ALVOS_DA_AGENDA, ALVOS_DA_AGENDA_DO_TERAPEUTA } from "./agenda";
import { TelaEditarSessao, TelaNovoAgendamento, ALVOS_DE_EDITAR_SESSAO, ALVOS_DO_NOVO_AGENDAMENTO } from "./agendamento";
import { TelaFolhaEvolucao, TelaParaEscrever, ALVOS_DA_FOLHA, ALVOS_DE_PARA_ESCREVER } from "./evolucoes";
import { TelaGerenciarUsuarios, ALVOS_DE_GERENCIAR_USUARIOS } from "./gerenciar-usuarios";
import { TelaInicio, ALVOS_DO_INICIO } from "./inicio";
import { TelaProntuario, ALVOS_DO_PRONTUARIO } from "./prontuario";

export const TELAS: Record<IdDaTela, { titulo: string; alvos: string[]; Tela: (props: { alvo?: string }) => React.ReactElement }> = {
  inicio: { titulo: "Tela inicial", alvos: ALVOS_DO_INICIO, Tela: TelaInicio },
  agenda: { titulo: "Agendamentos", alvos: ALVOS_DA_AGENDA, Tela: TelaAgenda },
  "agenda-do-terapeuta": { titulo: "Agendamentos", alvos: ALVOS_DA_AGENDA_DO_TERAPEUTA, Tela: ({ alvo }) => <TelaAgenda alvo={alvo} terapeuta /> },
  "novo-agendamento": { titulo: "Novo Agendamento", alvos: ALVOS_DO_NOVO_AGENDAMENTO, Tela: TelaNovoAgendamento },
  "editar-sessao": { titulo: "Editar Agendamento", alvos: ALVOS_DE_EDITAR_SESSAO, Tela: TelaEditarSessao },
  "para-escrever": { titulo: "Evoluções", alvos: ALVOS_DE_PARA_ESCREVER, Tela: TelaParaEscrever },
  "folha-evolucao": { titulo: "Escrever a evolução", alvos: ALVOS_DA_FOLHA, Tela: TelaFolhaEvolucao },
  prontuario: { titulo: "Prontuário", alvos: ALVOS_DO_PRONTUARIO, Tela: TelaProntuario },
  "gerenciar-usuarios": { titulo: "Gerenciar Usuários", alvos: ALVOS_DE_GERENCIAR_USUARIOS, Tela: TelaGerenciarUsuarios },
};

/** A tela de exemplo no tamanho em que foi desenhada (o painel do guia aberto). */
export function TelaDeExemplo({ tela }: { tela: TelaDoPasso }) {
  const { Tela } = TELAS[tela.id];
  return (
    <div aria-hidden className="h-full select-none">
      <Tela alvo={tela.alvo} />
    </div>
  );
}

/** A mesma tela, menor (cartões de "Comece por aqui" e a ilustração do alto da Ajuda). */
export function MiniaturaDaTela({ tela, escala = 0.62, className }: { tela: TelaDoPasso; escala?: number; className?: string }) {
  return (
    <div aria-hidden className={className} style={{ overflow: "hidden", position: "relative" }}>
      <div style={{ width: `${100 / escala}%`, height: `${100 / escala}%`, transform: `scale(${escala})`, transformOrigin: "top left" }}>
        <TelaDeExemplo tela={tela} />
      </div>
    </div>
  );
}
