"use client"

// "Para agendar": os encaixes que a coordenação escolheu. A recepção confirma a troca com a família,
// muda a sessão da outra criança na agenda e agenda cada sessão pelo Novo Agendamento, que já abre
// preenchido (com a recorrência semanal) e marca a sessão aqui. Excluir avisa que a sugestão pode voltar.
// "Recusados": os "Não" com o motivo, que dá para desfazer.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format, isToday, isYesterday } from "date-fns";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Timestamp } from "firebase/firestore";
import { MotivoDoNao } from "@/lib/encaixes";
import { Encaixe, excluirEncaixe, listarParaAgendar, listarRecusados } from "@/services/encaixeService";
import { dataPorExtenso, linkDaAgenda, linkParaAgendar, nomeDoDia, primeiraData, primeiroNome, Selo } from "./comum";
import { resumoDaOpcao } from "./janelas";

const quando = (momento?: Timestamp) => {
  if (!momento) return "agora";
  const data = momento.toDate();
  if (isToday(data)) return `hoje, ${format(data, "HH:mm")}`;
  if (isYesterday(data)) return `ontem, ${format(data, "HH:mm")}`;
  return format(data, "dd/MM");
};

function Carregando() {
  return <p className="rounded-2xl border bg-card p-5 text-[15px] text-muted-foreground">Carregando...</p>;
}

function ItemParaAgendar({ encaixe, onExcluir }: { encaixe: Encaixe; onExcluir: () => void }) {
  const { opcao, paciente } = encaixe;
  const agendado = encaixe.status === "agendado";
  const comecaEm = encaixe.comecaEm ?? "";
  const { troca } = opcao;
  const nome = primeiroNome(paciente.nome);

  return (
    <article aria-label={paciente.nome} className={`flex flex-col gap-3.5 rounded-2xl border p-4 sm:p-[18px] ${agendado ? "border-[#cfe6d8] bg-[#f7fbf8]" : "bg-card"}`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-lg font-bold">{paciente.nome}</h2>
        {agendado ? <Selo tipo="agendado"><Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />Agendado</Selo> : <Selo tipo="falta">Falta agendar</Selo>}
        {troca ? <Selo tipo="troca">Com 1 troca</Selo> : <Selo tipo="livre">Tudo livre</Selo>}
        <span className="text-[13px] text-muted-foreground sm:ml-auto">Escolhido por {encaixe.criadoPor.nome || "a coordenação"} · {quando(encaixe.criadoEm)}</span>
      </div>

      <div className="flex flex-wrap gap-2.5 text-sm">
        {comecaEm && <span className="rounded-lg bg-[#e3f4f4] px-2.5 py-1.5 text-[#0d5c5f]"><strong>Começa:</strong> {dataPorExtenso(comecaEm)}</span>}
        {encaixe.recado && (
          <span className="min-w-0 flex-[1_1_260px] rounded-lg bg-[#f3f6f8] px-2.5 py-1.5 [overflow-wrap:anywhere]">
            <strong>Recado da coordenação:</strong> {encaixe.recado}
          </span>
        )}
      </div>

      {agendado ? (
        <p className="text-sm text-[#1f6b45]">Todas as sessões foram agendadas{encaixe.agendadoEm ? ` em ${format(encaixe.agendadoEm.toDate(), "dd/MM")}` : ""}. Este item sai da lista sozinho em 7 dias.</p>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-xl bg-[#f3f6f8] p-3.5">
          <strong className="text-sm">O que falta fazer</strong>
          <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-[15px] leading-snug">
            {troca && (
              <>
                <li>Confirmar com a família de <strong>{troca.paciente.nome}</strong> a mudança de {troca.de} para {troca.para} na {nomeDoDia(troca.dia)}.</li>
                <li>
                  Mudar a sessão de {primeiroNome(troca.paciente.nome)} na agenda: abra a sessão das {troca.de} com {troca.profissional.nome},
                  mude para {troca.para} e salve em &quot;esta e as próximas&quot;.{" "}
                  {comecaEm && <Link className="font-semibold text-[#127a7e] underline-offset-2 hover:underline" href={linkDaAgenda(primeiraData(comecaEm, troca.dia))}>Abrir a agenda de {dataPorExtenso(primeiraData(comecaEm, troca.dia))}</Link>}
                </li>
              </>
            )}
            <li>
              Agendar {nome}: cada botão abre o Novo Agendamento já preenchido, com a recorrência semanal. É só conferir e salvar.
              <ul className="mt-2 flex flex-col gap-2">
                {opcao.sessoes.map((s, i) => {
                  const feita = !!encaixe.agendadas?.[i];
                  return (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-sm">
                        <strong>{s.terapia}</strong> com {s.profissional.nome} · toda {nomeDoDia(s.dia)} às {s.horario}
                        {comecaEm ? ` · a partir de ${format(new Date(`${primeiraData(comecaEm, s.dia)}T12:00:00`), "dd/MM")}` : ""}
                      </span>
                      {feita ? (
                        <span className="flex items-center gap-1 text-sm font-semibold text-[#1f6b45]"><Check aria-hidden className="h-4 w-4" /> Agendada</span>
                      ) : (
                        <Link
                          href={linkParaAgendar(encaixe.id, i)}
                          className="flex h-10 items-center rounded-lg bg-[#127a7e] px-3.5 text-sm font-bold text-white hover:bg-[#0d5c5f]"
                        >
                          Agendar
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          </ol>
        </div>
      )}

      {!agendado && (
        <div className="flex justify-end">
          <Button variant="ghost" className="h-11 gap-1.5 text-[15px] font-semibold text-[#b3261e] hover:text-[#b3261e]" onClick={onExcluir}>
            <Trash2 aria-hidden className="h-4 w-4" /> Excluir
          </Button>
        </div>
      )}
    </article>
  );
}

export function ParaAgendar({ onMudou }: { onMudou: () => void }) {
  const [encaixes, setEncaixes] = useState<Encaixe[] | null>(null);
  const [excluindo, setExcluindo] = useState<Encaixe | null>(null);

  const carregar = useCallback(() => {
    listarParaAgendar().then(setEncaixes).catch(() => {
      setEncaixes([]);
      toast.error("Não foi possível carregar os encaixes.");
    });
  }, []);
  useEffect(carregar, [carregar]);

  const excluir = async () => {
    if (!excluindo) return;
    try {
      await excluirEncaixe(excluindo.id);
      setEncaixes((atual) => atual?.filter((e) => e.id !== excluindo.id) ?? null);
      onMudou();
      toast.success("Encaixe excluído.");
    } catch {
      toast.error("Não foi possível excluir agora.");
    } finally {
      setExcluindo(null);
    }
  };

  if (!encaixes) return <Carregando />;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <p className="rounded-xl border bg-card px-3.5 py-3 text-[15px] leading-relaxed text-[#37474f]">
        Aqui chegam os encaixes que a <strong>coordenação</strong> escolheu. O assistente <strong>não agenda sozinho</strong>: a recepção confirma com as famílias e agenda pelo Novo Agendamento, como sempre.
      </p>
      {encaixes.length === 0 && <p className="rounded-2xl border border-dashed bg-card p-5 text-[15px] text-muted-foreground">Nada para agendar agora.</p>}
      {encaixes.map((encaixe) => <ItemParaAgendar key={encaixe.id} encaixe={encaixe} onExcluir={() => setExcluindo(encaixe)} />)}

      <AlertDialog open={!!excluindo} onOpenChange={(aberta) => !aberta && setExcluindo(null)}>
        <AlertDialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este encaixe?</AlertDialogTitle>
            <AlertDialogDescription className="[overflow-wrap:anywhere]">
              {excluindo && resumoDaOpcao(excluindo.paciente.nome, excluindo.opcao)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p role="alert" className="rounded-xl border border-[#f0c987] bg-[#fff4e0] px-3.5 py-3 text-sm leading-relaxed text-[#5a3a00]">
            O assistente pode <strong>sugerir esse encaixe de novo</strong> até a recepção agendar. Para ele parar de sugerir, use o botão <strong>Não</strong> e diga o motivo.
          </p>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-11">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="h-11 bg-[#b3261e] hover:bg-[#8f1d17]" onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const MOTIVO: Record<MotivoDoNao, (e: Encaixe) => string> = {
  familia_da_troca: (e) => `A família de ${e.opcao.troca ? primeiroNome(e.opcao.troca.paciente.nome) : "outra criança"} não aceita mudar`,
  horario_ruim: (e) => `O horário é ruim para a família de ${primeiroNome(e.paciente.nome)}`,
  terapeuta: () => "A terapeuta prefere não",
  outro: () => "Outro motivo",
};

export function Recusados() {
  const [recusados, setRecusados] = useState<Encaixe[] | null>(null);

  useEffect(() => {
    listarRecusados().then(setRecusados).catch(() => setRecusados([]));
  }, []);

  const desfazer = async (encaixe: Encaixe) => {
    try {
      await excluirEncaixe(encaixe.id);
      setRecusados((atual) => atual?.filter((e) => e.id !== encaixe.id) ?? null);
      toast.success("Desfeito: a sugestão pode voltar nas próximas buscas.");
    } catch {
      toast.error("Não foi possível desfazer agora.");
    }
  };

  if (!recusados) return <Carregando />;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-3">
      <p className="text-[15px] text-muted-foreground">As opções que receberam um &quot;Não&quot;. Enquanto estiverem aqui, o assistente não as sugere de novo.</p>
      {recusados.length === 0 && <p className="rounded-2xl border border-dashed bg-card p-5 text-[15px] text-muted-foreground">Nenhuma opção recusada.</p>}
      {recusados.map((e) => (
        <article key={e.id} aria-label={e.paciente.nome} className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold">{e.paciente.nome}</h2>
            <span className="text-[13px] text-muted-foreground sm:ml-auto">Recusado por {e.criadoPor.nome || "a coordenação"} · {quando(e.criadoEm)}</span>
          </div>
          <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{resumoDaOpcao(e.paciente.nome, e.opcao)}</p>
          <p className="text-[15px]">
            <strong>Motivo:</strong> {e.motivo ? MOTIVO[e.motivo.tipo](e) : "—"}{e.motivo?.texto ? ` · "${e.motivo.texto}"` : ""}
          </p>
          <div>
            <Button variant="outline" className="h-10" onClick={() => desfazer(e)}>Desfazer</Button>
          </div>
        </article>
      ))}
    </div>
  );
}
