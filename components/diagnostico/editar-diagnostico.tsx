"use client"

// A janela "Diagnóstico de <criança>", seguindo o desenho aprovado: cada diagnóstico com nome, CID
// (opcional) e situação; tirar e adicionar. Só a gestão e a recepção abrem (as regras de patients).
import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  LIMITE_DO_CID, LIMITE_DO_NOME, MAXIMO_DE_DIAGNOSTICOS, ROTULO_DA_SITUACAO,
  type Diagnostico, type SituacaoDoDiagnostico,
} from "@/lib/diagnostico";

type Linha = { chave: number; nome: string; cid: string; situacao: SituacaoDoDiagnostico };

interface Props {
  aberto: boolean;
  onFechar: () => void;
  nomeDaCrianca: string;
  inicial: Diagnostico[];
  onSalvar: (lista: Partial<Diagnostico>[]) => Promise<void>;
}

const SITUACOES: SituacaoDoDiagnostico[] = ["confirmado", "investigacao"];
const COR_DA_SITUACAO: Record<SituacaoDoDiagnostico, string> = {
  confirmado: "border-[#127a7e] bg-[#127a7e] text-white",
  investigacao: "border-[#b86f00] bg-[#b86f00] text-white",
};

export function EditarDiagnostico({ aberto, onFechar, nomeDaCrianca, inicial, onSalvar }: Props) {
  const proxima = useRef(0);
  const nova = (d?: Partial<Diagnostico>): Linha => ({
    chave: proxima.current++,
    nome: d?.nome ?? "",
    cid: d?.cid ?? "",
    situacao: d?.situacao ?? "confirmado",
  });
  const [linhas, setLinhas] = useState<Linha[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Cada vez que abre, começa do que está salvo (ou de uma linha vazia)
  useEffect(() => {
    if (!aberto) return;
    setLinhas(inicial.length > 0 ? inicial.map(nova) : [nova()]);
    setErro(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const mudar = (chave: number, campos: Partial<Linha>) => {
    setLinhas((atuais) => atuais.map((l) => (l.chave === chave ? { ...l, ...campos } : l)));
    setErro(null);
  };

  const salvar = async () => {
    // Tirar tudo de um diagnóstico já salvo vale (para corrigir); salvar vazio do zero, não
    if (!linhas.some((l) => l.nome.trim()) && inicial.length === 0) {
      setErro("Escreva pelo menos um diagnóstico.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await onSalvar(linhas.map(({ nome, cid, situacao }) => ({ nome, cid, situacao })));
      toast.success("Diagnóstico salvo");
      onFechar();
    } catch (e) {
      console.error("Erro ao salvar o diagnóstico:", e);
      setErro("Não foi possível salvar. Confira a internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent className="max-h-[90dvh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Diagnóstico de {nomeDaCrianca}</DialogTitle>
          <DialogDescription>Aparece no topo do prontuário e na ficha, para o admin, a coordenação, a recepção e os terapeutas.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {linhas.map((l, i) => (
            <fieldset key={l.chave} className="space-y-3 rounded-2xl border p-3.5">
              <legend className="px-1.5 text-xs font-extrabold uppercase tracking-wide text-[#127a7e]">Diagnóstico {i + 1}</legend>
              <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  Diagnóstico
                  <input
                    value={l.nome}
                    maxLength={LIMITE_DO_NOME}
                    onChange={(e) => mudar(l.chave, { nome: e.target.value })}
                    placeholder="Ex.: Transtorno do Espectro Autista (TEA)"
                    className="h-11 rounded-lg border border-[#cfd9de] bg-background px-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring md:text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-semibold">
                  CID (opcional)
                  <input
                    value={l.cid}
                    maxLength={LIMITE_DO_CID}
                    onChange={(e) => mudar(l.chave, { cid: e.target.value })}
                    placeholder="Ex.: F84.0"
                    className="h-11 rounded-lg border border-[#cfd9de] bg-background px-3 text-base font-normal uppercase outline-none focus:ring-2 focus:ring-ring md:text-sm"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div role="radiogroup" aria-label={`Situação do diagnóstico ${i + 1}`} className="flex flex-wrap gap-1.5">
                  {SITUACOES.map((s) => (
                    <label
                      key={s}
                      className={cn(
                        "flex h-10 cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-sm font-semibold focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
                        l.situacao === s ? COR_DA_SITUACAO[s] : "border-[#cfd9de] text-[#37474f] hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="radio"
                        name={`situacao-${l.chave}`}
                        checked={l.situacao === s}
                        onChange={() => mudar(l.chave, { situacao: s })}
                        className="sr-only"
                      />
                      {ROTULO_DA_SITUACAO[s]}
                    </label>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Tirar o diagnóstico ${i + 1}`}
                  onClick={() => setLinhas((atuais) => atuais.filter((x) => x.chave !== l.chave))}
                  className="text-muted-foreground hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </fieldset>
          ))}

          <Button
            type="button"
            variant="outline"
            disabled={linhas.length >= MAXIMO_DE_DIAGNOSTICOS}
            onClick={() => setLinhas((atuais) => [...atuais, nova()])}
            className="h-11 w-full border-[1.5px] border-dashed border-[#1da7ac] bg-[#f2fafa] font-bold text-[#127a7e] hover:bg-[#e3f4f4]"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Adicionar diagnóstico
          </Button>

          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando} className="bg-[#127a7e] hover:bg-[#0d5c5f]">
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar diagnóstico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
