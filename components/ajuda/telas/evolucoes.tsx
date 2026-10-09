// Telas de exemplo das evoluções do terapeuta: a lista "Para escrever" (com a pendente de hoje, a
// atrasada e as escritas) e a folha de escrever a evolução (ou de ler a já escrita, para corrigir).
import { Pin } from "lucide-react";
import { Aceso, Botao, Janela, Linha, Titulo } from "./base";

export const ALVOS_DE_PARA_ESCREVER = ["item", "hoje", "atrasada", "escrita"];

export function TelaParaEscrever({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Evoluções</Titulo>
      <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#9a5b00]">Para escrever (2)</span>
      <Aceso nome="item" alvo={alvo} className="rounded-lg">
        <Linha>
          <span className="flex min-w-0 flex-col"><b>Lucas Souza</b><span className="text-[#52646d]">Hoje, 09:00 · Fonoaudiologia</span></span>
          <Aceso nome="hoje" alvo={alvo} className="ml-auto rounded-full bg-[#fff3cf] px-1.5 py-0.5 text-[9px] font-bold text-[#7a5600]">Hoje</Aceso>
        </Linha>
      </Aceso>
      <Linha>
        <span className="flex min-w-0 flex-col"><b>Bia Lima</b><span className="text-[#52646d]">Ter, 07/10 · Fonoaudiologia</span></span>
        <Aceso nome="atrasada" alvo={alvo} className="ml-auto whitespace-nowrap rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-700">Atrasada há 2 dias</Aceso>
      </Linha>
      <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Escritas nos últimos 14 dias</span>
      <Aceso nome="escrita" alvo={alvo} className="rounded-lg">
        <Linha>
          <span className="flex min-w-0 flex-col"><b>Theo Martins</b><span className="text-[#52646d]">Ontem, 10:00 · Fonoaudiologia</span></span>
          <span className="ml-auto rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-800">Escrita</span>
        </Linha>
      </Aceso>
    </Janela>
  );
}

export const ALVOS_DA_FOLHA = ["lembrar", "texto", "salvar", "nao-aconteceu", "corrigir", "apagar"];

export function TelaFolhaEvolucao({ alvo }: { alvo?: string }) {
  const lendo = alvo === "corrigir" || alvo === "apagar";
  return (
    <Janela>
      <div className="flex flex-col">
        <Titulo>{lendo ? "Theo Martins" : "Lucas Souza"}</Titulo>
        <span className="text-[10.5px] text-[#52646d]">{lendo ? "Ontem, 10:00 · Fonoaudiologia" : "Hoje, 09:00 · Fonoaudiologia"}</span>
      </div>
      {lendo ? (
        <>
          <p className="rounded-lg border border-[#dde5e9] bg-white p-2.5 text-[11px] leading-relaxed">
            Trabalhamos o fonema /r/ com espelho. Respondeu bem às pistas visuais. Orientar a família a repetir o jogo em casa.
          </p>
          <div className="mt-auto flex items-center justify-between">
            <Aceso nome="apagar" alvo={alvo} className="rounded-md"><Botao variante="perigo">Apagar evolução</Botao></Aceso>
            <Aceso nome="corrigir" alvo={alvo} className="rounded-md"><Botao variante="contorno">Corrigir</Botao></Aceso>
          </div>
        </>
      ) : (
        <>
          <Aceso nome="lembrar" alvo={alvo} className="flex items-center gap-1.5 rounded-lg border border-[#f0d48a] bg-[#fff8e1] px-2.5 py-1.5 text-[10px] text-[#5c4300]">
            <Pin aria-hidden className="h-3 w-3 shrink-0" /> Para lembrar: começar pelo jogo de encaixe
          </Aceso>
          <Aceso nome="texto" alvo={alvo} className="flex flex-col gap-1 rounded-lg">
            <span className="text-[10.5px] font-semibold">O que aconteceu na sessão</span>
            <span className="h-16 rounded-md border border-[#cfd9de] bg-white p-2 text-[10.5px] leading-snug text-[#52646d]">Trabalhamos o fonema /r/ com espelho…</span>
          </Aceso>
          <div className="mt-auto flex items-center justify-between gap-2">
            <Aceso nome="nao-aconteceu" alvo={alvo} className="rounded-md px-1 text-[10.5px] font-semibold text-[#127a7e]">A sessão não aconteceu</Aceso>
            <Aceso nome="salvar" alvo={alvo} className="rounded-md"><Botao>Salvar evolução</Botao></Aceso>
          </div>
        </>
      )}
    </Janela>
  );
}
