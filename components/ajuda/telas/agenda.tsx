// Tela de exemplo: Agendamentos (as sessões do dia). Menus abrem quando o alvo é um item deles: o do
// "+ Novo Agendamento", o do status de uma sessão e o dos três pontinhos. O terapeuta vê do jeito dele:
// sem os botões da recepção, com "Minhas sessões | Clínica toda" e o link da semana na grade.
import { ChevronLeft, ChevronRight, Filter, MoreHorizontal } from "lucide-react";
import { Aceso, Botao, Janela, Linha, Titulo } from "./base";

export const ALVOS_DA_AGENDA = ["novo", "novo-unico", "relatorio", "renovacoes", "data", "filtros", "linha", "status", "acoes"];
export const ALVOS_DA_AGENDA_DO_TERAPEUTA = ["minhas", "data", "linha", "grade"];

const Status = ({ texto, cor }: { texto: string; cor: string }) => (
  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${cor}`}>{texto}</span>
);

export function TelaAgenda({ alvo, terapeuta = false }: { alvo?: string; terapeuta?: boolean }) {
  return (
    <Janela>
      <Titulo>Agendamentos</Titulo>
      {!terapeuta && (
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="relative">
            <Aceso nome="novo" alvo={alvo} className="rounded-md"><Botao>+ Novo Agendamento ▾</Botao></Aceso>
            {(alvo === "novo" || alvo === "novo-unico") && (
              <div className="absolute left-0 top-full z-10 mt-1 flex w-44 flex-col gap-0.5 rounded-lg border bg-white p-1 text-[10.5px] shadow-lg">
                <Aceso nome="novo-unico" alvo={alvo} className="rounded-md bg-[#e3f4f4] px-2 py-1.5 font-semibold text-[#127a7e]">Agendamento Único/Sequencial</Aceso>
                <span className="px-2 py-1.5 text-[#52646d]">Agendamento em Bloco</span>
              </div>
            )}
          </div>
          <Aceso nome="relatorio" alvo={alvo} className="rounded-md"><Botao variante="contorno">Exportar Relatório</Botao></Aceso>
          <Aceso nome="renovacoes" alvo={alvo} className="rounded-md"><Botao variante="amarelo">Renovações Pendentes</Botao></Aceso>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {terapeuta && (
          <Aceso nome="minhas" alvo={alvo} className="flex rounded-md bg-[#e2e9ed] p-0.5 text-[10px]">
            <span className="rounded bg-white px-2 py-0.5 font-semibold">Minhas sessões</span>
            <span className="px-2 py-0.5 text-[#52646d]">Clínica toda</span>
          </Aceso>
        )}
        <Aceso nome="data" alvo={alvo} className="flex items-center gap-1 rounded-md border border-[#cfd9de] bg-white px-1.5 py-0.5 text-[10px] font-semibold">
          <ChevronLeft aria-hidden className="h-3 w-3" /> qui, 09/10 <ChevronRight aria-hidden className="h-3 w-3" />
        </Aceso>
        {!terapeuta && (
          <Aceso nome="filtros" alvo={alvo} className="ml-auto flex items-center gap-1 rounded-md border border-[#cfd9de] bg-white px-2 py-0.5 text-[10px] font-semibold">
            <Filter aria-hidden className="h-3 w-3" /> Filtros
          </Aceso>
        )}
      </div>

      <div className="relative">
        <Aceso nome="linha" alvo={alvo} className="rounded-lg">
          <Linha>
            <span className="h-3 w-[3px] rounded bg-[#1da7ac]" />09:00 · Lucas Souza · Fono
            <span className="ml-auto"><Status texto="Finalizado" cor="bg-green-100 text-green-800" /></span>
            {!terapeuta && <Aceso nome="acoes" alvo={alvo} className="rounded"><MoreHorizontal aria-hidden className="h-3.5 w-3.5 text-[#52646d]" /></Aceso>}
          </Linha>
        </Aceso>
        {alvo === "acoes" && (
          <div className="absolute right-0 top-full z-10 mt-1 rounded-lg border bg-white p-1 text-[10.5px] shadow-lg">
            <span className="block rounded-md bg-[#e3f4f4] px-2 py-1 font-semibold text-[#127a7e]">Editar / Detalhes</span>
          </div>
        )}
      </div>
      <div className="relative">
        <Linha>
          <span className="h-3 w-[3px] rounded bg-[#b7133f]" />10:00 · Theo Martins · Psico
          {terapeuta
            ? <span className="ml-auto"><Status texto="Agendado" cor="bg-blue-100 text-blue-800" /></span>
            : <Aceso nome="status" alvo={alvo} className="ml-auto rounded-full"><Status texto="Agendado ▾" cor="bg-blue-100 text-blue-800" /></Aceso>}
        </Linha>
        {alvo === "status" && (
          <div className="absolute right-0 top-full z-10 mt-1 flex flex-col gap-0.5 rounded-lg border bg-white p-1 text-[10px] shadow-lg">
            {["Agendado", "Finalizado", "Não Compareceu", "Cancelado"].map((s) => <span key={s} className="rounded px-2 py-0.5">{s}</span>)}
          </div>
        )}
      </div>
      <Linha><span className="h-3 w-[3px] rounded bg-[#e68b00]" />11:00 · Bia Lima · T.O.<span className="ml-auto"><Status texto="Agendado" cor="bg-blue-100 text-blue-800" /></span></Linha>
      {terapeuta && <Aceso nome="grade" alvo={alvo} className="mt-auto self-start rounded-md px-1 text-[10.5px] font-semibold text-[#127a7e]">Ver minha semana na grade ›</Aceso>}
    </Janela>
  );
}
