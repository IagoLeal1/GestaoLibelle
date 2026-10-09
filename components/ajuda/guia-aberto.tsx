"use client"

// Um guia aberto (/ajuda/<id>), seguindo o desenho aprovado: os passos de um lado e, do outro, a tela de
// exemplo do passo escolhido, com o lugar de tocar aceso em laranja; Anterior e Próximo andam pelos
// passos (no celular, fixos embaixo). Guias que ainda não têm telas de exemplo mostram as miniaturas.
// Guia de outro papel não abre (o admin abre todos).
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  ASSUNTOS, duracaoDoGuia, ehPapel, guiaPorId, podeVerGuia, proximoGuia, telaParaPasso, temTelas, type Guia, type Visao,
} from "@/lib/ajuda";
import { CORES_DO_ASSUNTO, Miniatura, Texto } from "./comum";
import { TELAS, TelaAjustada } from "./telas";

function Voltar({ assunto }: { assunto?: string }) {
  return (
    <Link
      href="/ajuda"
      aria-label={assunto ? `Voltar para a Ajuda: ${assunto}` : "Voltar para a Ajuda"}
      className="inline-flex min-h-9 items-center gap-1 self-start text-sm font-semibold text-[#127a7e] hover:underline"
    >
      <ChevronLeft aria-hidden className="h-4 w-4" />
      {assunto ? `Ajuda · ${assunto}` : "Ajuda"}
    </Link>
  );
}

function Cabecalho({ guia, assunto }: { guia: Guia; assunto?: string }) {
  return (
    <div className="space-y-2.5">
      <h2 className="text-2xl font-bold leading-tight tracking-tight md:text-[28px]">{guia.titulo}</h2>
      <p className="text-[15px] leading-relaxed text-muted-foreground">{guia.resumo}</p>
      <div className="flex flex-wrap gap-2">
        {assunto && <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", CORES_DO_ASSUNTO[guia.assunto])}>{assunto}</span>}
        <span className="rounded-full border bg-card px-2.5 py-1 text-xs font-semibold text-[#37474f]">{duracaoDoGuia(guia)}</span>
      </div>
    </div>
  );
}

function Dica({ texto }: { texto: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-[#e8eef9] p-3.5 text-[#1d3a73]">
      <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-[15px] leading-relaxed"><Texto>{texto}</Texto></p>
    </div>
  );
}

function Rodape({ guia, visao }: { guia: Guia; visao: Visao }) {
  const proximo = proximoGuia(guia, visao);
  const relacionados = (guia.relacionados ?? [])
    .map(guiaPorId)
    .filter((g): g is Guia => !!g && podeVerGuia(g, visao) && g.id !== proximo?.id);
  return (
    <>
      {relacionados.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Veja também:</p>
          <ul className="space-y-1">
            {relacionados.map((g) => (
              <li key={g.id}><Link href={`/ajuda/${g.id}`} className="text-[15px] font-medium text-[#127a7e] hover:underline">{g.titulo}</Link></li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        {guia.tela && (
          <Link href={guia.tela.href} className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#127a7e] px-8 text-base font-semibold text-white hover:bg-[#0d5c5f]">
            {guia.tela.rotulo}
            <ArrowRight aria-hidden className="h-[18px] w-[18px]" />
          </Link>
        )}
        {proximo && (
          <Link href={`/ajuda/${proximo.id}`} className="flex flex-1 items-center gap-3 rounded-xl border bg-card p-3.5 hover:bg-muted/40 md:max-w-md">
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Próximo guia</span>
              <span className="text-[15px] font-semibold">{proximo.titulo}</span>
            </span>
            <ChevronRight aria-hidden className="h-[18px] w-[18px] text-muted-foreground" />
          </Link>
        )}
      </div>
    </>
  );
}

/** Os guias que já têm telas de exemplo: um passo por vez, com a tela dele ao lado. */
function GuiaComTelas({ guia, visao, assunto }: { guia: Guia; visao: Visao; assunto?: string }) {
  const [atual, setAtual] = useState(0);
  const total = guia.passos.length;
  const tela = telaParaPasso(guia, atual);
  const ultimo = atual === total - 1;

  return (
    <article className="mx-auto flex max-w-5xl flex-col gap-5 pb-24 md:pb-0">
      <Voltar assunto={assunto} />
      <Cabecalho guia={guia} assunto={assunto} />

      <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,500px)] md:gap-6">
        <div className="order-2 flex flex-col gap-4 md:order-1">
          <ol aria-label="Passos" className="flex flex-col gap-2">
            {guia.passos.map((passo, i) => {
              const feito = i < atual;
              const agora = i === atual;
              return (
                <li key={i}>
                  <button
                    type="button"
                    aria-current={agora ? "step" : undefined}
                    onClick={() => setAtual(i)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border bg-card p-3.5 text-left transition-colors hover:bg-muted/30",
                      agora && "border-2 border-[#127a7e] hover:bg-card"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
                        agora ? "bg-[#127a7e] text-white" : feito ? "bg-[#e6f4ec] text-[#1f6b45]" : "bg-[#eef3f6] text-[#52646d]"
                      )}
                    >
                      {feito ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="pt-0.5 text-[15px] leading-relaxed"><Texto>{passo.texto}</Texto></span>
                  </button>
                </li>
              );
            })}
          </ol>
          {guia.dica && <Dica texto={guia.dica} />}
        </div>

        <section aria-label="Tela de exemplo" className="order-1 overflow-hidden rounded-2xl border bg-card shadow-[0_12px_32px_rgba(28,43,51,0.08)] md:sticky md:top-4 md:order-2">
          <div className="flex h-9 items-center gap-1.5 border-b bg-[#f3f6f8] px-3">
            <span aria-hidden className="h-2 w-2 rounded-full bg-[#e57373]" />
            <span aria-hidden className="h-2 w-2 rounded-full bg-[#ffd54f]" />
            <span aria-hidden className="h-2 w-2 rounded-full bg-[#81c784]" />
            <span className="ml-2 truncate text-xs text-muted-foreground">Tela de exemplo{tela ? ` · ${TELAS[tela.id].titulo}` : ""}</span>
          </div>
          <div aria-hidden className="flex gap-1 px-3 pt-2.5">
            {guia.passos.map((_, i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full", i <= atual ? "bg-[#127a7e]" : "bg-[#dde5e9]")} />)}
          </div>
          <div className="p-2.5">
            {tela && <TelaAjustada tela={tela} papel={visao} />}
          </div>
          <div aria-live="polite" className="flex items-start gap-2.5 border-t bg-[#fffaf0] px-3.5 py-3">
            <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffb74d] text-xs font-extrabold text-[#5a3a00]">{atual + 1}</span>
            <p className="text-[15px] leading-snug text-[#4a3200]">
              <span className="sr-only">Passo {atual + 1} de {total}: </span>
              <Texto>{guia.passos[atual].texto}</Texto>
            </p>
          </div>
          <nav
            aria-label="Andar pelos passos"
            className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 border-t bg-white p-3 md:static md:flex md:justify-between"
          >
            <Button variant="outline" className="h-12 px-4 md:h-10" disabled={atual === 0} onClick={() => setAtual(atual - 1)}>
              <ChevronLeft aria-hidden className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <span className="hidden text-sm text-muted-foreground md:inline">Passo {atual + 1} de {total}</span>
            {ultimo ? (
              guia.tela ? (
                <Link href={guia.tela.href} className="flex h-12 items-center justify-center gap-1.5 rounded-md bg-[#127a7e] px-4 text-[15px] font-semibold text-white hover:bg-[#0d5c5f] md:h-10">
                  {guia.tela.rotulo} <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              ) : (
                <Button className="h-12 bg-[#127a7e] md:h-10" disabled>Fim do guia</Button>
              )
            ) : (
              <Button className="h-12 bg-[#127a7e] text-[15px] hover:bg-[#0d5c5f] md:h-10" onClick={() => setAtual(atual + 1)}>
                Próximo passo <ChevronRight aria-hidden className="ml-1 h-4 w-4" />
              </Button>
            )}
          </nav>
        </section>
      </div>

      <Rodape guia={guia} visao={visao} />
    </article>
  );
}

/** Os guias que ainda não têm telas de exemplo: os passos numerados com as miniaturas. */
function GuiaSemTelas({ guia, visao, assunto }: { guia: Guia; visao: Visao; assunto?: string }) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5">
      <Voltar assunto={assunto} />
      <Cabecalho guia={guia} assunto={assunto} />
      <ol aria-label="Passos" className="flex flex-col gap-4">
        {guia.passos.map((passo, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#127a7e] text-sm font-bold text-white">{i + 1}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
              <p className="text-base leading-relaxed"><Texto>{passo.texto}</Texto></p>
              {passo.mini && <Miniatura mini={passo.mini} />}
            </div>
          </li>
        ))}
      </ol>
      {guia.dica && <Dica texto={guia.dica} />}
      <Rodape guia={guia} visao={visao} />
    </article>
  );
}

export function GuiaAberto({ id }: { id: string }) {
  const { firestoreUser } = useAuth();
  const papel = firestoreUser?.profile.role;
  const visao: Visao | null = papel === "admin" ? "tudo" : ehPapel(papel) ? papel : null;
  const guia = guiaPorId(id);

  if (!guia || !visao || !podeVerGuia(guia, visao)) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Voltar />
        <p className="rounded-xl border border-dashed bg-card p-4 text-[15px] text-muted-foreground">
          {!guia ? "Este guia não existe." : "Este guia não é para o seu perfil."}
        </p>
      </div>
    );
  }

  const assunto = ASSUNTOS.find((a) => a.id === guia.assunto)?.titulo;
  return temTelas(guia)
    ? <GuiaComTelas key={guia.id} guia={guia} visao={visao} assunto={assunto} />
    : <GuiaSemTelas guia={guia} visao={visao} assunto={assunto} />;
}
