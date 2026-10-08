"use client"

// "Prontuários" no menu, seguindo o desenho aprovado: uma busca e a lista das crianças. O terapeuta vê
// as crianças da agenda dele (sem ler nada a mais do banco); a coordenação e o admin, todas as crianças
// ativas, com idade e responsável para não confundir nomes parecidos.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvolucoes } from "@/context/EvolucoesContext";
import { corDaTerapia } from "@/lib/coresDasTerapias";
import { criancasDoTerapeuta, idade } from "@/lib/prontuario";
import { getPatients } from "@/services/patientService";

type Crianca = { id: string; nome: string; href: string; detalhe: React.ReactNode };

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const iniciais = (nome: string) => nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");

/** A data de nascimento vem como texto (ficha) ou como data do banco (cadastros antigos). */
const textoDaData = (valor: unknown): string => {
  if (typeof valor === "string") return valor;
  const comoData = (valor as { toDate?: () => Date })?.toDate?.();
  return comoData ? comoData.toISOString().slice(0, 10) : "";
};

export function ListaDeProntuarios() {
  const { escopo, sessoes, carregando: carregandoAgenda } = useEvolucoes();
  const ehTerapeuta = escopo === "terapeuta";
  const [pacientes, setPacientes] = useState<Crianca[] | null>(null);
  const [erro, setErro] = useState(false);
  const [busca, setBusca] = useState("");

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

  const criancas: Crianca[] | null = useMemo(() => {
    if (!ehTerapeuta) return pacientes;
    return criancasDoTerapeuta(sessoes).map((c) => ({
      id: c.id,
      nome: c.nome,
      href: `/prontuario/${encodeURIComponent(c.id)}${c.terapias[0] ? `?terapia=${encodeURIComponent(c.terapias[0])}` : ""}`,
      detalhe: (
        <span className="flex flex-wrap gap-x-2">
          {c.terapias.map((t) => (
            <span key={t} className="inline-flex items-center gap-1">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: corDaTerapia(t) }} />
              {t}
            </span>
          ))}
        </span>
      ),
    }));
  }, [ehTerapeuta, pacientes, sessoes]);

  const termo = normalizar(busca);
  const visiveis = (criancas ?? []).filter((c) => !termo || normalizar(c.nome).includes(termo));
  const carregando = ehTerapeuta ? carregandoAgenda : criancas === null && !erro;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Prontuários</h2>
        <p className="text-muted-foreground">{ehTerapeuta ? "As crianças que você atende." : "Todas as crianças ativas da clínica."}</p>
      </div>

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
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : visiveis.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
          {termo ? "Nenhuma criança encontrada." : ehTerapeuta ? "As crianças que você atende aparecem aqui." : "Nenhuma criança ativa."}
        </p>
      ) : (
        <>
          <ul aria-label="Crianças" className="overflow-hidden rounded-2xl border bg-card">
            {visiveis.map((c) => (
              <li key={c.id} className="border-b last:border-b-0">
                <Link href={c.href} className="grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e3f4f4] text-xs font-bold text-[#127a7e]">
                    {iniciais(c.nome)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{c.nome}</span>
                    {c.detalhe && <span className="block truncate text-xs text-muted-foreground">{c.detalhe}</span>}
                  </span>
                  <ChevronRight aria-hidden className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
          {termo && <p className="text-sm text-muted-foreground">{visiveis.length} de {criancas?.length ?? 0} crianças</p>}
        </>
      )}
    </div>
  );
}
