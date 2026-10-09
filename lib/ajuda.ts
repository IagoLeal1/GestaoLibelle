// lib/ajuda.ts
// A página de Ajuda (/ajuda): guias curtos, passo a passo, para quem nunca usou o sistema. Cada papel vê
// só os guias do que pode fazer. Os textos estão em lib/guias.ts; nada disso usa o banco.
import { GUIAS } from "@/lib/guias";

export { GUIAS };

export type Papel = "admin" | "coordenador" | "funcionario" | "profissional" | "familiar";
export const PAPEIS: Papel[] = ["admin", "coordenador", "funcionario", "profissional", "familiar"];

/** Como o papel aparece na Ajuda: "Guias de tudo o que você pode fazer como terapeuta". */
export const NOME_DO_PAPEL: Record<Papel, string> = {
  admin: "administrador",
  coordenador: "coordenação",
  funcionario: "recepção",
  profissional: "terapeuta",
  familiar: "família",
};

export type IdDoAssunto =
  | "comecar" | "agenda" | "criancas" | "evolucoes" | "equipe" | "financeiro" | "comercial" | "avisos" | "acessos" | "regras";

export interface Assunto {
  id: IdDoAssunto;
  titulo: string;
}

// Na ordem em que aparecem na página
export const ASSUNTOS: Assunto[] = [
  { id: "comecar", titulo: "Primeiros passos" },
  { id: "agenda", titulo: "Agenda" },
  { id: "criancas", titulo: "Crianças" },
  { id: "evolucoes", titulo: "Evoluções" },
  { id: "equipe", titulo: "Equipe, terapias e salas" },
  { id: "financeiro", titulo: "Financeiro" },
  { id: "comercial", titulo: "Comercial" },
  { id: "avisos", titulo: "Avisos e mensagens" },
  { id: "acessos", titulo: "Acessos" },
  // As condições de cada coisa: quando aparece, quem vê, o que cada status faz
  { id: "regras", titulo: "Regras do sistema" },
];

/** Um pedacinho desenhado da tela, ao lado do passo, para a pessoa reconhecer onde tocar. */
export type Miniatura =
  | { tipo: "aviso"; texto: string; acao?: string }
  | { tipo: "botao"; texto: string; variante?: "principal" | "contorno" | "perigo" | "amarelo" }
  | { tipo: "item"; titulo: string; detalhe?: string; selo?: string }
  | { tipo: "campo"; rotulo: string; exemplo?: string }
  | { tipo: "opcoes"; itens: string[]; escolhida: string }
  | { tipo: "chave"; rotulo: string; ligada: boolean };

/** As telas de exemplo da Ajuda (components/ajuda/telas): versões pequenas das telas do site. */
export type IdDaTela =
  | "inicio" | "agenda" | "agenda-do-terapeuta" | "novo-agendamento" | "editar-sessao" | "para-escrever" | "folha-evolucao" | "prontuario"
  | "gerenciar-usuarios";

/** A tela de exemplo de um passo e o lugar que acende nela (onde tocar). */
export interface TelaDoPasso {
  id: IdDaTela;
  alvo?: string;
}

export interface Passo {
  /** **negrito** marca o nome exato do botão ou do campo. */
  texto: string;
  mini?: Miniatura;
  tela?: TelaDoPasso;
}

export interface Guia {
  /** Vai no endereço: /ajuda/<id>. */
  id: string;
  titulo: string;
  assunto: IdDoAssunto;
  papeis: Papel[];
  /** Uma ou duas frases: para que serve. */
  resumo: string;
  passos: Passo[];
  dica?: string;
  /** O botão "Ir para ..." do fim do guia. */
  tela?: { href: string; rotulo: string };
  relacionados?: string[];
}

/** Os primeiros guias de cada papel: as tarefas do dia a dia. */
const COMECE_POR_AQUI: Record<Papel, string[]> = {
  admin: ["aprovar-acesso", "marcar-uma-sessao", "lancar-movimentacao"],
  coordenador: ["acompanhar-evolucoes", "sessoes-do-dia", "enviar-aviso"],
  funcionario: ["sessoes-do-dia", "presenca-falta", "marcar-uma-sessao"],
  profissional: ["escrever-evolucao", "minhas-sessoes-do-dia", "instalar-no-celular"],
  familiar: ["proximos-atendimentos", "conversar-mensagens", "instalar-no-celular"],
};

export const ehPapel = (papel?: string): papel is Papel => PAPEIS.includes(papel as Papel);

/** O que a página mostra: os guias de um papel, ou "tudo" (só o admin, que treina a equipe). */
export type Visao = Papel | "tudo";

export const guiaPorId = (id: string) => GUIAS.find((g) => g.id === id);

export const podeVerGuia = (guia: Guia, visao: Visao) => visao === "tudo" || guia.papeis.includes(visao);

export const guiasDoPapel = (visao: Visao) => GUIAS.filter((g) => podeVerGuia(g, visao));

/** Os assuntos com os guias que o papel vê, na ordem da página; assunto sem guia some. */
export function assuntosDoPapel(visao: Visao) {
  const doPapel = guiasDoPapel(visao);
  return ASSUNTOS
    .map((assunto) => ({ assunto, guias: doPapel.filter((g) => g.assunto === assunto.id) }))
    .filter(({ guias }) => guias.length > 0);
}

export const comecePorAqui = (papel: Papel) =>
  COMECE_POR_AQUI[papel].map(guiaPorId).filter((g): g is Guia => !!g && podeVerGuia(g, papel));

/** Minúsculas, sem acento e sem as marcas de negrito. */
export const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\*\*/g, "").toLowerCase();

// "renovação", "renovar" e "renovações" viram "renova": quem busca não precisa acertar a palavra do guia
const FINAIS = ["mentos", "mento", "coes", "soes", "cao", "sao", "ando", "endo", "indo", "ar", "er", "ir", "as", "es", "os", "s"];
export function raiz(palavra: string) {
  const final = FINAIS.find((f) => palavra.endsWith(f) && palavra.length - f.length >= 4);
  return final ? palavra.slice(0, -final.length) : palavra;
}

/** Todas as palavras precisam aparecer no guia; quem tem a palavra no título vem primeiro. */
export function buscarGuias(guias: Guia[], termo: string): Guia[] {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean).map(raiz);
  if (palavras.length === 0) return [];
  return guias
    .map((g) => {
      const titulo = normalizar(g.titulo);
      const tudo = normalizar([g.titulo, g.resumo, g.dica ?? "", ...g.passos.map((p) => p.texto)].join(" "));
      if (!palavras.every((p) => tudo.includes(p))) return null;
      return { g, pontos: palavras.filter((p) => titulo.includes(p)).length };
    })
    .filter((r): r is { g: Guia; pontos: number } => r !== null)
    .sort((a, b) => b.pontos - a.pontos)
    .map((r) => r.g);
}

/** O guia seguinte do mesmo assunto, entre os que o papel vê. */
export function proximoGuia(guia: Guia, visao: Visao): Guia | undefined {
  const doAssunto = guiasDoPapel(visao).filter((g) => g.assunto === guia.assunto);
  const i = doAssunto.findIndex((g) => g.id === guia.id);
  return i >= 0 ? doAssunto[i + 1] : undefined;
}

/** "Toque em **Salvar**" vira pedaços com e sem negrito. */
export function trechos(texto: string) {
  return texto
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((parte) =>
      parte.startsWith("**") && parte.endsWith("**")
        ? { texto: parte.slice(2, -2), negrito: true }
        : { texto: parte, negrito: false }
    );
}

/** O guia tem telas de exemplo? Os que ainda não têm continuam com as miniaturas de cada passo. */
export const temTelas = (guia: Guia) => guia.passos.some((p) => p.tela);

/** A tela que o passo mostra: a dele ou, sem uma, a do passo mais perto (antes ou depois), sem nada aceso. */
export function telaParaPasso(guia: Guia, i: number): TelaDoPasso | null {
  const propria = guia.passos[i]?.tela;
  if (propria) return propria;
  const vizinhos = [...guia.passos.slice(0, i).reverse(), ...guia.passos.slice(i + 1)];
  const perto = vizinhos.find((p) => p.tela)?.tela;
  return perto ? { id: perto.id } : null;
}

/** "5 passos · 2 minutos": uns 2 passos e meio por minuto, para a pessoa saber que é rápido. */
export function duracaoDoGuia(guia: Guia) {
  const n = guia.passos.length;
  const minutos = Math.max(1, Math.floor(n / 2.5));
  return `${n} ${n === 1 ? "passo" : "passos"} · ${minutos} ${minutos === 1 ? "minuto" : "minutos"}`;
}
