// Tela de exemplo: o prontuário da criança (a faixa colorida com diagnóstico e equipe, as abas das
// terapias, Anotações | Evoluções, o "Para lembrar" e a folha de Nova anotação).
import { Pin, Plus } from "lucide-react";
import { Aceso, Botao, Chave, Janela } from "./base";

export const ALVOS_DO_PRONTUARIO = ["faixa", "abas", "partes", "lembrar", "nova", "escrever", "fixar"];

export function TelaProntuario({ alvo }: { alvo?: string }) {
  const escrevendo = alvo === "escrever" || alvo === "fixar";
  return (
    <Janela>
      <Aceso nome="faixa" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg bg-[#2f6f8f] p-2.5 text-white">
        <span className="text-[12.5px] font-bold">Theo Martins <span className="font-normal opacity-90">· 6 anos</span></span>
        <span className="flex flex-wrap gap-1">
          <span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-[#1c2b33]">TEA · F84.0</span>
          <span className="rounded-full border border-dashed border-white px-1.5 py-0.5 text-[9px] font-bold">TDAH · em investigação</span>
        </span>
      </Aceso>
      <Aceso nome="abas" alvo={alvo} className="flex gap-1.5 self-start rounded-full">
        <span className="flex items-center gap-1 rounded-full border border-[#b7133f] bg-[#fbe7ec] px-2 py-0.5 text-[10px] font-bold text-[#770c29]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#b7133f]" />Psicologia · sua
        </span>
        <span className="flex items-center gap-1 rounded-full border border-[#cfd9de] bg-white px-2 py-0.5 text-[10px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-[#1da7ac]" />Fonoaudiologia
        </span>
      </Aceso>
      <Aceso nome="partes" alvo={alvo} className="grid grid-cols-2 gap-0.5 rounded-lg bg-[#e2e9ed] p-0.5 text-center text-[10px]">
        <span className="rounded-md bg-white py-1 font-bold">Anotações</span>
        <span className="py-1 text-[#52646d]">Evoluções</span>
      </Aceso>
      <Aceso nome="lembrar" alvo={alvo} className="flex items-center gap-1.5 rounded-lg border border-[#f0d48a] bg-[#fff8e1] px-2.5 py-1.5 text-[10px] text-[#5c4300]">
        <Pin aria-hidden className="h-3 w-3 shrink-0" /> Para lembrar: avisar antes de trocar de atividade
      </Aceso>
      <Aceso nome="nova" alvo={alvo} className="mt-auto self-end rounded-full">
        <span className="flex h-7 items-center gap-1 rounded-full bg-[#127a7e] px-3 text-[10.5px] font-bold text-white"><Plus aria-hidden className="h-3 w-3" /> Nova anotação</span>
      </Aceso>

      {escrevendo && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 rounded-t-xl border-t bg-white p-3 shadow-[0_-8px_20px_rgba(0,0,0,0.12)]">
          <span className="text-[12px] font-bold">Nova anotação</span>
          <Aceso nome="escrever" alvo={alvo} className="flex flex-col gap-1 rounded-lg">
            <span className="text-[10.5px] font-semibold">O que você quer anotar?</span>
            <span className="h-12 rounded-md border border-[#cfd9de] p-2 text-[10px] text-[#52646d]">Objetivos, o que funciona com a criança…</span>
          </Aceso>
          <Aceso nome="fixar" alvo={alvo} className="flex items-center gap-2 self-start rounded-lg p-0.5 text-[10.5px]">
            <Chave ligada={alvo === "fixar"} /> Fixar em “Para lembrar”
          </Aceso>
          <Botao className="justify-center">Salvar anotação</Botao>
        </div>
      )}
    </Janela>
  );
}
