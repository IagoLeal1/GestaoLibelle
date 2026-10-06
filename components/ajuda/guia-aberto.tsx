"use client"

// Um guia aberto (/ajuda/<id>), seguindo o desenho aprovado: os passos numerados com as miniaturas, a
// dica, o botão para a tela e o próximo guia. Guia de outro papel não abre (o admin abre todos).
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { ASSUNTOS, ehPapel, guiaPorId, podeVerGuia, proximoGuia, type Visao } from "@/lib/ajuda";
import { Miniatura, Texto } from "./comum";

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
  const proximo = proximoGuia(guia, visao);
  const relacionados = (guia.relacionados ?? [])
    .map(guiaPorId)
    .filter((g): g is NonNullable<typeof g> => !!g && podeVerGuia(g, visao) && g.id !== proximo?.id);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5">
      <Voltar assunto={assunto} />

      <div className="space-y-2">
        <h2 className="text-2xl font-bold leading-tight tracking-tight">{guia.titulo}</h2>
        <p className="text-[15px] leading-relaxed text-muted-foreground">{guia.resumo}</p>
      </div>

      <ol aria-label="Passos" className="flex flex-col gap-4">
        {guia.passos.map((passo, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#127a7e] text-sm font-bold text-white">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5 pt-1">
              <p className="text-base leading-relaxed"><Texto>{passo.texto}</Texto></p>
              {passo.mini && <Miniatura mini={passo.mini} />}
            </div>
          </li>
        ))}
      </ol>

      {guia.dica && (
        <div className="flex gap-3 rounded-xl bg-[#e8eef9] p-3.5 text-[#1d3a73]">
          <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-[15px] leading-relaxed"><Texto>{guia.dica}</Texto></p>
        </div>
      )}

      {relacionados.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">Veja também:</p>
          <ul className="space-y-1">
            {relacionados.map((g) => (
              <li key={g.id}>
                <Link href={`/ajuda/${g.id}`} className="text-[15px] font-medium text-[#127a7e] hover:underline">{g.titulo}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {guia.tela && (
        <Link
          href={guia.tela.href}
          className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#127a7e] text-base font-semibold text-white hover:bg-[#0d5c5f] md:self-start md:px-8"
        >
          {guia.tela.rotulo}
          <ArrowRight aria-hidden className="h-[18px] w-[18px]" />
        </Link>
      )}

      {proximo && (
        <Link href={`/ajuda/${proximo.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-3.5 hover:bg-muted/40">
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Próximo guia</span>
            <span className="text-[15px] font-semibold">{proximo.titulo}</span>
          </span>
          <ChevronRight aria-hidden className="h-[18px] w-[18px] text-muted-foreground" />
        </Link>
      )}
    </article>
  );
}
