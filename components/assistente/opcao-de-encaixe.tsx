"use client"

// Uma opção de encaixe, como no desenho aprovado: os horários por dia, a troca (antes e depois) quando
// houver, o que foi conferido e os botões "Vamos com essa" e "Não".
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MINIMO_DE_SEMANAS_LIVRES, OpcaoDeEncaixe } from "@/lib/encaixes";
import { SEMANAS_ANALISADAS } from "@/lib/horariosRecorrentes";
import { Conferido, nomeDoDia, primeiroNome, Selo, sessoesPorDia } from "./comum";

const semanasLivres = (n: number) => (n >= SEMANAS_ANALISADAS ? `livre nas ${SEMANAS_ANALISADAS} semanas` : `livre em ${n} de ${SEMANAS_ANALISADAS} semanas`);

export function OpcaoDeEncaixeCartao({
  opcao,
  numero,
  crianca,
  comPreferencia,
  mandada,
  onSim,
  onNao,
}: {
  opcao: OpcaoDeEncaixe;
  numero: number;
  /** O nome da criança que procura horário. */
  crianca: string;
  /** A coordenação escolheu terapeutas de preferência. */
  comPreferencia: boolean;
  mandada: boolean;
  onSim: () => void;
  onNao: () => void;
}) {
  const { troca } = opcao;
  const preferida = opcao.sessoes.find((s) => s.preferida);
  const dia = troca ? nomeDoDia(troca.dia) : "";

  return (
    <article
      aria-label={`Opção ${numero}`}
      className={cn("flex flex-col gap-3.5 rounded-2xl border bg-card p-4 sm:p-[18px]", troca && "border-2 border-[#f0b45c]")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-bold text-[#52646d]">Opção {numero}</span>
        {troca ? <Selo tipo="troca">Com 1 troca</Selo> : <Selo tipo="livre">Tudo livre</Selo>}
        {preferida && <Selo tipo="preferida">com {primeiroNome(preferida.profissional.nome)}, de preferência</Selo>}
        <span className={cn("ml-auto text-[13px]", opcao.semanasLivres < SEMANAS_ANALISADAS ? "text-[#8a5300]" : "text-[#52646d]")}>
          {semanasLivres(opcao.semanasLivres)}
        </span>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {sessoesPorDia(opcao.sessoes).map(({ dia: d, sessoes }) => (
          <div key={d} className="flex flex-col gap-2 rounded-xl bg-[#f3f6f8] p-3">
            <strong className="text-sm capitalize">{nomeDoDia(d)}</strong>
            {sessoes.map((s) => (
              <span key={`${s.terapia}-${s.horario}`} className="text-sm">
                {s.horario} · {s.terapia} com <strong>{s.profissional.nome}</strong>{s.sala ? ` · ${s.sala.nome}` : ""}
              </span>
            ))}
          </div>
        ))}
      </div>

      {troca && (
        <div className="flex flex-col gap-3 rounded-xl border border-[#f3d9ad] bg-[#fffaf0] p-3.5">
          <strong className="text-[15px] text-[#5a3a00]">A troca: {troca.paciente.nome} muda de horário na mesma {dia}</strong>
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#52646d]">{troca.profissional.nome}, hoje</span>
              <span className="rounded-lg border border-[#e5d3b3] bg-white px-2.5 py-2">{troca.de} · {primeiroNome(troca.paciente.nome)}</span>
              <span className="rounded-lg border border-dashed border-[#cfd9de] bg-white px-2.5 py-2 text-[#52646d]">{troca.para} · livre</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-[#52646d]">Como fica</span>
              <span className="rounded-lg border border-[#a8d8d9] bg-[#e3f4f4] px-2.5 py-2"><strong>{troca.de} · {primeiroNome(crianca)}</strong> (novo)</span>
              <span className="rounded-lg border border-[#f0b45c] bg-[#fff0d6] px-2.5 py-2"><strong>{troca.para} · {primeiroNome(troca.paciente.nome)}</strong> (mudou)</span>
            </div>
          </div>
          <ul className="flex flex-col gap-1.5">
            <Conferido>{primeiroNome(troca.paciente.nome)} continua na {dia}, com a mesma terapeuta</Conferido>
            <Conferido>Fica emendado com {troca.emendaCom.terapia || "outra terapia"} das {troca.emendaCom.horario}</Conferido>
            {troca.sala && <Conferido>A {troca.sala.nome} está livre às {troca.para}</Conferido>}
            <Conferido ok={false}>Antes de agendar, a recepção confirma com a família de {primeiroNome(troca.paciente.nome)}</Conferido>
          </ul>
        </div>
      )}

      <ul className="flex flex-col gap-1.5">
        {!troca && <Conferido>Não mexe em nenhuma outra criança</Conferido>}
        {opcao.diasEmendados.map((d) => <Conferido key={d}>Emendadas na {nomeDoDia(d)}: a família vem uma vez só</Conferido>)}
        {comPreferencia && !preferida && <Conferido ok={false}>Não é a terapeuta de preferência</Conferido>}
        {opcao.semanasLivres < SEMANAS_ANALISADAS && opcao.semanasLivres >= MINIMO_DE_SEMANAS_LIVRES && (
          <Conferido ok={false}>Em {SEMANAS_ANALISADAS - opcao.semanasLivres} das {SEMANAS_ANALISADAS} semanas o horário já está ocupado</Conferido>
        )}
        {opcao.faltam.map((f) => (
          <Conferido key={f.terapia} ok={false}>
            {f.terapia}: {f.sessoes === 1 ? "faltou 1 sessão" : `faltaram ${f.sessoes} sessões`} na semana com a mesma terapeuta
          </Conferido>
        ))}
      </ul>

      {mandada ? (
        <p className="flex items-center gap-2 text-[15px] font-semibold text-[#1f6b45]">
          <Check aria-hidden className="h-5 w-5" /> Mandado para a recepção
        </p>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <Button className="h-11 gap-2 bg-[#127a7e] px-[18px] text-[15px] font-bold hover:bg-[#0d5c5f]" onClick={onSim}>
            <Check aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.5} /> Vamos com essa
          </Button>
          <Button variant="outline" className="h-11 px-[18px] text-[15px]" onClick={onNao}>Não</Button>
        </div>
      )}
    </article>
  );
}
