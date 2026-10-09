"use client"

// A página de Ajuda (/ajuda), seguindo o desenho aprovado: a faixa da clínica com a saudação, a busca e
// sugestões; "Comece por aqui" com a tela de exemplo de cada tarefa; e os assuntos, cada um abrindo a
// lista dos seus guias. Cada papel vê os guias dele; o admin vê tudo e pode ver a ajuda como cada papel,
// para treinar a equipe. Nada aqui lê o banco.
import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  NOME_DO_PAPEL, assuntosDoPapel, buscarGuias, comecePorAqui, duracaoDoGuia, ehPapel, guiasDoPapel, telaParaPasso,
  type Guia, type IdDoAssunto, type TelaDoPasso, type Visao,
} from "@/lib/ajuda";
import { CORES_DO_ASSUNTO, CartaoDoGuia, IconeDoAssunto } from "./comum";
import { MiniaturaDaTela } from "./telas";

const OPCOES_DO_ADMIN: { valor: Visao; rotulo: string }[] = [
  { valor: "tudo", rotulo: "Administrador (tudo)" },
  { valor: "coordenador", rotulo: "Coordenação" },
  { valor: "funcionario", rotulo: "Recepção" },
  { valor: "profissional", rotulo: "Terapeuta" },
  { valor: "familiar", rotulo: "Família" },
];

// O que cada papel mais procura: tocar preenche a busca
const SUGESTOES: Record<Visao, string[]> = {
  tudo: ["marcar sessão", "senha provisória", "ler evoluções"],
  admin: ["marcar sessão", "senha provisória", "ler evoluções"],
  coordenador: ["ler evoluções", "presença", "enviar aviso"],
  funcionario: ["marcar sessão", "presença", "renovar pacote"],
  profissional: ["escrever evolução", "prontuário", "instalar"],
  familiar: ["próximos atendimentos", "mensagens", "instalar"],
};

// A ilustração do alto: a tela que o papel mais usa, com o lugar de tocar aceso
const ILUSTRACAO: Record<Visao, TelaDoPasso> = {
  tudo: { id: "agenda", alvo: "novo" },
  admin: { id: "agenda", alvo: "novo" },
  coordenador: { id: "agenda", alvo: "status" },
  funcionario: { id: "agenda", alvo: "novo" },
  profissional: { id: "para-escrever", alvo: "item" },
  familiar: { id: "painel-da-familia", alvo: "falar" },
};

/** A primeira tela de exemplo do guia, com o lugar aceso, para o cartão. */
function telaDoCartao(guia: Guia): TelaDoPasso | null {
  return guia.passos.find((p) => p.tela?.alvo)?.tela ?? telaParaPasso(guia, 0);
}

function CartaoComTela({ guia, visao }: { guia: Guia; visao: Visao }) {
  const tela = telaDoCartao(guia);
  return (
    <Link href={`/ajuda/${guia.id}`} className="group flex h-full flex-col overflow-hidden rounded-[18px] border bg-card transition-shadow hover:shadow-md">
      <div className={cn("h-[136px] px-4 pt-3.5", tela ? "bg-[#eef3f6]" : CORES_DO_ASSUNTO[guia.assunto])}>
        {tela ? (
          <MiniaturaDaTela tela={tela} papel={visao} escala={0.6} className="h-full rounded-t-xl shadow-sm" />
        ) : (
          <div className="flex h-full items-center justify-center"><IconeDoAssunto assunto={guia.assunto} className="h-14 w-14 bg-white/60" /></div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-[16px] font-bold leading-snug group-hover:text-[#127a7e]">{guia.titulo}</span>
        <span className="text-[13px] text-muted-foreground">{duracaoDoGuia(guia)}</span>
      </div>
    </Link>
  );
}

export function PaginaDeAjuda() {
  const { firestoreUser } = useAuth();
  const papel = firestoreUser?.profile.role;
  const ehAdmin = papel === "admin";
  const [visao, setVisao] = useState<Visao>(ehAdmin ? "tudo" : ehPapel(papel) ? papel : "familiar");
  const [termo, setTermo] = useState("");
  const [assuntoAberto, setAssuntoAberto] = useState<IdDoAssunto | null>(null);

  const assuntos = useMemo(() => assuntosDoPapel(visao), [visao]);
  const resultados = useMemo(() => buscarGuias(guiasDoPapel(visao), termo), [visao, termo]);
  const buscando = termo.trim().length > 0;
  const aberto = assuntos.find((a) => a.assunto.id === assuntoAberto);
  const primeiroNome = firestoreUser?.displayName?.split(" ")[0];
  const ilustracao = ILUSTRACAO[visao];

  if (!ehAdmin && !ehPapel(papel)) return null;

  const mudarVisao = (nova: Visao) => {
    setVisao(nova);
    setAssuntoAberto(null);
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7">
      <section aria-label="Busca" className="relative overflow-hidden rounded-3xl bg-[#127a7e] p-5 text-white md:p-8">
        <div className={cn("grid gap-6", ilustracao && "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]")}>
          <div className="flex flex-col gap-4">
            <span className="text-xs font-extrabold tracking-[0.12em] text-[#bfe9ea]">AJUDA DO LIBELLE</span>
            <h2 className="text-[26px] font-extrabold leading-tight tracking-tight md:text-[32px]">
              {primeiroNome ? `Olá, ${primeiroNome}! O que você quer fazer hoje?` : "O que você quer fazer hoje?"}
            </h2>
            <p className="text-[15px] leading-relaxed text-[#e3f4f4]">
              {visao === "tudo" ? (
                <>Você é <strong className="text-white">administrador</strong>: aqui estão os guias de todo o sistema, cada um com a tela de exemplo de cada passo.</>
              ) : (
                <>Guias curtos, passo a passo, mostrando a tela de cada passo — do jeito que você usa, como <strong className="text-white">{NOME_DO_PAPEL[visao]}</strong>.</>
              )}
            </p>
            <label className="flex h-[52px] items-center gap-2.5 rounded-2xl bg-white px-4 text-muted-foreground shadow-[0_8px_24px_rgba(8,60,62,0.25)] focus-within:ring-2 focus-within:ring-[#ffb74d]">
              <Search aria-hidden className="h-5 w-5 shrink-0" />
              <input
                type="search"
                aria-label="Buscar nos guias"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar um guia"
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {SUGESTOES[visao].map((s) => (
                <button key={s} type="button" onClick={() => setTermo(s)} className="h-9 rounded-full bg-white/15 px-3.5 text-sm font-semibold text-white hover:bg-white/25">
                  {s}
                </button>
              ))}
            </div>
            {ehAdmin && (
              <div className="flex flex-wrap items-center gap-2 lg:absolute lg:right-8 lg:top-6">
                <label htmlFor="ver-ajuda-como" className="text-[13px] font-semibold text-[#e3f4f4]">Ver a ajuda como</label>
                <select
                  id="ver-ajuda-como"
                  value={visao}
                  onChange={(e) => mudarVisao(e.target.value as Visao)}
                  className="h-9 rounded-full border-0 bg-white px-3 text-sm font-bold text-[#127a7e]"
                >
                  {OPCOES_DO_ADMIN.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
                </select>
              </div>
            )}
          </div>
          {ilustracao && (
            <div aria-hidden className="hidden items-center justify-center pt-8 lg:flex">
              <MiniaturaDaTela tela={ilustracao} papel={visao} escala={0.85} className="h-[230px] w-[330px] -rotate-2 rounded-2xl bg-white p-2 shadow-[0_18px_40px_rgba(8,60,62,0.35)]" />
            </div>
          )}
        </div>
      </section>

      {buscando ? (
        <section aria-label="Resultados da busca" className="space-y-3">
          {resultados.length === 0 ? (
            <p className="rounded-2xl border border-dashed bg-card p-4 text-[15px] text-muted-foreground">
              Nenhum guia encontrado para &ldquo;{termo.trim()}&rdquo;. Tente outra palavra, como &ldquo;agenda&rdquo; ou &ldquo;senha&rdquo;.
            </p>
          ) : (
            <ul className="grid gap-2.5 md:grid-cols-2">
              {resultados.map((g) => <li key={g.id}><CartaoDoGuia guia={g} /></li>)}
            </ul>
          )}
        </section>
      ) : aberto ? (
        <section aria-label={aberto.assunto.titulo} className="space-y-4">
          <button type="button" onClick={() => setAssuntoAberto(null)} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-[#127a7e] hover:underline">
            <ChevronLeft aria-hidden className="h-4 w-4" /> Todos os assuntos
          </button>
          <div className="flex items-center gap-3">
            <IconeDoAssunto assunto={aberto.assunto.id} className="h-11 w-11" />
            <h3 className="text-xl font-extrabold">{aberto.assunto.titulo}</h3>
          </div>
          <ul className="grid gap-2.5 md:grid-cols-2">
            {aberto.guias.map((g) => <li key={g.id}><CartaoDoGuia guia={g} /></li>)}
          </ul>
        </section>
      ) : (
        <>
          <section aria-labelledby="comece-por-aqui" className="space-y-3.5">
            <h3 id="comece-por-aqui" className="text-[19px] font-extrabold">Comece por aqui</h3>
            {/* No celular, os cartões passam para o lado (com a pontinha do próximo aparecendo) */}
            <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
              {comecePorAqui(visao === "tudo" ? "admin" : visao).map((g) => (
                <li key={g.id} className="w-[78%] shrink-0 snap-start md:w-auto"><CartaoComTela guia={g} visao={visao} /></li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="todos-os-assuntos" className="space-y-3.5">
            <h3 id="todos-os-assuntos" className="text-[19px] font-extrabold">Todos os assuntos</h3>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {assuntos.map(({ assunto, guias }) => (
                <li key={assunto.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
                  <button type="button" onClick={() => setAssuntoAberto(assunto.id)} className="flex flex-col items-start gap-2.5 text-left md:flex-row md:items-center">
                    <IconeDoAssunto assunto={assunto.id} />
                    <span className="flex-1 text-[15px] font-bold leading-snug">{assunto.titulo}</span>
                    <span className="text-[12.5px] text-muted-foreground">{guias.length === 1 ? "1 guia" : `${guias.length} guias`}</span>
                  </button>
                  <ul className="hidden flex-col gap-1.5 text-sm md:flex">
                    {guias.slice(0, 3).map((g) => (
                      <li key={g.id}><Link href={`/ajuda/${g.id}`} className="text-[#127a7e] hover:underline">{g.titulo}</Link></li>
                    ))}
                  </ul>
                  {guias.length > 3 && (
                    <button type="button" onClick={() => setAssuntoAberto(assunto.id)} className="hidden items-center gap-0.5 self-start text-[13px] font-bold text-muted-foreground hover:text-[#127a7e] md:inline-flex">
                      Ver os {guias.length} guias <ChevronRight aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {visao !== "tudo" && (
            <Link href="/mensagens" className="flex items-center gap-3 rounded-2xl border border-dashed bg-card p-4 hover:bg-muted/30">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff3cf] text-[#7a5600]"><MessageCircle aria-hidden className="h-5 w-5" /></span>
              <span className="text-[15px] leading-snug">Ainda com dúvida? <strong className="text-[#127a7e]">Pergunte para a equipe pelo Mensagens</strong></span>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
