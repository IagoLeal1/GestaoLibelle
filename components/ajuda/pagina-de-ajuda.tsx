"use client"

// A página de Ajuda (/ajuda), seguindo o desenho aprovado: a busca, "Comece por aqui" e todos os guias
// por assunto (sanfona no celular, cartões no computador). Cada papel vê os guias dele; o admin vê tudo
// e pode ver a ajuda como cada papel, para treinar a equipe.
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  NOME_DO_PAPEL, assuntosDoPapel, buscarGuias, comecePorAqui, ehPapel, guiasDoPapel, type Visao,
} from "@/lib/ajuda";
import { CartaoDoGuia, IconeDoAssunto } from "./comum";

const OPCOES_DO_ADMIN: { valor: Visao; rotulo: string }[] = [
  { valor: "tudo", rotulo: "Administrador (tudo)" },
  { valor: "coordenador", rotulo: "Coordenação" },
  { valor: "funcionario", rotulo: "Recepção" },
  { valor: "profissional", rotulo: "Terapeuta" },
  { valor: "familiar", rotulo: "Família" },
];

const Titulo = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h3 id={id} className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>
);

export function PaginaDeAjuda() {
  const { firestoreUser } = useAuth();
  const papel = firestoreUser?.profile.role;
  const ehAdmin = papel === "admin";
  const [visao, setVisao] = useState<Visao>(ehAdmin ? "tudo" : ehPapel(papel) ? papel : "familiar");
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const assuntos = useMemo(() => assuntosDoPapel(visao), [visao]);
  const resultados = useMemo(() => buscarGuias(guiasDoPapel(visao), termo), [visao, termo]);
  const buscando = termo.trim().length > 0;

  if (!ehAdmin && !ehPapel(papel)) return null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight">Como usar o Libelle</h2>
          {visao === "tudo" ? (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Você é <strong className="text-foreground">administrador</strong>: aqui estão os guias de todo o sistema, do jeito que cada pessoa vê.
            </p>
          ) : (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              Guias curtos, passo a passo, de tudo o que você pode fazer como <strong className="text-foreground">{NOME_DO_PAPEL[visao]}</strong>.
            </p>
          )}
        </div>
        {ehAdmin && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ver-ajuda-como" className="text-[13px] font-semibold text-muted-foreground">Ver a ajuda como</label>
            <select
              id="ver-ajuda-como"
              value={visao}
              onChange={(e) => setVisao(e.target.value as Visao)}
              className="h-10 min-w-[220px] rounded-[10px] border border-input bg-background px-3 text-base md:text-sm"
            >
              {OPCOES_DO_ADMIN.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="flex h-12 max-w-2xl items-center gap-2.5 rounded-xl border border-[#cfd9de] bg-background px-3.5 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
        <Search aria-hidden className="h-[18px] w-[18px] shrink-0" />
        <input
          type="search"
          aria-label="Buscar nos guias"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder={visao === "tudo" ? "O que você quer fazer? Ex.: renovar pacote, aprovar acesso" : "O que você quer fazer?"}
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:text-[15px]"
        />
      </div>

      {buscando ? (
        <section aria-label="Resultados da busca" className="space-y-2.5">
          {resultados.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-card p-4 text-[15px] text-muted-foreground">
              Nenhum guia encontrado para &ldquo;{termo.trim()}&rdquo;. Tente outra palavra, como &ldquo;agenda&rdquo; ou &ldquo;senha&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-2.5 md:grid-cols-2">
              {resultados.map((g) => <li key={g.id}><CartaoDoGuia guia={g} /></li>)}
            </ul>
          )}
        </section>
      ) : (
        <>
          {visao !== "tudo" && (
            <section aria-labelledby="comece-por-aqui" className="space-y-2.5">
              <Titulo id="comece-por-aqui">Comece por aqui</Titulo>
              <ul className="grid gap-2.5 md:grid-cols-3">
                {comecePorAqui(visao).map((g) => <li key={g.id}><CartaoDoGuia guia={g} /></li>)}
              </ul>
            </section>
          )}

          <section aria-labelledby="todos-os-guias" className="space-y-2.5">
            <Titulo id="todos-os-guias">Todos os guias</Titulo>

            {/* Celular: um assunto aberto por vez */}
            <div className="overflow-hidden rounded-[14px] border bg-card md:hidden">
              {assuntos.map(({ assunto, guias }, i) => {
                const expandido = aberto === assunto.id;
                return (
                  <div key={assunto.id} className={cn(i > 0 && "border-t")}>
                    <button
                      type="button"
                      aria-expanded={expandido}
                      onClick={() => setAberto(expandido ? null : assunto.id)}
                      className={cn("flex min-h-14 w-full items-center gap-3 px-4 text-left", expandido && "bg-[#f6fafb]")}
                    >
                      <span className="flex-1 text-[15px] font-semibold">{assunto.titulo}</span>
                      <span className="text-[13px] text-muted-foreground">{guias.length === 1 ? "1 guia" : `${guias.length} guias`}</span>
                      <ChevronDown aria-hidden className={cn("h-[18px] w-[18px] text-muted-foreground transition-transform", expandido && "rotate-180")} />
                    </button>
                    {expandido && (
                      <ul className="bg-[#f6fafb] px-4 pb-2.5">
                        {guias.map((g) => (
                          <li key={g.id}>
                            <Link href={`/ajuda/${g.id}`} className="flex min-h-11 items-center gap-2 py-2 text-[15px] leading-snug text-[#127a7e]">
                              <span className="flex-1">{g.titulo}</span>
                              <ChevronRight aria-hidden className="h-4 w-4" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Computador: um cartão por assunto, com todos os guias */}
            <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
              {assuntos.map(({ assunto, guias }) => (
                <section key={assunto.id} aria-label={assunto.titulo} className="flex flex-col gap-3 rounded-[14px] border bg-card p-[18px]">
                  <div className="flex items-center gap-2.5">
                    <IconeDoAssunto assunto={assunto.id} className="h-9 w-9" />
                    <h4 className="flex-1 text-[17px] font-bold">{assunto.titulo}</h4>
                    <span className="text-[13px] text-muted-foreground">{guias.length === 1 ? "1 guia" : `${guias.length} guias`}</span>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {guias.map((g) => (
                      <li key={g.id}>
                        <Link href={`/ajuda/${g.id}`} className="text-[#127a7e] hover:underline">{g.titulo}</Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>

          {visao !== "tudo" && (
            <p className="rounded-xl border border-dashed bg-card px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
              Não achou o que procurava? Pergunte para a equipe pelo{" "}
              <Link href="/mensagens" className="font-medium text-[#127a7e] hover:underline">Mensagens</Link>.
            </p>
          )}
        </>
      )}
    </div>
  );
}
