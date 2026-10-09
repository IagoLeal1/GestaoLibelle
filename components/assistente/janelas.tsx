"use client"

// As duas janelas da coordenação: "Mandar para a recepção" (o "Vamos com essa", com a data de início e
// um recado) e o "Não" com o motivo, que diz o que o assistente deixa de sugerir.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MotivoDoNao, OpcaoDeEncaixe } from "@/lib/encaixes";
import { inicioSugerido, nomeDoDia, primeiroNome } from "./comum";

/** "Theo · Fonoaudiologia com Ana Costa (terça 14:10, quinta 14:10) · mudar o Lucas" */
export const resumoDaOpcao = (crianca: string, opcao: OpcaoDeEncaixe) => {
  const porTerapia = new Map<string, string[]>();
  opcao.sessoes.forEach((s) => {
    const chave = `${s.terapia} com ${s.profissional.nome}`;
    porTerapia.set(chave, [...(porTerapia.get(chave) ?? []), `${nomeDoDia(s.dia)} ${s.horario}`]);
  });
  const terapias = [...porTerapia.entries()].map(([terapia, horarios]) => `${terapia} (${horarios.join(", ")})`);
  return [primeiroNome(crianca), ...terapias, ...(opcao.troca ? [`mudar ${primeiroNome(opcao.troca.paciente.nome)}`] : [])].join(" · ");
};

export function MandarParaRecepcao({
  crianca,
  opcao,
  onFechar,
  onMandar,
}: {
  crianca: string;
  opcao: OpcaoDeEncaixe | null;
  onFechar: () => void;
  onMandar: (dados: { comecaEm: string; recado: string }) => Promise<void>;
}) {
  const [comecaEm, setComecaEm] = useState("");
  const [recado, setRecado] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!opcao) return;
    setComecaEm(inicioSugerido(opcao));
    setRecado("");
  }, [opcao]);

  const mandar = async () => {
    setEnviando(true);
    try {
      await onMandar({ comecaEm, recado });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={!!opcao} onOpenChange={(aberta) => !aberta && onFechar()}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mandar para a recepção</DialogTitle>
          {opcao && <DialogDescription className="[overflow-wrap:anywhere]">{resumoDaOpcao(crianca, opcao)}</DialogDescription>}
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="comeca-em">Começa em</Label>
          <Input id="comeca-em" type="date" className="h-11" value={comecaEm} onChange={(e) => setComecaEm(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="recado">Recado para a recepção (opcional)</Label>
          <Textarea id="recado" rows={3} maxLength={1000} value={recado} onChange={(e) => setRecado(e.target.value)} />
        </div>
        <p className="rounded-lg bg-[#e8eef9] px-3 py-2.5 text-[13px] leading-relaxed text-[#1d3a73]">
          A recepção vê em <strong>Para agendar</strong>, com o número laranja no menu de Agendamentos.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="h-11" onClick={onFechar}>Cancelar</Button>
          <Button className="h-11 bg-[#127a7e] font-bold hover:bg-[#0d5c5f]" disabled={!comecaEm || enviando} onClick={mandar}>
            {enviando ? "Mandando..." : "Mandar para a recepção"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const MOTIVOS: { tipo: MotivoDoNao; titulo: (troca: string, crianca: string) => string; efeito: (troca: string, crianca: string) => string; soComTroca?: boolean }[] = [
  {
    tipo: "familia_da_troca", soComTroca: true,
    titulo: (troca) => `A família de ${troca} não aceita mudar`,
    efeito: (troca) => `O assistente para de sugerir mexer em ${troca}.`,
  },
  {
    tipo: "horario_ruim",
    titulo: (_, crianca) => `O horário é ruim para a família de ${crianca}`,
    efeito: (_, crianca) => `Esses horários saem das opções de ${crianca}.`,
  },
  {
    tipo: "terapeuta",
    titulo: () => "A terapeuta prefere não",
    efeito: (troca) => (troca ? "Essa troca não aparece de novo." : "Essa opção não aparece de novo."),
  },
  { tipo: "outro", titulo: () => "Outro motivo", efeito: () => "Essa opção não aparece de novo." },
];

export function DizerNao({
  crianca,
  opcao,
  onFechar,
  onSalvar,
}: {
  crianca: string;
  opcao: OpcaoDeEncaixe | null;
  onFechar: () => void;
  onSalvar: (dados: { motivo: MotivoDoNao; texto: string }) => Promise<void>;
}) {
  const [motivo, setMotivo] = useState<MotivoDoNao | null>(null);
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const troca = opcao?.troca ? primeiroNome(opcao.troca.paciente.nome) : "";
  const nome = primeiroNome(crianca);
  const motivos = MOTIVOS.filter((m) => !m.soComTroca || troca);

  useEffect(() => {
    setMotivo(null);
    setTexto("");
  }, [opcao]);

  const salvar = async () => {
    if (!motivo) return;
    setSalvando(true);
    try {
      await onSalvar({ motivo, texto });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={!!opcao} onOpenChange={(aberta) => !aberta && onFechar()}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Por que não essa opção?</DialogTitle>
          {opcao && <DialogDescription className="[overflow-wrap:anywhere]">{resumoDaOpcao(crianca, opcao)}</DialogDescription>}
        </DialogHeader>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Motivo</legend>
          {motivos.map((m) => (
            <label
              key={m.tipo}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3",
                motivo === m.tipo && "border-2 border-[#127a7e] bg-[#f3fbfb]"
              )}
            >
              <input
                type="radio"
                name="motivo"
                value={m.tipo}
                checked={motivo === m.tipo}
                onChange={() => setMotivo(m.tipo)}
                className="mt-1 h-4 w-4 accent-[#127a7e]"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold">{m.titulo(troca, nome)}</span>
                <span className="text-[13px] text-muted-foreground">{m.efeito(troca, nome)}</span>
              </span>
            </label>
          ))}
          <Label htmlFor="motivo-texto" className="sr-only">Escreva o motivo</Label>
          <Textarea
            id="motivo-texto"
            rows={2}
            maxLength={500}
            placeholder="Escreva aqui (opcional)"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </fieldset>
        <p className="rounded-lg bg-[#e8eef9] px-3 py-2.5 text-[13px] leading-relaxed text-[#1d3a73]">
          Fica guardado em <strong>Recusados</strong>. Mudou de ideia? Dá para desfazer por lá.
        </p>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="h-11" onClick={onFechar}>Cancelar</Button>
          <Button className="h-11 bg-[#127a7e] font-bold hover:bg-[#0d5c5f]" disabled={!motivo || salvando} onClick={salvar}>
            {salvando ? "Salvando..." : "Salvar e ver a próxima"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
