// Telas de exemplo do Financeiro (as abas, a Nova Movimentação, os repasses com "Marcar como Pago" e os
// relatórios) e do Comercial (o funil com os cartões das famílias interessadas).
import { Check, MoreHorizontal, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aceso, Botao, Caixa, Campo, Janela, Linha, Titulo } from "./base";

export const ALVOS_DO_FINANCEIRO = ["nova", "tipo", "campos", "salvar", "aba-despesas", "repasses", "acoes", "pago", "aba-relatorios", "fluxo"];

export function TelaFinanceiro({ alvo }: { alvo?: string }) {
  const formulario = alvo === "tipo" || alvo === "campos" || alvo === "salvar";
  const relatorios = alvo === "aba-relatorios" || alvo === "fluxo";
  const despesas = ["aba-despesas", "repasses", "acoes", "pago"].includes(alvo ?? "");
  const aba = relatorios ? "Relatórios" : despesas ? "Despesas" : "Visão Geral";
  return (
    <Janela>
      <div className="flex items-center">
        <Titulo>Financeiro</Titulo>
        <Aceso nome="nova" alvo={alvo} className="ml-auto rounded-md"><Botao>+ Nova Movimentação</Botao></Aceso>
      </div>
      <div className="flex gap-0.5 self-start rounded-full bg-[#e2e9ed] p-0.5 text-[9.5px]">
        {["Visão Geral", "Receitas", "Despesas", "Relatórios"].map((a) => {
          const pilula = <span className={cn("block rounded-full px-2 py-0.5", a === aba ? "bg-white font-bold" : "text-[#52646d]")}>{a}</span>;
          if (a === "Despesas") return <Aceso key={a} nome="aba-despesas" alvo={alvo} className="rounded-full">{pilula}</Aceso>;
          if (a === "Relatórios") return <Aceso key={a} nome="aba-relatorios" alvo={alvo} className="rounded-full">{pilula}</Aceso>;
          return <span key={a}>{pilula}</span>;
        })}
      </div>
      {relatorios ? (
        <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-semibold">
          <Aceso nome="fluxo" alvo={alvo} className="rounded-lg border border-[#dde5e9] bg-white p-2">Fluxo de Caixa</Aceso>
          <span className="rounded-lg border border-[#dde5e9] bg-white p-2">Contas a Pagar</span>
          <span className="rounded-lg border border-[#dde5e9] bg-white p-2">Contas a Receber</span>
          <span className="rounded-lg border border-[#dde5e9] bg-white p-2">Apuração de Resultados</span>
        </div>
      ) : despesas ? (
        <>
          <Aceso nome="repasses" alvo={alvo} className="flex gap-0.5 self-start rounded-md text-[9.5px]">
            <span className="rounded-md border bg-white px-2 py-0.5">Todas</span>
            <span className="rounded-md bg-[#127a7e] px-2 py-0.5 font-bold text-white">Apenas Repasses</span>
          </Aceso>
          <div className="relative">
            <Linha>
              <span className="flex flex-1 flex-col"><b>Repasse · Paula</b><span className="text-[#52646d]">08/10 · Pendente</span></span>
              <b className="text-[#9b3a1c]">− R$ 105,00</b>
              <Aceso nome="acoes" alvo={alvo} className="rounded"><MoreHorizontal aria-hidden className="h-3.5 w-3.5 text-[#52646d]" /></Aceso>
            </Linha>
            {(alvo === "acoes" || alvo === "pago") && (
              <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border bg-white p-1 text-[10.5px] shadow-lg">
                <Aceso nome="pago" alvo={alvo} className="rounded-md px-2 py-1">Marcar como Pago</Aceso>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            <span className="rounded-lg bg-[#e6f4ec] p-2 text-[10px] font-semibold text-[#1f6b45]">Receitas<b className="block text-[12px]">R$ 18.400</b></span>
            <span className="rounded-lg bg-[#fde9e3] p-2 text-[10px] font-semibold text-[#9b3a1c]">Despesas<b className="block text-[12px]">R$ 9.250</b></span>
            <span className="rounded-lg bg-[#e8eef9] p-2 text-[10px] font-semibold text-[#2f55a4]">Saldo<b className="block text-[12px]">R$ 9.150</b></span>
          </div>
          <Linha><span className="flex-1">Mensalidade · Lucas</span><b className="text-[#1f6b45]">+ R$ 600,00</b></Linha>
        </>
      )}
      {formulario && (
        <Caixa titulo="Nova Movimentação">
          <Aceso nome="tipo" alvo={alvo} className="flex gap-1 self-start rounded-md text-[10px]">
            <span className="rounded-md bg-[#1f6b45] px-2 py-0.5 font-bold text-white">Receita</span>
            <span className="rounded-md border px-2 py-0.5">Despesa</span>
          </Aceso>
          <Aceso nome="campos" alvo={alvo} className="grid grid-cols-2 gap-1.5 rounded-lg p-0.5">
            <Campo rotulo="Descrição" valor="Mensalidade · Lucas" />
            <Campo rotulo="Valor" valor="R$ 600,00" />
            <Campo rotulo="Plano de Contas" valor="Mensalidades ▾" />
            <Campo rotulo="Centro de Custo" valor="Clínica ▾" />
          </Aceso>
          <Aceso nome="salvar" alvo={alvo} className="flex items-center justify-between gap-2 rounded-md">
            <span className="rounded-md border px-2 py-1 text-[10px]">Status: Pago ▾</span>
            <Botao>Salvar Movimentação</Botao>
          </Aceso>
        </Caixa>
      )}
    </Janela>
  );
}

export const ALVOS_DO_COMERCIAL = ["novo", "campos", "salvar", "busca", "tarefas", "mover"];

export function TelaComercial({ alvo }: { alvo?: string }) {
  const criando = alvo === "campos" || alvo === "salvar";
  return (
    <Janela>
      <div className="flex items-center gap-1.5">
        <Titulo>Comercial</Titulo>
        <Aceso nome="busca" alvo={alvo} className="ml-auto flex h-7 items-center gap-1 rounded-md border border-[#cfd9de] bg-white px-2 text-[10px] text-[#52646d]">
          <Search aria-hidden className="h-3 w-3" /> Buscar
        </Aceso>
        <Aceso nome="novo" alvo={alvo} className="rounded-md"><Botao>+ Novo Paciente</Botao></Aceso>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-[9.5px]">
        {["Primeiro contato", "Avaliação", "Matrícula"].map((etapa, i) => (
          <div key={etapa} className="flex flex-col gap-1 rounded-lg bg-[#e2e9ed] p-1.5">
            <span className="font-bold text-[#37474f]">{etapa}</span>
            {i === 0 ? (
              <div className="flex flex-col gap-1 rounded-md bg-white p-1.5">
                <b className="text-[10px]">Família Rocha</b>
                <Aceso nome="tarefas" alvo={alvo} className="flex flex-col gap-0.5 rounded">
                  <span className="flex items-center gap-1"><Check aria-hidden className="h-3 w-3 text-[#1f6b45]" />Ligar</span>
                  <span className="flex items-center gap-1 text-[#52646d]"><span className="h-3 w-3 rounded border" />Marcar visita</span>
                </Aceso>
                <Aceso nome="mover" alvo={alvo} className="rounded"><span className="block rounded border px-1 py-0.5">Mover... ▾</span></Aceso>
              </div>
            ) : (
              <span className="rounded-md bg-white p-1.5 text-[#52646d]">{i === 1 ? "Família Lima" : "Família Souza"}</span>
            )}
          </div>
        ))}
      </div>
      {criando && (
        <Caixa titulo="Novo Paciente">
          <Aceso nome="campos" alvo={alvo} className="grid grid-cols-2 gap-1.5 rounded-lg p-0.5">
            <Campo rotulo="Nome do Paciente" valor="Davi Rocha" />
            <Campo rotulo="Contato (Telefone)" valor="(21) 97777-6666" />
            <Campo rotulo="Tipo de Fluxo" valor="Particular ▾" />
            <Campo rotulo="Evento de Origem" valor="Feira de saúde ▾" />
          </Aceso>
          <Aceso nome="salvar" alvo={alvo} className="self-end rounded-md"><Botao>Salvar</Botao></Aceso>
        </Caixa>
      )}
    </Janela>
  );
}
