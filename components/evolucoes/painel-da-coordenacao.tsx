"use client"

// As evoluções para a coordenação e o admin olharem quando quiserem, seguindo o desenho aprovado: números
// coloridos que também filtram, filtros de período, terapeuta, terapia e criança, a lista por dia e a
// leitura na própria tela, uma evolução atrás da outra. Ninguém valida nada aqui (lib/centralDeEvolucoes).
import { useEffect, useMemo, useRef, useState } from "react";
import { differenceInCalendarDays, differenceInCalendarMonths, format } from "date-fns";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { cn } from "@/lib/utils";
import { EVOLUCOES_DESDE, incompatibilidade, textoDoAtraso, type Evolucao, type SessaoDaAgenda } from "@/lib/evolucoes";
import {
  PERIODOS, SITUACOES, agruparPorDia, sessoesDaCentral, type Filtros, type Periodo, type SessaoNaCentral, type Situacao,
} from "@/lib/centralDeEvolucoes";
import { getAppointmentsForReport } from "@/services/appointmentService";
import { getEvolucao, getUltimaEvolucao, sessaoDaAgenda } from "@/services/evolucaoService";
import { getPatients } from "@/services/patientService";
import { FolhaDaEvolucao, type AlvoDaFolha } from "./folha-da-evolucao";
import { HistoriaDaCrianca } from "./historia-da-crianca";
import { AlertaDeIncompatibilidade, diaEMes, quandoFoi, TextoDaEvolucao } from "./comum";

// ——— Cores da clínica ———

const COR_DA_SITUACAO: Record<Situacao, string> = {
  escrita: "bg-[#e2f5ee] text-[#146b55]",
  pendente: "bg-[#fdf0dc] text-[#8a5200]",
  nao_bate: "bg-[#fbe7e1] text-[#9b3a1c]",
  nao_aconteceu: "bg-[#eceff1] text-[#4a5a61]",
};

const PALETA = ["#1da7ac", "#b7133f", "#e68b00", "#16375b", "#1dac8c", "#ff8d69"];
const normalizado = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const porHash = (texto: string) => PALETA[[...texto].reduce((soma, c) => soma + c.charCodeAt(0), 0) % PALETA.length];

/** Cada terapia com a sua cor, das cores da Casa Libelle. */
export function corDaTerapia(terapia: string) {
  const t = normalizado(terapia);
  if (t.includes("fono")) return "#1da7ac";
  if (t.includes("psicoped")) return "#16375b";
  if (t.includes("psico")) return "#b7133f";
  if (t.includes("ocupacional") || t === "to") return "#e68b00";
  if (t.includes("aba")) return "#1dac8c";
  return porHash(t);
}

const iniciais = (nome: string) =>
  nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
const primeiroNome = (nome: string) => nome.split(" ")[0];

function useTelaLarga() {
  const [larga, setLarga] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia?.("(min-width: 1024px)");
    if (!mql) return;
    const atualizar = () => setLarga(mql.matches);
    atualizar();
    mql.addEventListener?.("change", atualizar);
    return () => mql.removeEventListener?.("change", atualizar);
  }, []);
  return larga;
}

function SeloDaSituacao({ situacao }: { situacao: Situacao }) {
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold", COR_DA_SITUACAO[situacao])}>
      {SITUACOES.find((s) => s.id === situacao)?.curto}
    </span>
  );
}

const TODOS = "todos";

// ——— A leitura de uma sessão ———

type Lida = { evolucao: Evolucao | null; anterior: Evolucao | null };

function LeituraDaSessao({ sessao, posicao, total, agora, cache, onAnterior, onProxima }: {
  sessao: SessaoNaCentral;
  posicao: number;
  total: number;
  agora: Date;
  cache: React.MutableRefObject<Map<string, Lida>>;
  onAnterior: () => void;
  onProxima: () => void;
}) {
  const pendente = sessao.situacao === "pendente";
  const [lida, setLida] = useState<Lida | null>(() => cache.current.get(sessao.id) ?? null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    if (pendente) return;
    const guardada = cache.current.get(sessao.id);
    if (guardada) {
      setLida(guardada);
      return;
    }
    let ativo = true;
    setLida(null);
    setErro(false);
    (async () => {
      try {
        const evolucao = await getEvolucao(sessao.patientId, sessao.id);
        // A anterior da mesma terapia ajuda a ver a continuidade; só quando a sessão aconteceu
        const anterior = evolucao?.aconteceu
          ? await getUltimaEvolucao(sessao.patientId, { terapia: sessao.tipo, antesDe: sessao.start })
          : null;
        const resultado = { evolucao, anterior };
        cache.current.set(sessao.id, resultado);
        if (ativo) setLida(resultado);
      } catch (e) {
        console.error("Erro ao ler a evolução:", e);
        if (ativo) setErro(true);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [sessao, pendente, cache]);

  const motivo = sessao.situacao === "nao_bate" && sessao.evolucao ? incompatibilidade(sessao, sessao.evolucao === "escrita") : null;
  const atraso = differenceInCalendarDays(agora, sessao.start);

  return (
    <section aria-label="Leitura da evolução" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight">{sessao.patientName}</h3>
          <p className="text-sm text-muted-foreground">
            {quandoFoi(sessao.start)} · {sessao.tipo} · {sessao.professionalName}
          </p>
        </div>
        <SeloDaSituacao situacao={sessao.situacao} />
      </div>

      {motivo && <AlertaDeIncompatibilidade motivo={motivo} />}

      {pendente ? (
        <div className="rounded-xl bg-[#fdf0dc] p-3.5 text-sm text-[#8a5200]">
          <p className="font-semibold">Ainda sem evolução.</p>
          <p>{atraso <= 0 ? "A sessão foi hoje." : textoDoAtraso(atraso)}</p>
        </div>
      ) : erro ? (
        <p className="text-sm text-destructive">Não foi possível abrir a evolução. Tente de novo.</p>
      ) : !lida ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : !lida.evolucao ? (
        <p className="text-sm text-muted-foreground">A evolução desta sessão não foi encontrada.</p>
      ) : (
        <>
          <div className="rounded-xl border bg-[#fbfcfd] p-3.5">
            <TextoDaEvolucao evolucao={lida.evolucao} />
          </div>
          {lida.evolucao.criadoEm && (
            <p className="text-xs text-muted-foreground">
              Escrita em {diaEMes(lida.evolucao.criadoEm)}, às {format(lida.evolucao.criadoEm, "HH:mm")}, por {lida.evolucao.autorNome}
              {lida.evolucao.editadoEm && " · editada"}
            </p>
          )}
          {lida.anterior && (
            <div className="rounded-xl bg-muted/60 p-3 text-sm">
              <p className="font-semibold">Evolução anterior ({diaEMes(lida.anterior.dataDaSessao)})</p>
              <p className="line-clamp-3 whitespace-pre-wrap text-muted-foreground">{lida.anterior.texto}</p>
            </div>
          )}
        </>
      )}

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Button variant="outline" size="sm" onClick={onAnterior} disabled={posicao <= 1}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>
        <span className="text-xs text-muted-foreground">{posicao} de {total} nesta lista</span>
        <Button size="sm" onClick={onProxima} disabled={posicao >= total} className="bg-[#127a7e] hover:bg-[#0d5c5f]">
          Próxima <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

// ——— A página ———

export function PainelDaCoordenacao({ criancaInicial }: { criancaInicial?: string }) {
  const { carregando, erro, sessoes, agora, desde } = useEvolucoes();
  const telaLarga = useTelaLarga();
  const [filtros, setFiltros] = useState<Filtros>({ periodo: "7dias" });
  const [datas, setDatas] = useState({ de: format(EVOLUCOES_DESDE, "yyyy-MM-dd"), ate: format(new Date(), "yyyy-MM-dd") });
  const [sessoesDasDatas, setSessoesDasDatas] = useState<SessaoDaAgenda[] | null>(null);
  const [carregandoDatas, setCarregandoDatas] = useState(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const cache = useRef(new Map<string, Lida>());

  // História completa de uma criança (enquanto o prontuário não chega)
  const [criancas, setCriancas] = useState<{ id: string; nome: string }[]>([]);
  const [crianca, setCrianca] = useState(criancaInicial ?? "");
  const [alvo, setAlvo] = useState<AlvoDaFolha | null>(null);
  const [versao, setVersao] = useState(0);
  const historiaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPatients("ativo").then((lista) =>
      setCriancas(lista.map((p) => ({ id: p.id, nome: p.fullName })).sort((a, b) => a.nome.localeCompare(b.nome)))
    );
  }, []);
  useEffect(() => {
    if (criancaInicial) historiaRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [criancaInicial]);

  // "Escolher datas" pode ir além dos 14 dias que a página já tem: busca a agenda daquele período
  const deData = new Date(`${datas.de}T00:00`);
  const ateData = new Date(`${datas.ate}T00:00`);
  const datasValidas = !isNaN(deData.getTime()) && !isNaN(ateData.getTime()) && deData <= ateData;
  const longoDemais = datasValidas && differenceInCalendarMonths(ateData, deData) >= 3;
  useEffect(() => {
    if (filtros.periodo !== "datas" || !datasValidas || longoDemais) return;
    let ativo = true;
    setCarregandoDatas(true);
    getAppointmentsForReport({ startDate: deData, endDate: ateData })
      .then((lista) => ativo && setSessoesDasDatas(lista.map(sessaoDaAgenda)))
      .catch((e) => console.error("Erro ao buscar as sessões do período:", e))
      .finally(() => ativo && setCarregandoDatas(false));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.periodo, datas.de, datas.ate]);

  const usandoDatas = filtros.periodo === "datas";
  const base = usandoDatas ? sessoesDasDatas ?? [] : sessoes;
  const filtrosEfetivos: Filtros = usandoDatas && datasValidas ? { ...filtros, datas: { de: deData, ate: ateData } } : filtros;
  const central = useMemo(
    () => sessoesDaCentral(base, filtrosEfetivos, { agora, desde: EVOLUCOES_DESDE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [base, filtros, datas.de, datas.ate, agora, desde]
  );
  const dias = useMemo(() => agruparPorDia(central.lista), [central.lista]);
  const ordem = useMemo(() => dias.flatMap((d) => d.sessoes), [dias]);
  const posicao = ordem.findIndex((s) => s.id === selecionada);
  const aberta = posicao >= 0 ? ordem[posicao] : null;
  const ocupado = carregando || (usandoDatas && carregandoDatas);

  const mudar = (mudanca: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...mudanca }));
  const limpar = () => setFiltros((f) => ({ periodo: f.periodo }));
  const temFiltro = !!(filtros.terapeuta || filtros.terapia || filtros.situacao || filtros.busca);

  const leitura = aberta && (
    <LeituraDaSessao
      key={aberta.id}
      sessao={aberta}
      posicao={posicao + 1}
      total={ordem.length}
      agora={agora}
      cache={cache}
      onAnterior={() => posicao > 0 && setSelecionada(ordem[posicao - 1].id)}
      onProxima={() => posicao < ordem.length - 1 && setSelecionada(ordem[posicao + 1].id)}
    />
  );

  const seletores = (
    <>
      <Select value={filtros.terapeuta ?? TODOS} onValueChange={(v) => mudar({ terapeuta: v === TODOS ? undefined : v })}>
        <SelectTrigger aria-label="Terapeuta" className="md:w-[200px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Terapeuta: todos</SelectItem>
          {central.terapeutas.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filtros.terapia ?? TODOS} onValueChange={(v) => mudar({ terapia: v === TODOS ? undefined : v })}>
        <SelectTrigger aria-label="Terapia" className="md:w-[190px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Terapia: todas</SelectItem>
          {central.terapias.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={filtros.situacao ?? TODOS} onValueChange={(v) => mudar({ situacao: v === TODOS ? undefined : (v as Situacao) })}>
        <SelectTrigger aria-label="Situação" className="md:w-[200px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Situação: todas</SelectItem>
          {SITUACOES.map((s) => <SelectItem key={s.id} value={s.id}>{s.rotulo}</SelectItem>)}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Evoluções</h2>
          <p className="text-muted-foreground">Quem já escreveu, o que falta e o que cada um escreveu.</p>
        </div>
        <div role="group" aria-label="Período" className="flex flex-wrap gap-1.5">
          {PERIODOS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={filtros.periodo === p.id}
              onClick={() => mudar({ periodo: p.id as Periodo })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-semibold",
                filtros.periodo === p.id ? "border-[#127a7e] bg-[#127a7e] text-white" : "border-input bg-background hover:bg-muted/60"
              )}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {usandoDatas && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="evolucoes-de">De</Label>
            <input id="evolucoes-de" type="date" value={datas.de} min={format(EVOLUCOES_DESDE, "yyyy-MM-dd")} max={datas.ate}
              onChange={(e) => setDatas((d) => ({ ...d, de: e.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-base md:text-sm" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="evolucoes-ate">Até</Label>
            <input id="evolucoes-ate" type="date" value={datas.ate} min={datas.de} max={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setDatas((d) => ({ ...d, ate: e.target.value }))}
              className="h-10 rounded-md border border-input bg-background px-3 text-base md:text-sm" />
          </div>
          {longoDemais && <p className="text-sm text-[#9b3a1c]">Escolha no máximo 3 meses de cada vez.</p>}
        </div>
      )}

      {/* Os números: cada um também é um filtro */}
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:grid md:grid-cols-4 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {SITUACOES.map((s) => {
          const escolhido = filtros.situacao === s.id;
          const valor = central.contagem[s.id];
          const detalhe = s.id === "escrita" ? `${central.emDia}% das sessões em dia` : s.detalhe;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={escolhido}
              aria-label={`${valor} ${s.rotulo}: ${detalhe}`}
              onClick={() => mudar({ situacao: escolhido ? undefined : s.id })}
              className={cn(
                "flex min-w-[132px] flex-col items-start gap-0.5 rounded-2xl p-3 text-left transition-shadow md:min-w-0 md:p-4",
                COR_DA_SITUACAO[s.id],
                escolhido && "ring-2 ring-[#127a7e] ring-offset-1"
              )}
            >
              {ocupado ? <Skeleton className="h-7 w-10 bg-white/60" /> : <b className="text-2xl leading-tight tabular-nums">{valor}</b>}
              <span className="text-sm font-semibold leading-tight">{s.rotulo}</span>
              <span className="hidden text-xs opacity-90 md:block">{detalhe}</span>
            </button>
          );
        })}
      </div>

      {/* Filtros: no computador numa linha; no celular, a busca e um botão que abre o resto */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-card p-2.5">
        <label className="flex h-10 min-w-0 flex-1 basis-[150px] items-center md:basis-[220px] gap-2 rounded-lg border border-input px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
          <Search aria-hidden className="h-4 w-4 shrink-0" />
          <input
            type="search"
            aria-label="Buscar criança"
            placeholder="Buscar criança"
            value={filtros.busca ?? ""}
            onChange={(e) => mudar({ busca: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none md:text-sm"
          />
        </label>
        <div className="hidden flex-wrap gap-2 md:flex">{seletores}</div>
        <Button variant="outline" className="md:hidden" onClick={() => setFiltrosAbertos(true)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtros{temFiltro ? " •" : ""}
        </Button>
        {temFiltro && (
          <Button variant="ghost" className="hidden text-[#127a7e] md:inline-flex" onClick={limpar}>Limpar filtros</Button>
        )}
      </div>

      {erro && <p className="text-sm text-destructive">Não foi possível carregar as sessões. Recarregue a página.</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
        {/* A lista, por dia */}
        <div className="min-w-0 overflow-hidden rounded-2xl border bg-card">
          {ocupado ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : dias.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {temFiltro ? "Nenhuma sessão com esses filtros." : "Nenhuma sessão terminada neste período."}
            </p>
          ) : (
            <ul aria-label="Sessões">
              {dias.map(({ dia, sessoes: doDia }) => {
                const escritas = doDia.filter((s) => s.situacao !== "pendente").length;
                const pendentes = doDia.length - escritas;
                return (
                  <li key={dia.toISOString()}>
                    <p className="flex justify-between gap-2 border-b bg-muted/40 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                      <span>{quandoFoi(dia).split(" · ")[0]}</span>
                      <span className="normal-case tracking-normal">
                        {pendentes > 0 ? `${escritas} em dia · ${pendentes} ${pendentes === 1 ? "pendente" : "pendentes"}` : "todas em dia"}
                      </span>
                    </p>
                    <ul>
                      {doDia.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={() => setSelecionada(s.id)}
                            className={cn(
                              "grid w-full grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 border-b px-4 py-3 text-left hover:bg-muted/40 sm:grid-cols-[3rem_minmax(0,1fr)_auto]",
                              telaLarga && s.id === selecionada && "bg-[#f0fafa] shadow-[inset_3px_0_0_#127a7e]"
                            )}
                          >
                            <span className="text-sm font-bold tabular-nums">{format(s.start, "HH:mm")}</span>
                            <span className="min-w-0">
                              <span className="block truncate text-[15px] font-semibold">{s.patientName}</span>
                              <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: corDaTerapia(s.tipo) }} />
                                  {s.tipo}
                                </span>
                                · {primeiroNome(s.professionalName)}
                              </span>
                            </span>
                            <span className="col-start-2 sm:col-start-auto"><SeloDaSituacao situacao={s.situacao} /></span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-4">
          {telaLarga && (
            <Card>
              <CardContent className="p-4">
                {leitura ?? <p className="py-8 text-center text-sm text-muted-foreground">Toque numa sessão para ler a evolução.</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Por terapeuta</CardTitle>
              <p className="text-xs text-muted-foreground">Toque no nome para ver só as sessões dele.</p>
            </CardHeader>
            <CardContent className="space-y-1">
              {central.porTerapeuta.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma sessão neste período.</p>
              ) : (
                central.porTerapeuta.map((t) => {
                  const total = t.feitas + t.pendentes;
                  const escolhido = filtros.terapeuta === t.professionalId;
                  return (
                    <button
                      key={t.professionalId}
                      type="button"
                      aria-pressed={escolhido}
                      onClick={() => mudar({ terapeuta: escolhido ? undefined : t.professionalId })}
                      className={cn("grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-muted/40", escolhido && "bg-[#f0fafa] ring-1 ring-[#127a7e]")}
                    >
                      <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: porHash(t.professionalId) }}>
                        {iniciais(t.nome)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{t.nome}</span>
                        <span aria-hidden className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-muted">
                          <span className="bg-[#1dac8c]" style={{ width: `${(t.feitas / total) * 100}%` }} />
                          <span className="bg-[#e68b00]" style={{ width: `${(t.pendentes / total) * 100}%` }} />
                        </span>
                      </span>
                      {t.pendentes > 0 ? (
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", COR_DA_SITUACAO.pendente)}>
                          {t.pendentes} {t.pendentes === 1 ? "pendente" : "pendentes"}
                        </span>
                      ) : (
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", COR_DA_SITUACAO.escrita)}>Em dia</span>
                      )}
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* A história inteira de uma criança, de todas as terapias */}
      <div ref={historiaRef}>
        <Card className="min-w-0">
          <CardHeader className="space-y-3">
            <CardTitle>História de uma criança</CardTitle>
            <Label htmlFor="crianca-da-coordenacao" className="-mb-1 font-normal text-muted-foreground">Criança</Label>
            <Select value={crianca} onValueChange={setCrianca}>
              <SelectTrigger id="crianca-da-coordenacao"><SelectValue placeholder="Escolha a criança" /></SelectTrigger>
              <SelectContent>
                {criancas.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {crianca ? (
              <HistoriaDaCrianca patientId={crianca} versao={versao} onAbrir={setAlvo} />
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">Escolha uma criança para ver todas as evoluções dela, desde o começo.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Celular: a leitura abre numa folha por cima da lista */}
      {!telaLarga && (
        <Sheet open={!!aberta} onOpenChange={(aberto) => !aberto && setSelecionada(null)}>
          <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-2xl px-4 pb-6 pt-8">
            <SheetHeader className="sr-only"><SheetTitle>Evolução</SheetTitle></SheetHeader>
            {leitura}
          </SheetContent>
        </Sheet>
      )}

      {/* Celular: os filtros numa folha */}
      <Sheet open={filtrosAbertos} onOpenChange={setFiltrosAbertos}>
        <SheetContent side="bottom" className="space-y-3 rounded-t-2xl px-4 pb-6">
          <SheetHeader className="text-left"><SheetTitle>Filtros</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-2">{seletores}</div>
          <Button className="h-12 w-full bg-[#127a7e] text-base hover:bg-[#0d5c5f]" onClick={() => setFiltrosAbertos(false)}>
            Mostrar {central.lista.length} {central.lista.length === 1 ? "sessão" : "sessões"}
          </Button>
          {temFiltro && <Button variant="ghost" className="w-full text-[#127a7e]" onClick={limpar}>Limpar filtros</Button>}
        </SheetContent>
      </Sheet>

      <FolhaDaEvolucao alvo={alvo} onFechar={() => setAlvo(null)} onMudou={() => setVersao((v) => v + 1)} />
    </div>
  );
}
