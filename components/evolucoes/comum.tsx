"use client"

// Peças das telas de evoluções: a data da sessão, os selos e o texto de uma evolução.
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useEvolucoes } from "@/context/EvolucoesContext";
import type { Evolucao } from "@/lib/evolucoes";

const semPonto = (texto: string) => texto.replace(/\.$/, "");

/** "26/09" */
export const diaEMes = (data: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(data);

/** "seg, 05/10 · 09:00" */
export const quandoFoi = (data: Date) =>
  `${semPonto(new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(data))}, ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(data)} · ${new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(data)}`;

export function SeloIncompativel() {
  return (
    <Badge className="gap-1 border-transparent bg-amber-100 text-amber-800 hover:bg-amber-100">
      <AlertTriangle className="h-3 w-3" />
      Incompatível com a recepção
    </Badge>
  );
}

export function SeloNaoAconteceu() {
  return <Badge className="border-transparent bg-gray-100 text-gray-700 hover:bg-gray-100">Não aconteceu</Badge>;
}

/** O alerta com o motivo, dentro da evolução. O terapeuta fica sabendo que a coordenação vai conferir. */
export function AlertaDeIncompatibilidade({ motivo, className }: { motivo: string; className?: string }) {
  const { escopo } = useEvolucoes();
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200", className)}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <span className="font-medium">Incompatível com a recepção.</span> {motivo}
        {escopo === "terapeuta" && " A coordenação vai conferir."}
      </p>
    </div>
  );
}

/** O texto da evolução, só para ler, com as quebras de linha de quem escreveu. */
export function TextoDaEvolucao({ evolucao }: { evolucao: Evolucao }) {
  if (!evolucao.aconteceu) {
    return <p className="text-sm text-muted-foreground">{evolucao.autorNome} informou que a sessão não aconteceu.</p>;
  }
  return <p className="whitespace-pre-wrap text-sm leading-relaxed">{evolucao.texto}</p>;
}

export function Confirmar({ aberto, titulo, texto, acao, perigo = false, onFechar, onConfirmar }: {
  aberto: boolean;
  titulo: string;
  texto: string;
  acao: string;
  perigo?: boolean;
  onFechar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <AlertDialog open={aberto} onOpenChange={(aberta) => !aberta && onFechar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar} className={cn(perigo && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}>
            {acao}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
