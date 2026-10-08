"use client"

// O prontuário da criança (/prontuario/<criança>), seguindo o desenho aprovado: uma aba por terapia,
// o "Para lembrar" no topo, as anotações com data e a história das evoluções daquela terapia.
// Leem a equipe da criança, a coordenação e o admin; cada terapeuta escreve só na terapia dele, pode
// corrigir o que escreveu e ninguém apaga (lib/prontuario, firestore.rules).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Pin, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { cn } from "@/lib/utils";
import { useDemorando } from "@/hooks/use-demorando";
import { daTerapia, idade, minhaSessaoCom, paraLembrar, terapiasDoProntuario, type Anotacao } from "@/lib/prontuario";
import { corrigirAnotacao, escreverAnotacao, getAnotacoes } from "@/services/prontuarioService";
import { entrarNaEquipeDaCrianca } from "@/services/evolucaoService";
import { getPatientById } from "@/services/patientService";
import { FolhaDaEvolucao, type AlvoDaFolha } from "@/components/evolucoes/folha-da-evolucao";
import { HistoriaDaCrianca } from "@/components/evolucoes/historia-da-crianca";
import { diaEMes } from "@/components/evolucoes/comum";

const LIMITE = 8000;

/** A data de nascimento vem como texto (ficha) ou como data do banco (cadastros antigos). */
const textoDaData = (valor: unknown): string => {
  if (typeof valor === "string") return valor;
  const comoData = (valor as { toDate?: () => Date })?.toDate?.();
  return comoData ? comoData.toISOString().slice(0, 10) : "";
};

type Edicao = { anotacao: Anotacao | null; texto: string; fixada: boolean };

export function ProntuarioDaCrianca({ patientId, terapiaInicial }: { patientId: string; terapiaInicial?: string }) {
  const { firestoreUser } = useAuth();
  const { escopo, professionalId, sessoes } = useEvolucoes();
  const uid = firestoreUser?.uid;
  const ehTerapeuta = escopo === "terapeuta";

  const [crianca, setCrianca] = useState<{ nome: string; idade: string | null } | null>(null);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [terapiasDasEvolucoes, setTerapiasDasEvolucoes] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [semAcesso, setSemAcesso] = useState(false);
  const [erro, setErro] = useState(false);
  const [escolhida, setEscolhida] = useState<string | undefined>(terapiaInicial);
  const [parte, setParte] = useState<"anotacoes" | "evolucoes">("anotacoes");
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [faltaTexto, setFaltaTexto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alvo, setAlvo] = useState<AlvoDaFolha | null>(null);
  const [versao, setVersao] = useState(0);
  const [tentativa, setTentativa] = useState(0);
  const demorando = useDemorando(carregando);

  useEffect(() => {
    if (!uid) return;
    let ativo = true;
    setCarregando(true);
    setErro(false);
    setSemAcesso(false);
    (async () => {
      try {
        // O terapeuta entra na equipe da criança pela própria agenda; sem sessão com ela, não lê
        if (ehTerapeuta) {
          const atende = !!professionalId && (await entrarNaEquipeDaCrianca(uid, patientId, professionalId));
          if (!atende) {
            if (ativo) setSemAcesso(true);
            return;
          }
        }
        const [paciente, lidas] = await Promise.all([getPatientById(patientId), getAnotacoes(patientId)]);
        if (!ativo) return;
        setCrianca({ nome: paciente?.fullName ?? "Criança", idade: idade(textoDaData(paciente?.dataNascimento), new Date()) });
        setAnotacoes(lidas);
      } catch (e) {
        console.error("Erro ao abrir o prontuário:", e);
        if (ativo) setErro(true);
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [uid, patientId, ehTerapeuta, professionalId, tentativa]);

  const minhas = useMemo(
    () => (ehTerapeuta ? [...new Set(sessoes.filter((s) => s.patientId === patientId && s.status !== "cancelado").map((s) => s.tipo))] : []),
    [ehTerapeuta, sessoes, patientId]
  );
  const terapias = useMemo(
    () => terapiasDoProntuario({ anotacoes, evolucoes: terapiasDasEvolucoes.map((terapia) => ({ terapia })), minhas }),
    [anotacoes, terapiasDasEvolucoes, minhas]
  );
  const aba = terapias.find((t) => t.terapia === escolhida) ?? terapias[0];
  const terapia = aba?.terapia;
  const atendimentoId = aba?.minha && terapia ? minhaSessaoCom(sessoes, patientId, terapia) : undefined;
  const podeEscrever = !!atendimentoId;
  const lembrar = terapia ? paraLembrar(anotacoes, terapia) : [];
  const lista = terapia ? daTerapia(anotacoes, terapia) : [];

  const guardarTerapias = useCallback((lidas: string[]) => setTerapiasDasEvolucoes(lidas), []);

  const abrirEdicao = (anotacao: Anotacao | null) => {
    setFaltaTexto(false);
    setEdicao({ anotacao, texto: anotacao?.texto ?? "", fixada: anotacao?.fixada ?? false });
  };

  async function salvar() {
    if (!edicao || !terapia || !uid) return;
    if (!edicao.texto.trim()) {
      setFaltaTexto(true);
      return;
    }
    setSalvando(true);
    try {
      if (edicao.anotacao) {
        const { id } = edicao.anotacao;
        await corrigirAnotacao(patientId, id, { texto: edicao.texto, fixada: edicao.fixada });
        setAnotacoes((atuais) =>
          atuais.map((a) => (a.id === id ? { ...a, texto: edicao.texto.trim(), fixada: edicao.fixada, editadoEm: new Date() } : a))
        );
        toast.success("Anotação corrigida");
      } else if (atendimentoId) {
        const nova = await escreverAnotacao(patientId, { uid, nome: firestoreUser?.displayName ?? "" }, {
          terapia, texto: edicao.texto.trim(), fixada: edicao.fixada, atendimentoId,
        });
        setAnotacoes((atuais) => [nova, ...atuais]);
        toast.success("Anotação salva");
      }
      setEdicao(null);
    } catch (e) {
      console.error("Erro ao salvar a anotação:", e);
      toast.error("Não foi possível salvar a anotação. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  const voltar = (
    <Link href="/prontuario" className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[#127a7e] hover:underline">
      <ChevronLeft aria-hidden className="h-4 w-4" /> Prontuários
    </Link>
  );

  if (semAcesso || erro) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {voltar}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed bg-card p-4 text-[15px] text-muted-foreground">
          {semAcesso ? "Você só vê o prontuário das crianças que atende." : "Não foi possível abrir o prontuário. Confira a internet e tente de novo."}
          {erro && <Button variant="outline" size="sm" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</Button>}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-20 md:pb-0">
      {voltar}

      {carregando || !crianca ? (
        <div className="space-y-3">
          {demorando && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              <span>Está demorando… Confira a internet do aparelho.</span>
              <Button variant="outline" size="sm" onClick={() => setTentativa((n) => n + 1)}>Tentar de novo</Button>
            </div>
          )}
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{crianca.nome}</h2>
              <p className="text-sm text-muted-foreground">{crianca.idade ? `${crianca.idade} · prontuário` : "Prontuário"}</p>
            </div>
            {podeEscrever && (
              <Button
                onClick={() => abrirEdicao(null)}
                className="fixed bottom-5 right-4 z-10 h-12 rounded-full bg-[#127a7e] px-5 text-[15px] shadow-lg hover:bg-[#0d5c5f] md:static md:h-10 md:rounded-md md:shadow-none"
              >
                <Plus className="mr-1.5 h-4 w-4" /> Nova anotação
              </Button>
            )}
          </div>

          {terapias.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-card p-4 text-[15px] text-muted-foreground">
              Este prontuário ainda está vazio. As terapias aparecem aqui com as primeiras anotações e evoluções.
            </p>
          ) : (
            <>
              <div role="group" aria-label="Terapias" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {terapias.map((t) => (
                  <button
                    key={t.terapia}
                    type="button"
                    aria-pressed={t.terapia === terapia}
                    onClick={() => setEscolhida(t.terapia)}
                    className={cn(
                      "whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold",
                      t.terapia === terapia ? "border-[#127a7e] bg-[#127a7e] text-white" : "border-input bg-background hover:bg-muted/60"
                    )}
                  >
                    {t.terapia}
                    {t.minha && <span className="font-medium opacity-85"> · sua</span>}
                  </button>
                ))}
              </div>

              {lembrar.length > 0 && (
                <section aria-label="Para lembrar" className="rounded-2xl border border-[#f0d48a] bg-[#fff8e1] p-4 text-[#5c4300]">
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
                    <Pin aria-hidden className="h-3.5 w-3.5" /> Para lembrar
                  </h3>
                  <ul className="list-disc space-y-1.5 pl-5 text-[15px] text-foreground">
                    {lembrar.map((a) => <li key={a.id} className="whitespace-pre-wrap">{a.texto}</li>)}
                  </ul>
                </section>
              )}

              <div role="group" aria-label="O que mostrar" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                {(["anotacoes", "evolucoes"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={parte === p}
                    onClick={() => setParte(p)}
                    className={cn("rounded-lg py-2 text-sm font-semibold", parte === p ? "bg-background shadow-sm" : "text-muted-foreground")}
                  >
                    {p === "anotacoes" ? "Anotações" : "Evoluções"}
                  </button>
                ))}
              </div>

              {parte === "anotacoes" &&
                (lista.length === 0 ? (
                  <p className="rounded-xl border border-dashed bg-card p-5 text-center text-sm text-muted-foreground">
                    Nenhuma anotação nesta terapia ainda.{podeEscrever && " Toque em Nova anotação para escrever a primeira."}
                  </p>
                ) : (
                  <ul aria-label="Anotações" className="overflow-hidden rounded-2xl border bg-card">
                    {lista.map((a) => (
                      <li key={a.id} className="flex flex-col gap-1 border-b px-4 py-3 last:border-b-0">
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                          {a.criadoEm && diaEMes(a.criadoEm)} · {a.autorNome}
                          {a.editadoEm && <span className="rounded-full border px-1.5">editada</span>}
                          {a.fixada && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#fff8e1] px-1.5 text-[#5c4300]">
                              <Pin aria-hidden className="h-3 w-3" /> Para lembrar
                            </span>
                          )}
                        </span>
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{a.texto}</p>
                        {a.autorId === uid && (
                          <Button variant="link" className="h-auto self-start px-0 text-[#127a7e]" onClick={() => abrirEdicao(a)}>
                            Corrigir
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                ))}

            </>
          )}

          {/* Uma história só, sempre montada: ela também descobre as terapias que só têm evolução (as abas) */}
          <div hidden={parte !== "evolucoes" || terapias.length === 0}>
            <HistoriaDaCrianca patientId={patientId} versao={versao} onAbrir={setAlvo} terapia={terapia} onTerapias={guardarTerapias} equipeConferida />
          </div>
        </>
      )}

      <Sheet open={!!edicao} onOpenChange={(aberta) => !aberta && setEdicao(null)}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl px-4 pb-6">
          <SheetHeader className="text-left">
            <SheetTitle>{edicao?.anotacao ? "Corrigir anotação" : "Nova anotação"}</SheetTitle>
            <SheetDescription>{crianca?.nome} · {terapia}</SheetDescription>
          </SheetHeader>
          {edicao && (
            <div className="mx-auto mt-4 flex max-w-2xl flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="anotacao-texto" className="text-base font-semibold">O que você quer anotar?</Label>
                <Textarea
                  id="anotacao-texto"
                  rows={6}
                  maxLength={LIMITE}
                  placeholder="Objetivos, o que funciona com a criança, o que evitar, combinados com a família…"
                  className="min-h-[160px] text-base leading-relaxed"
                  value={edicao.texto}
                  onChange={(e) => {
                    setEdicao({ ...edicao, texto: e.target.value });
                    setFaltaTexto(false);
                  }}
                />
                {faltaTexto && <p className="text-sm text-destructive">Escreva a anotação.</p>}
              </div>
              <div className="flex items-center gap-3">
                <Switch id="anotacao-fixada" checked={edicao.fixada} onCheckedChange={(fixada) => setEdicao({ ...edicao, fixada })} />
                <Label htmlFor="anotacao-fixada" className="text-[15px]">Fixar em “Para lembrar”</Label>
              </div>
              <Button onClick={salvar} disabled={salvando} className="h-12 bg-[#127a7e] text-base hover:bg-[#0d5c5f]">
                {salvando ? "Salvando..." : edicao.anotacao ? "Salvar correção" : "Salvar anotação"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Depois de salva, você pode corrigir, mas não apagar.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <FolhaDaEvolucao alvo={alvo} onFechar={() => setAlvo(null)} onMudou={() => setVersao((v) => v + 1)} />
    </div>
  );
}
