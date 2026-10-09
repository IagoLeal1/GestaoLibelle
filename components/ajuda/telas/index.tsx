"use client"

// As telas de exemplo da Ajuda, pelo nome que os guias usam (lib/guias.ts: passo.tela). Cada uma diz os
// lugares que podem acender, e um teste confere que todo passo aponta para uma tela e um lugar que existem.
import { useEffect, useRef, useState } from "react";
import type { IdDaTela, TelaDoPasso, Visao } from "@/lib/ajuda";
import { TelaAgenda, ALVOS_DA_AGENDA, ALVOS_DA_AGENDA_DO_TERAPEUTA } from "./agenda";
import {
  TelaAssistenteOpcoes, TelaAssistentePedido, TelaDizerNao, TelaExcluirEncaixe, TelaMandarParaRecepcao, TelaParaAgendar, TelaRecusados,
  ALVOS_DAS_OPCOES, ALVOS_DE_EXCLUIR_ENCAIXE, ALVOS_DE_MANDAR, ALVOS_DE_PARA_AGENDAR, ALVOS_DO_NAO, ALVOS_DO_PEDIDO, ALVOS_DOS_RECUSADOS,
} from "./assistente";
import {
  TelaEditarSessao, TelaNovoAgendamento, TelaRenovacoes, ALVOS_DAS_RENOVACOES, ALVOS_DE_EDITAR_SESSAO, ALVOS_DO_NOVO_AGENDAMENTO,
} from "./agendamento";
import { TelaAprovacao, TelaEntrada, TelaMinhaConta, ALVOS_DA_APROVACAO, ALVOS_DA_ENTRADA, ALVOS_DA_MINHA_CONTA } from "./acessos";
import { TelaCentral, ALVOS_DA_CENTRAL } from "./central";
import { TelaAvisos, TelaEquipeDaConversa, TelaMensagens, ALVOS_DA_EQUIPE_DA_CONVERSA, ALVOS_DE_AVISOS, ALVOS_DE_MENSAGENS } from "./comunicacao";
import {
  TelaEspecialidades, TelaFormularioDeProfissional, TelaProfissionais, TelaSalas,
  ALVOS_DAS_SALAS, ALVOS_DE_ESPECIALIDADES, ALVOS_DE_PROFISSIONAIS, ALVOS_DO_FORMULARIO_DE_PROFISSIONAL,
} from "./equipe";
import { TelaPainelDaFamilia, ALVOS_DO_PAINEL_DA_FAMILIA } from "./familia";
import { TelaComercial, TelaFinanceiro, ALVOS_DO_COMERCIAL, ALVOS_DO_FINANCEIRO } from "./financeiro";
import { TelaGrade, ALVOS_DA_GRADE, ALVOS_DA_GRADE_DO_TERAPEUTA } from "./grade";
import {
  TelaFicha, TelaFormularioDePaciente, TelaListaDeProntuarios, TelaPacientes,
  ALVOS_DA_FICHA, ALVOS_DA_LISTA_DE_PRONTUARIOS, ALVOS_DE_PACIENTES, ALVOS_DO_FORMULARIO_DE_PACIENTE,
} from "./pacientes";
import { TelaFolhaEvolucao, TelaParaEscrever, ALVOS_DA_FOLHA, ALVOS_DE_PARA_ESCREVER } from "./evolucoes";
import { TelaGerenciarUsuarios, ALVOS_DE_GERENCIAR_USUARIOS } from "./gerenciar-usuarios";
import { TelaInicio, ALVOS_DO_INICIO } from "./inicio";
import { TelaProntuario, ALVOS_DO_PRONTUARIO } from "./prontuario";

export const TELAS: Record<IdDaTela, { titulo: string; alvos: string[]; Tela: (props: { alvo?: string; papel?: Visao }) => React.ReactElement }> = {
  inicio: { titulo: "Tela inicial", alvos: ALVOS_DO_INICIO, Tela: TelaInicio },
  agenda: { titulo: "Agendamentos", alvos: ALVOS_DA_AGENDA, Tela: TelaAgenda },
  "agenda-do-terapeuta": { titulo: "Agendamentos", alvos: ALVOS_DA_AGENDA_DO_TERAPEUTA, Tela: ({ alvo }) => <TelaAgenda alvo={alvo} terapeuta /> },
  "novo-agendamento": { titulo: "Novo Agendamento", alvos: ALVOS_DO_NOVO_AGENDAMENTO, Tela: TelaNovoAgendamento },
  "editar-sessao": { titulo: "Editar Agendamento", alvos: ALVOS_DE_EDITAR_SESSAO, Tela: TelaEditarSessao },
  "para-escrever": { titulo: "Evoluções", alvos: ALVOS_DE_PARA_ESCREVER, Tela: TelaParaEscrever },
  "folha-evolucao": { titulo: "Escrever a evolução", alvos: ALVOS_DA_FOLHA, Tela: TelaFolhaEvolucao },
  prontuario: { titulo: "Prontuário", alvos: ALVOS_DO_PRONTUARIO, Tela: TelaProntuario },
  "gerenciar-usuarios": { titulo: "Gerenciar Usuários", alvos: ALVOS_DE_GERENCIAR_USUARIOS, Tela: TelaGerenciarUsuarios },
  // Etapa 2
  "painel-da-familia": { titulo: "Tela inicial da família", alvos: ALVOS_DO_PAINEL_DA_FAMILIA, Tela: TelaPainelDaFamilia },
  grade: { titulo: "Grade por paciente", alvos: ALVOS_DA_GRADE, Tela: TelaGrade },
  "grade-do-terapeuta": { titulo: "Minha semana", alvos: ALVOS_DA_GRADE_DO_TERAPEUTA, Tela: ({ alvo }) => <TelaGrade alvo={alvo} terapeuta /> },
  renovacoes: { titulo: "Renovações Pendentes", alvos: ALVOS_DAS_RENOVACOES, Tela: TelaRenovacoes },
  pacientes: { titulo: "Pacientes", alvos: ALVOS_DE_PACIENTES, Tela: TelaPacientes },
  ficha: { titulo: "Detalhes do Paciente", alvos: ALVOS_DA_FICHA, Tela: TelaFicha },
  "formulario-de-paciente": { titulo: "Ficha do paciente", alvos: ALVOS_DO_FORMULARIO_DE_PACIENTE, Tela: TelaFormularioDePaciente },
  "lista-de-prontuarios": { titulo: "Prontuários", alvos: ALVOS_DA_LISTA_DE_PRONTUARIOS, Tela: TelaListaDeProntuarios },
  central: { titulo: "Evoluções", alvos: ALVOS_DA_CENTRAL, Tela: TelaCentral },
  profissionais: { titulo: "Profissionais", alvos: ALVOS_DE_PROFISSIONAIS, Tela: TelaProfissionais },
  "formulario-de-profissional": { titulo: "Cadastro do profissional", alvos: ALVOS_DO_FORMULARIO_DE_PROFISSIONAL, Tela: TelaFormularioDeProfissional },
  especialidades: { titulo: "Especialidades", alvos: ALVOS_DE_ESPECIALIDADES, Tela: TelaEspecialidades },
  salas: { titulo: "Mapeamento de Salas", alvos: ALVOS_DAS_SALAS, Tela: TelaSalas },
  financeiro: { titulo: "Financeiro", alvos: ALVOS_DO_FINANCEIRO, Tela: TelaFinanceiro },
  comercial: { titulo: "Comercial", alvos: ALVOS_DO_COMERCIAL, Tela: TelaComercial },
  avisos: { titulo: "Avisos", alvos: ALVOS_DE_AVISOS, Tela: TelaAvisos },
  mensagens: { titulo: "Mensagens", alvos: ALVOS_DE_MENSAGENS, Tela: TelaMensagens },
  "equipe-da-conversa": { titulo: "Mensagens", alvos: ALVOS_DA_EQUIPE_DA_CONVERSA, Tela: TelaEquipeDaConversa },
  aprovacao: { titulo: "Aprovação de Acesso", alvos: ALVOS_DA_APROVACAO, Tela: TelaAprovacao },
  "minha-conta": { titulo: "Configurações", alvos: ALVOS_DA_MINHA_CONTA, Tela: TelaMinhaConta },
  entrada: { titulo: "Entrada no sistema", alvos: ALVOS_DA_ENTRADA, Tela: TelaEntrada },
  // Assistente de agendamento (encaixes)
  "assistente-pedido": { titulo: "Assistente de Agendamento", alvos: ALVOS_DO_PEDIDO, Tela: TelaAssistentePedido },
  "assistente-opcoes": { titulo: "Assistente de Agendamento", alvos: ALVOS_DAS_OPCOES, Tela: TelaAssistenteOpcoes },
  "mandar-para-recepcao": { titulo: "Mandar para a recepção", alvos: ALVOS_DE_MANDAR, Tela: TelaMandarParaRecepcao },
  "dizer-nao": { titulo: "Por que não essa opção?", alvos: ALVOS_DO_NAO, Tela: TelaDizerNao },
  "para-agendar": { titulo: "Para agendar", alvos: ALVOS_DE_PARA_AGENDAR, Tela: TelaParaAgendar },
  "excluir-encaixe": { titulo: "Excluir este encaixe?", alvos: ALVOS_DE_EXCLUIR_ENCAIXE, Tela: TelaExcluirEncaixe },
  recusados: { titulo: "Recusados", alvos: ALVOS_DOS_RECUSADOS, Tela: TelaRecusados },
};

/** A tela de exemplo no tamanho em que foi desenhada (o painel do guia aberto), do jeito do papel de quem lê. */
export function TelaDeExemplo({ tela, papel }: { tela: TelaDoPasso; papel?: Visao }) {
  const { Tela } = TELAS[tela.id];
  return (
    <div aria-hidden className="h-full select-none">
      <Tela alvo={tela.alvo} papel={papel} />
    </div>
  );
}

/** A mesma tela, menor (cartões de "Comece por aqui" e a ilustração do alto da Ajuda). */
export function MiniaturaDaTela({ tela, papel, escala = 0.62, className }: { tela: TelaDoPasso; papel?: Visao; escala?: number; className?: string }) {
  return (
    <div aria-hidden className={className} style={{ overflow: "hidden", position: "relative" }}>
      <div style={{ width: `${100 / escala}%`, height: `${100 / escala}%`, transform: `scale(${escala})`, transformOrigin: "top left" }}>
        <TelaDeExemplo tela={tela} papel={papel} />
      </div>
    </div>
  );
}

// Toda tela de exemplo é desenhada neste tamanho e depois aumentada ou diminuída para caber no espaço:
// no computador fica quase do tamanho real; no celular, o mesmo desenho, menor, sem nada cortado.
export const LARGURA_DA_TELA = 420;
export const ALTURA_DA_TELA = 340;

/** A tela de exemplo do guia aberto, na largura que houver, sem mudar o desenho. */
export function TelaAjustada({ tela, papel }: { tela: TelaDoPasso; papel?: Visao }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const medir = () => el.clientWidth > 0 && setEscala(el.clientWidth / LARGURA_DA_TELA);
    medir();
    // Ao girar o celular ou mudar o tamanho da janela, mede de novo
    window.addEventListener("resize", medir);
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(medir);
    observador?.observe(el);
    return () => {
      window.removeEventListener("resize", medir);
      observador?.disconnect();
    };
  }, []);
  return (
    <div ref={caixa} style={{ height: ALTURA_DA_TELA * escala, position: "relative", overflow: "hidden" }}>
      <div style={{ width: LARGURA_DA_TELA, height: ALTURA_DA_TELA, transform: `scale(${escala})`, transformOrigin: "top left" }}>
        <TelaDeExemplo tela={tela} papel={papel} />
      </div>
    </div>
  );
}
