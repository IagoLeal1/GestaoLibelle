"use client"

// "Prontuários" no menu, seguindo o desenho aprovado (com mais cor): uma busca e as crianças em cartões,
// cada uma com a sua cor. O terapeuta vê as da agenda dele, com a próxima sessão e os números do topo
// (que também filtram), sem ler nada a mais do banco; a coordenação e o admin, todas as crianças ativas,
// separadas pela primeira letra, com idade e responsável para não confundir nomes parecidos.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format, isSameDay } from "date-fns";
import { ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { cn } from "@/lib/utils";
import { corDaCrianca, corDaTerapia, corEscura } from "@/lib/coresDasTerapias";
import { criancasNaAgenda, idade, resumoDaAgenda } from "@/lib/prontuario";
import { getPatients } from "@/services/patientService";
import { quandoFoi } from "@/components/evolucoes/comum";

type Crianca = { id: string; nome: string; href: string; detalhe?: React.ReactNode; quando?: string; terapias?: string[]; proxima?: Date };
type Recorte = "todas" | "hoje" | "semana";

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
const letraDe = (nome: string) => normalizar(nome).charAt(0).toUpperCase() || "#";

/** A data de nascimento vem como texto (ficha) ou como data do banco (cadastros antigos). */
const textoDaData = (valor: unknown): string => {
  if (typeof valor === "string") return valor;
  const comoData = (valor as { toDate?: () => Date })?.toDate?.();
  return comoData ? comoData.toISOString().slice(0, 10) : "";
};

function CartaoDaCrianca({ crianca }: { crianca: Crianca }) {
  return (
    <Link
      href={crianca.href}
      className="grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border bg-card p-3 transition-colors hover:bg-muted/30"
    >
      <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: corDaCrianca(crianca.id) }}>
        {iniciais(crianca.nome)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-bold">{crianca.nome}</span>
        {crianca.terapias && crianca.terapias.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {crianca.terapias.map((t) => {
              const cor = corDaTerapia(t);
              return (
                <span key={t} className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${cor}1f`, color: corEscura(cor) }}>
                  {t}
                </span>
              );
            })}
          </span>
        )}
        {crianca.detalhe && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{crianca.detalhe}</span>}
        {crianca.quando && <span className="mt-1 block text-xs font-semibold text-[#127a7e]">{crianca.quando}</span>}
      </span>
      <ChevronRight aria-hidden className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export function ListaDeProntuarios() {
  const { escopo, sessoes, agora, carregando: carregandoAgenda } = useEvolucoes();
  const ehTerapeuta = escopo === "terapeuta";
  const [pacientes, setPacientes] = useState<Crianca[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [recorte, setRecorte] = useState<Recorte>("todas");

  useEffect(() => {
    if (escopo !== "equipe") return;
    const hoje = new Date();
    getPatients("ativo")
      .then((lista) =>
        setPacientes(
          lista
            .map((p) => {
              const anos = idade(textoDaData(p.dataNascimento), hoje);
              const responsavel = p.responsavel?.nome;
              return {
                id: p.id,
                nome: p.fullName,
                href: `/prontuario/${encodeURIComponent(p.id)}`,
                detalhe: [anos, responsavel && `Resp.: ${responsavel}`].filter(Boolean).join(" · "),
              };
            })
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
        )
      )
      .catch((e) => {
        console.error("Erro ao carregar as crianças:", e);
        setErro(true);
      });
  }, [escopo]);

  const daAgenda: Crianca[] = useMemo(() => {
    if (!ehTerapeuta) return [];
    return criancasNaAgenda(sessoes, agora).map((c) => ({
      id: c.id,
      nome: c.nome,
      terapias: c.terapias,
      proxima: c.proxima,
      href: `/prontuario/${encodeURIComponent(c.id)}${c.terapias[0] ? `?terapia=${encodeURIComponent(c.terapias[0])}` : ""}`,
      quando: c.proxima
        ? isSameDay(c.proxima, agora)
          ? `Hoje às ${format(c.proxima, "HH:mm")}`
          : `Próxima: ${quandoFoi(c.proxima)}`
        : undefined,
    }));
  }, [ehTerapeuta, sessoes, agora]);

  const resumo = useMemo(() => (ehTerapeuta ? resumoDaAgenda(sessoes, agora) : null), [ehTerapeuta, sessoes, agora]);
  const criancas = ehTerapeuta ? daAgenda : pacientes;
  const termo = normalizar(busca);
  const semanaAte = useMemo(() => new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000), [agora]);
  const visiveis = (criancas ?? []).filter((c) => {
    if (termo && !normalizar(c.nome).includes(termo)) return false;
    if (recorte === "hoje") return !!c.proxima && isSameDay(c.proxima, agora);
    if (recorte === "semana") return !!c.proxima && c.proxima <= semanaAte;
    return true;
  });
  const carregando = ehTerapeuta ? carregandoAgenda : criancas === null && !erro;

  // Coordenação e admin: separadas pela primeira letra do nome
  const grupos = ehTerapeuta
    ? [{ letra: "", criancas: visiveis }]
    : [...visiveis.reduce((porLetra, c) => porLetra.set(letraDe(c.nome), [...(porLetra.get(letraDe(c.nome)) ?? []), c]), new Map<string, Crianca[]>())]
        .map(([letra, lista]) => ({ letra, criancas: lista }));

  const numeros: { id: Recorte; valor: number; rotulo: string; cor: string }[] = resumo
    ? [
        { id: "todas", valor: daAgenda.length, rotulo: "Crianças", cor: "bg-[#e3f4f4] text-[#0f6b6f]" },
        { id: "hoje", valor: resumo.hoje, rotulo: "Sessões hoje", cor: "bg-[#e8eef9] text-[#1d3a73]" },
        { id: "semana", valor: resumo.proximosDias, rotulo: "Próximos 7 dias", cor: "bg-[#fbf1df] text-[#7a5600]" },
      ]
    : [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Prontuários</h2>
        <p className="text-muted-foreground">
          {ehTerapeuta ? "As crianças que você atende." : pacientes ? `${pacientes.length} crianças ativas na clínica.` : "Todas as crianças ativas da clínica."}
        </p>
      </div>

      {ehTerapeuta && !carregando && (
        <div role="group" aria-label="Mostrar" className="grid grid-cols-3 gap-2">
          {numeros.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-pressed={recorte === n.id}
              aria-label={`${n.valor} ${n.rotulo}`}
              onClick={() => setRecorte(recorte === n.id && n.id !== "todas" ? "todas" : n.id)}
              className={cn("flex flex-col items-start rounded-2xl p-3 text-left", n.cor, recorte === n.id && n.id !== "todas" && "ring-2 ring-[#127a7e] ring-offset-1")}
            >
              <b className="text-2xl leading-tight tabular-nums">{n.valor}</b>
              <span className="text-xs font-semibold leading-tight">{n.rotulo}</span>
            </button>
          ))}
        </div>
      )}

      <label className="flex h-12 items-center gap-2.5 rounded-xl border border-[#cfd9de] bg-background px-3.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
        <Search aria-hidden className="h-[18px] w-[18px] shrink-0" />
        <input
          type="search"
          aria-label="Buscar criança"
          placeholder="Buscar criança"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none md:text-[15px]"
        />
      </label>

      {erro ? (
        <p className="text-sm text-destructive">Não foi possível carregar as crianças. Recarregue a página.</p>
      ) : carregando ? (
        <div className="space-y-2.5">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : visiveis.length === 0 ? (
        <p className="rounded-2xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          {termo
            ? "Nenhuma criança encontrada."
            : recorte === "hoje"
              ? "Nenhuma sessão hoje."
              : recorte === "semana"
                ? "Nenhuma sessão nos próximos 7 dias."
                : ehTerapeuta
                  ? "As crianças que você atende aparecem aqui."
                  : "Nenhuma criança ativa."}
        </p>
      ) : (
        <section aria-label="Crianças" className="flex flex-col gap-2.5">
          {grupos.map((g) => (
            <div key={g.letra || "todas"} className="flex flex-col gap-2.5">
              {g.letra && <h3 className="px-1 pt-1 text-sm font-extrabold tracking-wide text-[#127a7e]">{g.letra}</h3>}
              {g.criancas.map((c) => <CartaoDaCrianca key={c.id} crianca={c} />)}
            </div>
          ))}
          {termo && <p className="text-sm text-muted-foreground">{visiveis.length} de {criancas?.length ?? 0} crianças</p>}
        </section>
      )}
    </div>
  );
}
