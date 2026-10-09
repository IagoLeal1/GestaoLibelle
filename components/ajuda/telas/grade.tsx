// Tela de exemplo: a grade da semana. A recepção agenda pela grade por paciente (escolhe a criança, toca
// num horário vazio, a janela Agendamento Rápido, Salvar Agenda); o terapeuta vê a semana dele.
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aceso, Botao, Caixa, Campo, Janela, Titulo } from "./base";

export const ALVOS_DA_GRADE = ["paciente", "horario", "adicionar", "salvar"];
export const ALVOS_DA_GRADE_DO_TERAPEUTA = ["dias", "semana"];

const DIAS = ["Seg 13", "Ter 14", "Qua 15", "Qui 16", "Sex 17"];
const HORAS = ["08:00", "09:00", "10:00"];
// Sessões já marcadas, por [dia, hora]
const MARCADAS: Record<string, { texto: string; cor: string }> = {
  "0-1": { texto: "Fono", cor: "bg-[#e3f4f4] text-[#127a7e]" },
  "2-0": { texto: "Psico", cor: "bg-[#fbe7ec] text-[#770c29]" },
  "3-2": { texto: "Pendente", cor: "border border-dashed border-[#e68b00] bg-[#fff3cf] text-[#7a5600]" },
};

export function TelaGrade({ alvo, terapeuta = false }: { alvo?: string; terapeuta?: boolean }) {
  return (
    <Janela>
      <div className="flex flex-wrap items-center gap-1.5">
        <Titulo>{terapeuta ? "Minha semana" : "Grade por paciente"}</Titulo>
        <Aceso nome="semana" alvo={alvo} className="ml-auto flex items-center gap-1 rounded-md border border-[#cfd9de] bg-white px-1.5 py-0.5 text-[10px] font-semibold">
          <ChevronLeft aria-hidden className="h-3 w-3" /> 13 a 17/10 <ChevronRight aria-hidden className="h-3 w-3" />
        </Aceso>
      </div>
      {!terapeuta && (
        <Aceso nome="paciente" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="Selecione o Paciente" valor="Lucas Souza ▾" /></Aceso>
      )}
      <Aceso nome="dias" alvo={alvo} className="grid grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] gap-1 rounded-lg text-center text-[9.5px] font-semibold text-[#52646d]">
        <span />
        {DIAS.map((d) => <span key={d}>{d}</span>)}
      </Aceso>
      <div className="grid grid-cols-[2.5rem_repeat(5,minmax(0,1fr))] gap-1 text-[9.5px]">
        {HORAS.map((h, hi) => (
          <div key={h} className="contents">
            <span className="flex items-center text-[#52646d]">{h}</span>
            {DIAS.map((d, di) => {
              const marcada = MARCADAS[`${di}-${hi}`];
              const vazio = !marcada && di === 1 && hi === 2;
              return vazio && !terapeuta ? (
                <Aceso key={d} nome="horario" alvo={alvo} className="flex h-7 items-center justify-center rounded-md border border-dashed border-[#1da7ac] bg-white text-[#127a7e]">
                  <Plus aria-hidden className="h-3 w-3" />
                </Aceso>
              ) : (
                <span key={d} className={cn("flex h-7 items-center justify-center rounded-md font-semibold", marcada ? marcada.cor : "bg-white")}>{marcada?.texto}</span>
              );
            })}
          </div>
        ))}
      </div>
      {!terapeuta && (
        <Aceso nome="salvar" alvo={alvo} className="mt-auto self-end rounded-md"><Botao>Salvar Agenda</Botao></Aceso>
      )}
      {alvo === "adicionar" && (
        <Caixa titulo="Agendamento Rápido">
          <span className="text-[10px] text-[#52646d]">Lucas Souza · Ter 14 · 10:00</span>
          <div className="grid grid-cols-2 gap-1.5">
            <Campo rotulo="Profissional" valor="Paula ▾" />
            <Campo rotulo="Especialidade" valor="Fono ▾" />
          </div>
          <Aceso nome="adicionar" alvo={alvo} className="self-end rounded-md"><Botao>Adicionar à Grade</Botao></Aceso>
        </Caixa>
      )}
    </Janela>
  );
}
