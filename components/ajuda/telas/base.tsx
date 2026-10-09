// Peças das telas de exemplo da Ajuda: versões pequenas das telas do site, desenhadas em código (sem
// imagens nem leituras do banco). O lugar de tocar do passo acende em laranja (classe alvo-aceso, em
// app/globals.css). Tudo aqui é só desenho: nada é clicável e o leitor de tela pula (o texto do passo diz).
import { Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

/** Um pedaço da tela que pode acender: acende quando o alvo do passo é o nome dele. */
export function Aceso({ nome, alvo, className, children }: { nome: string; alvo?: string; className?: string; children: React.ReactNode }) {
  const aceso = nome === alvo;
  return (
    <div data-alvo={nome} data-alvo-aceso={aceso ? nome : undefined} className={cn(className, aceso && "alvo-aceso")}>
      {children}
    </div>
  );
}

/** A moldura do app: o cabeçalho creme (menu, sino e iniciais) e o fundo das páginas. */
export function Janela({ children, cabecalho, className }: { children: React.ReactNode; cabecalho?: React.ReactNode; className?: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-[#eef3f6] text-[#1c2b33]">
      <div className="flex h-9 shrink-0 items-center gap-2 bg-[#fff6da] px-2.5">
        {cabecalho ?? (
          <>
            <Menu aria-hidden className="h-4 w-4 text-[#37474f]" />
            <span className="ml-auto" />
            <Bell aria-hidden className="h-4 w-4 text-[#37474f]" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#37474f]">AA</span>
          </>
        )}
      </div>
      <div className={cn("relative flex min-h-0 flex-1 flex-col gap-2 p-3", className)}>{children}</div>
    </div>
  );
}

/** Uma linha de lista (sessão, pessoa, evolução). */
export function Linha({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex min-h-8 items-center gap-2 rounded-lg border border-[#dde5e9] bg-white px-2.5 py-1.5 text-[11px]", className)}>{children}</div>;
}

/** Um botão desenhado (não é clicável). */
export function Botao({ children, variante = "principal", className }: { children: React.ReactNode; variante?: "principal" | "contorno" | "perigo" | "amarelo"; className?: string }) {
  const cores = {
    principal: "border-transparent bg-[#127a7e] text-white",
    contorno: "border-[#cfd9de] bg-white text-[#37474f]",
    perigo: "border-red-200 bg-white text-red-700",
    amarelo: "border-[#f3d27a] bg-[#fff8e1] text-[#6b4a00]",
  };
  return <span className={cn("inline-flex h-7 items-center whitespace-nowrap rounded-md border px-2.5 text-[10.5px] font-semibold", cores[variante], className)}>{children}</span>;
}

/** Uma janela por cima da tela (as caixas de diálogo do site). */
export function Caixa({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#1c2b33]/35 p-3">
      <div className="flex w-full max-w-[300px] flex-col gap-2 rounded-xl bg-white p-3 shadow-xl">
        <span className="text-[12.5px] font-bold">{titulo}</span>
        {children}
      </div>
    </div>
  );
}

/** Um campo de formulário desenhado. */
export function Campo({ rotulo, valor, className }: { rotulo: string; valor: string; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="truncate text-[10px] font-semibold text-[#37474f]">{rotulo}</span>
      <span className="flex h-7 items-center truncate rounded-md border border-[#cfd9de] bg-white px-2 text-[10.5px] text-[#52646d]">{valor}</span>
    </div>
  );
}

/** A chave liga/desliga. */
export function Chave({ ligada }: { ligada: boolean }) {
  return (
    <span className={cn("flex h-[18px] w-8 shrink-0 items-center rounded-full p-0.5", ligada ? "justify-end bg-[#127a7e]" : "justify-start bg-[#cfd9de]")}>
      <span className="h-3.5 w-3.5 rounded-full bg-white" />
    </span>
  );
}

/** O título de uma página dentro da tela de exemplo. */
export const Titulo = ({ children }: { children: React.ReactNode }) => <span className="text-[13px] font-bold">{children}</span>;
