"use client"

// Peças das telas de evoluções: os campos, a data da sessão, os selos e o texto de uma evolução.
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useEvolucoes } from "@/context/EvolucoesContext";
import type { Evolucao } from "@/lib/evolucoes";

export const CAMPOS = [
  { campo: "trabalhado", rotulo: "O que foi trabalhado", dica: "Atividades e objetivos da sessão" },
  { campo: "resposta", rotulo: "Como a criança respondeu", dica: "Participação, avanços e dificuldades" },
  { campo: "orientacao", rotulo: "Orientação para a família", dica: "O que treinar em casa" },
  { campo: "proximaSessao", rotulo: "Plano para a próxima sessão", dica: "O próximo passo" },
] as const;

export type CampoDeTexto = (typeof CAMPOS)[number]["campo"];

const semPonto = (texto: string) => texto.replace(/\.$/, "");

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

/** Os campos preenchidos da evolução, só para ler. */
export function TextoDaEvolucao({ evolucao }: { evolucao: Evolucao }) {
  if (!evolucao.aconteceu) {
    return <p className="text-sm text-muted-foreground">{evolucao.autorNome} informou que a sessão não aconteceu.</p>;
  }
  return (
    <dl className="space-y-3">
      {CAMPOS.filter(({ campo }) => evolucao[campo]).map(({ campo, rotulo }) => (
        <div key={campo}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo}</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-sm">{evolucao[campo]}</dd>
        </div>
      ))}
    </dl>
  );
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
