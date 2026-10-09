// O que as partes do assistente de encaixe usam juntas: os nomes dos dias, as datas de início e os
// links para agendar (Novo Agendamento já preenchido) e para abrir a agenda de um dia.
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { nomeDoDia, OpcaoDeEncaixe, SessaoDoEncaixe } from "@/lib/encaixes";
import { ORDEM_DOS_DIAS } from "@/lib/horariosRecorrentes";

export { nomeDoDia };

export const DIA_CURTO: Record<string, string> = { segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui", sexta: "Sex" };
const DIA_DO_CALENDARIO: Record<string, number> = { segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5 };

const meioDia = (iso: string) => new Date(`${iso}T12:00:00`);
const paraIso = (data: Date) => format(data, "yyyy-MM-dd");

/** A primeira data (aaaa-mm-dd), a partir de `desde`, que cai naquele dia da semana. */
export function primeiraData(desde: string, dia: string) {
  const data = meioDia(desde);
  while (data.getDay() !== DIA_DO_CALENDARIO[dia]) data.setDate(data.getDate() + 1);
  return paraIso(data);
}

/** O começo sugerido: a partir de amanhã, o primeiro dia da semana em que a opção tem sessão. */
export function inicioSugerido(opcao: OpcaoDeEncaixe, hoje = new Date()) {
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const datas = opcao.sessoes.map((s) => primeiraData(paraIso(amanha), s.dia));
  return datas.sort()[0] ?? paraIso(amanha);
}

/** "terça, 14/10" */
export const dataPorExtenso = (iso: string) => format(parseISO(iso), "EEEE, dd/MM", { locale: ptBR }).replace("-feira", "");

export const primeiroNome = (nome: string) => nome.split(" ")[0];

export const linkParaAgendar = (encaixeId: string, sessao: number) => `/agendamentos/novo?encaixe=${encaixeId}&sessao=${sessao}`;
export const linkDaAgenda = (data: string) => `/agendamentos?data=${data}`;

/** As sessões da opção agrupadas por dia, na ordem da semana. */
export const sessoesPorDia = (sessoes: SessaoDoEncaixe[]) =>
  ORDEM_DOS_DIAS.map((dia) => ({ dia, sessoes: sessoes.filter((s) => s.dia === dia) })).filter((d) => d.sessoes.length > 0);

export function Selo({ tipo, children }: { tipo: "livre" | "troca" | "preferida" | "falta" | "agendado"; children: React.ReactNode }) {
  const cores = {
    livre: "bg-[#e6f4ec] text-[#1f6b45]",
    troca: "bg-[#fff0d6] text-[#7a4600]",
    preferida: "bg-[#e3f4f4] text-[#0d5c5f]",
    falta: "bg-[#fff0d6] text-[#7a4600]",
    agendado: "bg-[#e6f4ec] text-[#1f6b45]",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", cores[tipo])}>{children}</span>;
}

export function Conferido({ ok = true, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <li className={cn("flex items-start gap-2 text-sm leading-snug", !ok && "text-[#8a5300]")}>
      {ok
        ? <Check aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#2e8b57]" strokeWidth={2.5} />
        : <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[#b86e00]" />}
      <span>{children}</span>
    </li>
  );
}
