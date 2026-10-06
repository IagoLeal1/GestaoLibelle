"use client"

// O botão "Instalar app" do cabeçalho, só no celular (lib/instalarApp): no Android abre a janela de
// instalar do navegador; no iPhone (ou no Android sem essa janela), o passo a passo. Some com o × e
// quando o site já abre pelo ícone.
import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { EllipsisVertical, Share, Smartphone, SquarePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  abertoComoApp, assinarConvite, conviteAtual, dispensarAviso, foiDispensado, jeitoDeInstalar, usarConvite,
} from "@/lib/instalarApp";

// A oferta do navegador é guardada desde o carregamento do site (components/ouvir-instalacao, no app/layout)

const PASSOS = {
  iphone: {
    titulo: "Instale o Libelle no iPhone",
    descricao: "São 3 toques, no Safari.",
    passos: [
      { texto: <>Toque em <strong>Compartilhar</strong>. Se não aparecer, toque antes <span className="whitespace-nowrap">em <strong>⋯</strong></span></>, icone: Share },
      { texto: <>Escolha <strong>Adicionar à Tela de Início</strong></>, icone: SquarePlus },
      { texto: <>Toque em <strong>Adicionar</strong>. A libélula aparece junto com os seus apps.</> },
    ],
  },
  android: {
    titulo: "Instale o Libelle no celular",
    descricao: "São 3 toques, no Chrome.",
    passos: [
      { texto: <>Toque nos <strong>três pontinhos</strong> do navegador</>, icone: EllipsisVertical },
      { texto: <>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong></>, icone: SquarePlus },
      { texto: <>Confirme em <strong>Instalar</strong>. A libélula aparece junto com os seus apps.</> },
    ],
  },
};

export function BotaoInstalarApp() {
  const convite = useSyncExternalStore(assinarConvite, conviteAtual, () => null);
  // O aparelho só é conhecido no navegador: até montar, nada aparece (e o servidor não desenha o botão)
  const [montado, setMontado] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const [mostrarPassos, setMostrarPassos] = useState(false);

  useEffect(() => {
    setDispensado(foiDispensado());
    setMontado(true);
  }, []);

  if (!montado || dispensado) return null;
  const jeito = jeitoDeInstalar({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints ?? 0,
    abertoComoApp: abertoComoApp(),
    temConvite: !!convite,
  });
  if (!jeito) return null;

  const instalar = async () => {
    if (jeito !== "convite") {
      setMostrarPassos(true);
      return;
    }
    try {
      await usarConvite();
    } catch (e) {
      console.error("Erro ao abrir a instalação:", e);
    }
  };
  const naoMostrarMais = () => {
    dispensarAviso();
    setDispensado(true);
  };
  const guia = PASSOS[jeito === "iphone" ? "iphone" : "android"];

  return (
    <>
      <div className="flex h-9 items-center overflow-hidden rounded-full border border-primary-teal bg-white md:hidden">
        <button
          type="button"
          onClick={instalar}
          className="flex h-9 items-center gap-1.5 pl-3 pr-1.5 text-sm font-semibold text-[#127a7e]"
        >
          <Smartphone className="h-4 w-4" aria-hidden />
          Instalar app
        </button>
        <button
          type="button"
          aria-label="Não mostrar mais"
          onClick={naoMostrarMais}
          className="flex h-9 w-8 items-center justify-center border-l border-[#cdeced] text-muted-foreground"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      <Sheet open={mostrarPassos} onOpenChange={setMostrarPassos}>
        <SheetContent side="bottom" className="space-y-4 rounded-t-2xl px-5 pb-7 pt-3">
          <div aria-hidden className="mx-auto h-1 w-10 rounded-full bg-muted" />
          <SheetHeader className="flex-row items-center gap-3 space-y-0 text-left">
            <Image src="/icons/icone-192.png" alt="" width={44} height={44} className="rounded-lg border" />
            <div className="space-y-0.5">
              <SheetTitle className="text-lg font-bold">{guia.titulo}</SheetTitle>
              <SheetDescription>{guia.descricao}</SheetDescription>
            </div>
          </SheetHeader>

          <ol className="space-y-2.5">
            {guia.passos.map((passo, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e3f4f4] text-sm font-bold text-[#127a7e]">
                  {i + 1}
                </span>
                <p className="flex-1 text-[15px] leading-snug">{passo.texto}</p>
                {passo.icone && (
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <passo.icone className="h-5 w-5" />
                  </span>
                )}
              </li>
            ))}
          </ol>

          <Button className="h-12 w-full bg-[#127a7e] text-base hover:bg-[#0d5c5f]" onClick={() => setMostrarPassos(false)}>
            Entendi
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
