// Peças da página de Ajuda (lib/ajuda): o ícone de cada assunto, o texto com o nome dos botões em
// negrito e as miniaturas, pedacinhos desenhados da tela para a pessoa reconhecer onde tocar.
import Link from "next/link";
import {
  Calendar, ChevronRight, DollarSign, ListChecks, Lock, Megaphone, NotebookPen, Rocket, TrendingUp, UserRound, Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { duracaoDoGuia, trechos, type Guia, type IdDoAssunto, type Miniatura as TipoDaMiniatura } from "@/lib/ajuda";

const ICONES: Record<IdDoAssunto, { icone: LucideIcon; cor: string }> = {
  comecar: { icone: Rocket, cor: "bg-[#fdf0dc] text-[#9a5b00]" },
  agenda: { icone: Calendar, cor: "bg-[#e8eef9] text-[#2f55a4]" },
  criancas: { icone: Users, cor: "bg-[#e3f4f4] text-[#127a7e]" },
  evolucoes: { icone: NotebookPen, cor: "bg-[#e3f4f4] text-[#127a7e]" },
  equipe: { icone: UserRound, cor: "bg-[#efe9f8] text-[#5b3a96]" },
  financeiro: { icone: DollarSign, cor: "bg-[#e6f4ec] text-[#1f6b45]" },
  comercial: { icone: TrendingUp, cor: "bg-[#fde9e3] text-[#9b3a1c]" },
  avisos: { icone: Megaphone, cor: "bg-[#fff3cf] text-[#7a5600]" },
  acessos: { icone: Lock, cor: "bg-[#eceff1] text-[#37474f]" },
  regras: { icone: ListChecks, cor: "bg-[#e8eef9] text-[#16375b]" },
};

/** As cores de cada assunto (fundo claro e texto escuro), para os selos e os ícones. */
export const CORES_DO_ASSUNTO = Object.fromEntries(Object.entries(ICONES).map(([id, { cor }]) => [id, cor])) as Record<IdDoAssunto, string>;

export function IconeDoAssunto({ assunto, className }: { assunto: IdDoAssunto; className?: string }) {
  const { icone: Icone, cor } = ICONES[assunto];
  return (
    <span aria-hidden className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]", cor, className)}>
      <Icone className="h-5 w-5" />
    </span>
  );
}

/** O texto do guia, com o nome exato de cada botão em negrito. */
export function Texto({ children }: { children: string }) {
  return (
    <>
      {trechos(children).map((t, i) => (t.negrito ? <strong key={i}>{t.texto}</strong> : <span key={i}>{t.texto}</span>))}
    </>
  );
}


/** Um guia na lista: ícone do assunto, título e quantos passos tem. */
export function CartaoDoGuia({ guia }: { guia: Guia }) {
  return (
    <Link
      href={`/ajuda/${guia.id}`}
      className="flex items-center gap-3 rounded-[14px] border bg-card p-3.5 transition-colors hover:bg-muted/40"
    >
      <IconeDoAssunto assunto={guia.assunto} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-[15px] font-semibold leading-snug">{guia.titulo}</span>
        <span className="text-[13px] text-muted-foreground">{duracaoDoGuia(guia)}</span>
      </span>
      <ChevronRight aria-hidden className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
    </Link>
  );
}

// ——— Miniaturas: desenhos simples da tela, só para reconhecer (o leitor de tela lê o texto do passo) ———

const BOTOES = {
  principal: "border-transparent bg-[#127a7e] text-white",
  contorno: "border-[#1da7ac] bg-white text-[#127a7e]",
  perigo: "border-red-300 bg-white text-red-700",
  amarelo: "border-yellow-400 bg-yellow-50 text-yellow-800",
};

export function Miniatura({ mini }: { mini: TipoDaMiniatura }) {
  switch (mini.tipo) {
    case "aviso":
      return (
        <div aria-hidden className="flex items-center gap-2.5 rounded-[10px] border border-[#f3d27a] bg-[#fff8e1] px-3 py-2.5 text-[13px] text-[#6b4a00]">
          <span className="flex-1">{mini.texto}</span>
          {mini.acao && <span className="whitespace-nowrap font-semibold">{mini.acao} ›</span>}
        </div>
      );
    case "botao":
      return (
        <span aria-hidden className={cn("self-start rounded-lg border px-3.5 py-2 text-[13px] font-semibold", BOTOES[mini.variante ?? "principal"])}>
          {mini.texto}
        </span>
      );
    case "item":
      return (
        <div aria-hidden className="flex items-center gap-3 rounded-[10px] border bg-white px-3 py-2.5">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-semibold">{mini.titulo}</span>
            {mini.detalhe && <span className="text-xs text-muted-foreground">{mini.detalhe}</span>}
          </span>
          {mini.selo && <span className="shrink-0 rounded-full bg-[#e8eef9] px-2 py-0.5 text-xs font-semibold text-[#2f55a4]">{mini.selo}</span>}
        </div>
      );
    case "campo":
      return (
        <div aria-hidden className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold">{mini.rotulo}</span>
          <span className="rounded-lg border border-[#cfd9de] bg-white px-2.5 py-2 text-xs text-[#6b7a80]">{mini.exemplo ?? " "}</span>
        </div>
      );
    case "opcoes":
      return (
        <div aria-hidden className="flex flex-wrap gap-1.5">
          {mini.itens.map((item) => (
            <span
              key={item}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium",
                item === mini.escolhida ? "border-[#127a7e] bg-[#127a7e] text-white" : "bg-white text-foreground"
              )}
            >
              {item}
            </span>
          ))}
        </div>
      );
    case "chave":
      return (
        <div aria-hidden className="flex items-center gap-2.5 text-[13px] font-medium">
          <span className={cn("flex h-5 w-9 items-center rounded-full p-0.5", mini.ligada ? "justify-end bg-[#127a7e]" : "justify-start bg-[#cfd9de]")}>
            <span className="h-4 w-4 rounded-full bg-white shadow" />
          </span>
          {mini.rotulo}
        </div>
      );
  }
}
