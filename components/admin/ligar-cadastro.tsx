"use client"

// O botão com o elo, em Gerenciar Usuários: liga na mão a conta de um profissional ao cadastro dele em
// Profissionais, para quando o cadastro foi feito com outro e-mail e outro CPF e a ligação automática
// (lib/ligarProfissional) não acha. Avisa quando o cadastro já é de outra conta ou a conta já usava outro.
import { useState } from "react";
import { AlertTriangle, Link2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { trocaDeCadastro, type ContaDoProfissional, type ContaListada, type TrocaDeCadastro } from "@/lib/ligarProfissional";
import { trocarCadastroDoProfissional } from "@/services/adminService";
import type { Professional } from "@/services/professionalService";

const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

interface Props {
  pessoa: ContaDoProfissional & { nome: string; email: string };
  cadastros: Professional[];
  contas: ContaListada[];
  onLigada: (professionalId: string, troca: TrocaDeCadastro) => void;
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex gap-2 rounded-lg border border-[#f3d27a] bg-[#fff8e1] p-3 text-sm text-[#6b4a00]">
      <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function BotaoLigarCadastro({ pessoa, cadastros, contas, onLigada }: Props) {
  const { toast } = useToast();
  const [aberta, setAberta] = useState(false);
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState<string>();
  const [salvando, setSalvando] = useState(false);

  const atual = cadastros.find((c) => c.userId === pessoa.uid) ?? cadastros.find((c) => c.id === pessoa.professionalId);
  const nomeDaConta = (uid: string) => contas.find((c) => c.uid === uid)?.nome ?? "outra conta";
  const termo = normalizar(busca);
  const visiveis = cadastros.filter((c) => !termo || normalizar(`${c.fullName} ${c.especialidade ?? ""} ${c.email ?? ""}`).includes(termo));
  const troca = escolhido ? trocaDeCadastro(pessoa, escolhido, cadastros, contas) : null;
  const nadaAMudar = !!escolhido && pessoa.professionalId === escolhido && cadastros.find((c) => c.id === escolhido)?.userId === pessoa.uid;
  const comAviso = !!troca?.outraConta || !!troca?.cadastroAnterior;

  const abrir = () => {
    setBusca("");
    setEscolhido(undefined);
    setAberta(true);
  };

  const ligar = async () => {
    if (!escolhido || !troca) return;
    setSalvando(true);
    const resultado = await trocarCadastroDoProfissional(pessoa.uid, escolhido, troca);
    setSalvando(false);
    if (!resultado.success) {
      toast({ title: "Falha ao ligar", description: resultado.error, variant: "destructive" });
      return;
    }
    onLigada(escolhido, troca);
    setAberta(false);
    toast({
      title: "Cadastro ligado",
      description: `${pessoa.nome} agora usa o cadastro "${cadastros.find((c) => c.id === escolhido)?.fullName}": já aparecem as sessões e dá para escrever as evoluções. Peça para fechar e abrir o app.`,
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label={`Cadastro de profissional de ${pessoa.nome}`}
        title="Ligar ao cadastro de profissional"
        className="bg-white text-gray-500 transition-colors hover:border-[#1da7ac] hover:bg-[#e3f4f4] hover:text-[#127a7e]"
        onClick={abrir}
      >
        <Link2 className="h-4 w-4" />
      </Button>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastro de profissional</DialogTitle>
            <DialogDescription className="break-words">{pessoa.nome} · {pessoa.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm">
              Hoje: {atual ? <strong>{atual.fullName}</strong> : <span className="text-muted-foreground">sem cadastro ligado</span>}
            </p>

            <label className="flex h-10 items-center gap-2 rounded-lg border border-[#cfd9de] px-3 text-muted-foreground focus-within:ring-2 focus-within:ring-ring">
              <Search aria-hidden className="h-4 w-4 shrink-0" />
              <input
                type="search"
                aria-label="Buscar profissional"
                placeholder="Buscar pelo nome, terapia ou e-mail"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none md:text-sm"
              />
            </label>

            <div role="radiogroup" aria-label="Cadastros de profissional" className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {visiveis.map((c) => {
                const deOutra = !!c.userId && c.userId !== pessoa.uid;
                const desta = c.id === atual?.id;
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition-colors",
                      escolhido === c.id ? "border-[#1da7ac] bg-[#e3f4f4]" : "hover:bg-muted/40"
                    )}
                  >
                    <input
                      type="radio"
                      name="cadastro-de-profissional"
                      value={c.id}
                      checked={escolhido === c.id}
                      onChange={() => setEscolhido(c.id)}
                      className="mt-1 accent-[#127a7e]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{c.fullName}</span>
                      <span className="block truncate text-xs text-muted-foreground">{[c.especialidade, c.email].filter(Boolean).join(" · ")}</span>
                      {deOutra && <span className="mt-0.5 block text-xs font-medium text-amber-700">Ligado a {nomeDaConta(c.userId!)}</span>}
                      {desta && <span className="mt-0.5 block text-xs font-medium text-[#127a7e]">Ligado a esta conta hoje</span>}
                    </span>
                  </label>
                );
              })}
              {visiveis.length === 0 && <p className="p-3 text-center text-sm text-muted-foreground">Nenhum cadastro encontrado.</p>}
            </div>

            {troca?.outraConta && (
              <Aviso>
                Este cadastro já está ligado à conta de <strong>{troca.outraConta.nome}</strong>. Ao ligar aqui, essa conta deixa de ver as sessões dele.
              </Aviso>
            )}
            {troca?.cadastroAnterior && (
              <Aviso>
                {pessoa.nome} já usa o cadastro <strong>{troca.cadastroAnterior.nome}</strong>. Ao trocar, deixa de ver as sessões dele.
              </Aviso>
            )}
            <p className="text-xs text-muted-foreground">
              Confira bem: quem fica ligado a um cadastro vê as sessões dele e os prontuários dessas crianças.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAberta(false)}>Cancelar</Button>
            <Button onClick={ligar} disabled={!escolhido || nadaAMudar || salvando} className="bg-[#127a7e] hover:bg-[#0d5c5f]">
              {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {nadaAMudar ? "Já está ligado" : comAviso ? "Ligar mesmo assim" : "Ligar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
