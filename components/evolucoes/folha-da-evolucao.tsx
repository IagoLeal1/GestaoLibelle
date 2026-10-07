"use client"

// A folha lateral de uma sessão: o terapeuta da sessão escreve a evolução (ou informa que a sessão
// não aconteceu) e corrige a dele; a coordenação e os outros terapeutas da criança só leem.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Pin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { incompatibilidade, type Evolucao, type SessaoDaAgenda } from "@/lib/evolucoes";
import { apagarEvolucao, corrigirEvolucao, escreverEvolucao, getEvolucao, getUltimaEvolucao } from "@/services/evolucaoService";
import { getParaLembrar } from "@/services/prontuarioService";
import type { Anotacao } from "@/lib/prontuario";
import { AlertaDeIncompatibilidade, Confirmar, diaEMes, quandoFoi, SeloNaoAconteceu, TextoDaEvolucao } from "./comum";

/** A sessão aberta: da agenda (para escrever) e/ou a evolução já gravada (para ler ou corrigir). */
export interface AlvoDaFolha {
  sessao?: SessaoDaAgenda;
  evolucao?: Evolucao;
}

const LIMITE = 8000;

export function FolhaDaEvolucao({ alvo, onFechar, onMudou }: { alvo: AlvoDaFolha | null; onFechar: () => void; onMudou?: () => void }) {
  const { firestoreUser } = useAuth();
  const { escopo, professionalId, marcar } = useEvolucoes();
  const [evolucao, setEvolucao] = useState<Evolucao | null>(null);
  const [ultima, setUltima] = useState<Evolucao | null>(null);
  const [lembrar, setLembrar] = useState<Anotacao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [texto, setTexto] = useState("");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [falta, setFalta] = useState(false);
  const [confirmar, setConfirmar] = useState<"nao_aconteceu" | "apagar" | null>(null);

  const sessao = alvo?.sessao;
  const patientId = sessao?.patientId ?? alvo?.evolucao?.patientId ?? "";
  const appointmentId = sessao?.id ?? alvo?.evolucao?.appointmentId ?? "";
  const dataDaSessao = sessao?.start ?? alvo?.evolucao?.dataDaSessao;
  const terapia = sessao?.tipo ?? alvo?.evolucao?.terapia ?? "";
  const minhaSessao = escopo === "terapeuta" && !!sessao && sessao.professionalId === professionalId;
  const souAutor = !!evolucao && evolucao.autorId === firestoreUser?.uid;
  const escrevendo = (minhaSessao && !evolucao && !carregando) || editando;

  useEffect(() => {
    setEvolucao(alvo?.evolucao ?? null);
    setUltima(null);
    setLembrar([]);
    setTexto("");
    setEditando(false);
    setFalta(false);
    if (!alvo) return;
    let ativo = true;
    const tarefas: Promise<unknown>[] = [];
    if (!alvo.evolucao && alvo.sessao?.evolucao) {
      tarefas.push(getEvolucao(alvo.sessao.patientId, alvo.sessao.id).then((e) => ativo && setEvolucao(e)));
    }
    if (alvo.sessao && escopo === "terapeuta" && alvo.sessao.professionalId === professionalId) {
      tarefas.push(
        getUltimaEvolucao(alvo.sessao.patientId, { terapia: alvo.sessao.tipo, antesDe: alvo.sessao.start })
          .then((e) => ativo && setUltima(e))
          .catch(() => undefined)
      );
      // O "Para lembrar" do prontuário daquela terapia, para ter à mão na hora de escrever
      tarefas.push(
        getParaLembrar(alvo.sessao.patientId, alvo.sessao.tipo)
          .then((lidas) => ativo && setLembrar(lidas))
          .catch(() => undefined)
      );
    }
    setCarregando(tarefas.length > 0);
    Promise.all(tarefas)
      .catch(() => toast.error("Não foi possível abrir a evolução. Tente de novo."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [alvo, escopo, professionalId]);

  const motivo = evolucao && sessao ? incompatibilidade(sessao, evolucao.aconteceu) : null;

  const autor = { uid: firestoreUser?.uid ?? "", nome: firestoreUser?.displayName ?? "" };

  async function salvar() {
    if (!texto.trim()) {
      setFalta(true);
      return;
    }
    setSalvando(true);
    try {
      if (evolucao) {
        await corrigirEvolucao(patientId, appointmentId, { aconteceu: true, texto });
        setEvolucao({ ...evolucao, texto: texto.trim(), aconteceu: true, editadoEm: new Date() });
        setEditando(false);
        toast.success("Evolução corrigida");
      } else {
        await escreverEvolucao(appointmentId, autor, { aconteceu: true, texto });
        toast.success("Evolução salva");
        onFechar();
      }
      marcar(appointmentId, "escrita");
      onMudou?.();
    } catch (e) {
      console.error("Erro ao salvar a evolução:", e);
      toast.error("Não foi possível salvar a evolução. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function naoAconteceu() {
    setConfirmar(null);
    setSalvando(true);
    try {
      await escreverEvolucao(appointmentId, autor, { aconteceu: false, texto: "" });
      marcar(appointmentId, "nao_aconteceu");
      onMudou?.();
      toast.success("Sessão marcada como não aconteceu");
      onFechar();
    } catch (e) {
      console.error("Erro ao informar que a sessão não aconteceu:", e);
      toast.error("Não foi possível salvar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  async function apagar() {
    setConfirmar(null);
    setSalvando(true);
    try {
      await apagarEvolucao(patientId, appointmentId);
      marcar(appointmentId, undefined);
      onMudou?.();
      toast.success(evolucao?.aconteceu ? "Evolução apagada" : "Pronto: a sessão voltou para a sua lista");
      onFechar();
    } catch (e) {
      console.error("Erro ao apagar a evolução:", e);
      toast.error("Não foi possível apagar. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  const corrigir = () => {
    if (!evolucao) return;
    setTexto(evolucao.texto);
    setEditando(true);
  };

  return (
    <>
      <Sheet open={alvo !== null} onOpenChange={(aberta) => !aberta && onFechar()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="text-xl leading-tight">{sessao?.patientName ?? alvo?.evolucao?.patientName}</SheetTitle>
            <SheetDescription>
              {/* Na sessão dele, o terapeuta não precisa ver o próprio nome */}
              {[terapia, dataDaSessao && quandoFoi(dataDaSessao), !minhaSessao && (sessao?.professionalName ?? alvo?.evolucao?.professionalName)]
                .filter(Boolean)
                .join(" · ")}
            </SheetDescription>
          </SheetHeader>
          {patientId && (
            <Link
              href={`/prontuario/${encodeURIComponent(patientId)}${terapia ? `?terapia=${encodeURIComponent(terapia)}` : ""}`}
              className="mt-2 inline-block text-sm font-semibold text-primary-teal hover:underline"
            >
              Abrir prontuário
            </Link>
          )}

          <div className="mt-6 space-y-5">
            {motivo && <AlertaDeIncompatibilidade motivo={motivo} />}

            {carregando ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : escrevendo ? (
              <>
                {lembrar.length > 0 && !editando && (
                  <section aria-label="Para lembrar" className="rounded-lg border border-[#f0d48a] bg-[#fff8e1] p-3 text-[#5c4300]">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"><Pin aria-hidden className="h-3.5 w-3.5" /> Para lembrar</p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-foreground">
                      {lembrar.map((a) => <li key={a.id} className="whitespace-pre-wrap">{a.texto}</li>)}
                    </ul>
                  </section>
                )}
                {ultima && !editando && (
                  <div className="rounded-lg bg-muted/60 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Última evolução · {diaEMes(ultima.dataDaSessao)}</p>
                    <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm">{ultima.texto}</p>
                  </div>
                )}
                {/* Um campo só, como no papel: a criança, a terapia e a data já vêm da agenda */}
                <div className="space-y-2">
                  <Label htmlFor="evolucao-texto" className="text-base font-semibold">
                    O que aconteceu na sessão
                  </Label>
                  <Textarea
                    id="evolucao-texto"
                    rows={12}
                    maxLength={LIMITE}
                    placeholder="Conte como foi a sessão: o que foi trabalhado, como a criança respondeu e o que orientar à família."
                    className="min-h-[260px] text-base leading-relaxed"
                    value={texto}
                    onChange={(e) => {
                      setTexto(e.target.value);
                      setFalta(false);
                    }}
                  />
                  {falta && <p className="text-sm text-destructive">Escreva o que aconteceu na sessão.</p>}
                </div>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row-reverse sm:justify-between">
                  <Button onClick={salvar} disabled={salvando} className="bg-primary-teal text-white hover:bg-primary-teal/90">
                    {salvando ? "Salvando..." : editando ? "Salvar correção" : "Salvar evolução"}
                  </Button>
                  {editando ? (
                    <Button variant="ghost" onClick={() => setEditando(false)} disabled={salvando}>
                      Cancelar
                    </Button>
                  ) : (
                    <Button variant="ghost" onClick={() => setConfirmar("nao_aconteceu")} disabled={salvando}>
                      A sessão não aconteceu
                    </Button>
                  )}
                </div>
              </>
            ) : evolucao ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {!evolucao.aconteceu && <SeloNaoAconteceu />}
                  <span>
                    Escrita por {evolucao.autorNome}
                    {evolucao.criadoEm && ` em ${quandoFoi(evolucao.criadoEm)}`}
                    {evolucao.editadoEm && ` · editada em ${quandoFoi(evolucao.editadoEm)}`}
                  </span>
                </div>
                <TextoDaEvolucao evolucao={evolucao} />
                {souAutor && (
                  <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-between">
                    {evolucao.aconteceu ? (
                      <Button variant="outline" onClick={corrigir}>Corrigir</Button>
                    ) : (
                      <Button variant="outline" onClick={corrigir}>Escrever a evolução</Button>
                    )}
                    <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmar("apagar")}>
                      {evolucao.aconteceu ? "Apagar evolução" : "Desfazer"}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Esta sessão ainda não tem evolução.</p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Confirmar
        aberto={confirmar === "nao_aconteceu"}
        titulo="A sessão não aconteceu?"
        texto="Ela sai da sua lista de evoluções para escrever. Se a recepção tiver marcado que a criança veio, a coordenação vai ver um alerta para conferir."
        acao="Não aconteceu"
        onFechar={() => setConfirmar(null)}
        onConfirmar={naoAconteceu}
      />
      <Confirmar
        aberto={confirmar === "apagar"}
        titulo={evolucao?.aconteceu ? "Apagar esta evolução?" : "Desfazer o \"não aconteceu\"?"}
        texto={evolucao?.aconteceu ? "O texto some e a sessão volta para a sua lista de evoluções para escrever." : "A sessão volta para a sua lista de evoluções para escrever."}
        acao={evolucao?.aconteceu ? "Apagar" : "Desfazer"}
        perigo={!!evolucao?.aconteceu}
        onFechar={() => setConfirmar(null)}
        onConfirmar={apagar}
      />
    </>
  );
}
