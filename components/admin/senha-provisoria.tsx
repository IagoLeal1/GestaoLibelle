"use client"

// O botão com a chave, em Gerenciar Usuários, seguindo o desenho aprovado: o admin define uma senha
// provisória (o sistema sugere uma fácil de ditar), e a janela mostra a senha para copiar e passar à
// pessoa. Quando ela entrar, o sistema pede uma senha nova (components/auth/trocar-senha-provisoria).
import { useRef, useState } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { definirSenhaProvisoria, gerarSenhaProvisoria } from "@/services/senhaService";

const SENHA_MINIMA = 6;

export function BotaoSenhaProvisoria({ pessoa }: { pessoa: { uid: string; nome: string; email: string } }) {
  const { firestoreUser } = useAuth();
  const [aberta, setAberta] = useState(false);
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [definida, setDefinida] = useState(false);
  const [copiada, setCopiada] = useState(false);
  const campoDaSenha = useRef<HTMLInputElement>(null);
  const primeiro = pessoa.nome.split(" ")[0] || "a pessoa";

  // Para a própria senha, o admin usa Minha Conta
  if (firestoreUser?.uid === pessoa.uid) return null;

  const abrir = () => {
    setSenha(gerarSenhaProvisoria());
    setErro(null);
    setDefinida(false);
    setCopiada(false);
    setAberta(true);
  };

  const definir = async () => {
    setSalvando(true);
    setErro(null);
    const resultado = await definirSenhaProvisoria(pessoa.uid, senha);
    setSalvando(false);
    if (resultado.ok) setDefinida(true);
    else setErro(resultado.erro);
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiada(true);
    } catch {
      // Navegador que não deixa copiar: a senha fica selecionada para copiar à mão
      campoDaSenha.current?.select();
    }
  };

  const curta = senha.length < SENHA_MINIMA;

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        aria-label={`Senha provisória de ${pessoa.nome}`}
        title="Senha provisória"
        className="bg-white text-gray-500 transition-colors hover:border-[#1da7ac] hover:bg-[#e3f4f4] hover:text-[#127a7e]"
        onClick={abrir}
      >
        <KeyRound className="h-4 w-4" />
      </Button>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Senha provisória</DialogTitle>
            <DialogDescription className="break-words">{pessoa.nome} · {pessoa.email}</DialogDescription>
          </DialogHeader>

          {definida ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 font-semibold text-[#146b55]">
                <CheckCircle2 className="h-5 w-5" /> Senha definida
              </p>
              <p className="text-sm text-muted-foreground">Passe para {primeiro}, por WhatsApp por exemplo:</p>
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                <input
                  readOnly
                  aria-label="Senha definida"
                  value={senha}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 bg-transparent text-xl font-bold tracking-wide outline-none"
                  ref={campoDaSenha}
                />
                <Button variant="outline" size="sm" onClick={copiar}>
                  {copiada ? "Copiada" : "Copiar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">A senha não fica guardada no sistema: copie agora.</p>
              <DialogFooter>
                <Button onClick={() => setAberta(false)} className="bg-[#127a7e] hover:bg-[#0d5c5f]">Concluir</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="senha-provisoria">Senha provisória</Label>
                <div className="flex gap-2">
                  <Input
                    id="senha-provisoria"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="off"
                    className="text-base font-semibold tracking-wide"
                  />
                  <Button type="button" variant="outline" onClick={() => setSenha(gerarSenhaProvisoria())}>Gerar outra</Button>
                </div>
                {curta && <p className="text-xs text-[#9b3a1c]">Pelo menos {SENHA_MINIMA} caracteres.</p>}
              </div>
              <p className="rounded-lg border border-[#f3d27a] bg-[#fff8e1] p-3 text-sm text-[#6b4a00]">
                {primeiro} entra com esta senha e, na hora, o sistema pede para criar uma senha nova. A senha antiga para de
                funcionar, e quem estiver com o sistema aberto precisa entrar de novo.
              </p>
              {erro && <p className="text-sm text-destructive">{erro}</p>}
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setAberta(false)}>Cancelar</Button>
                <Button onClick={definir} disabled={curta || salvando} className="bg-[#127a7e] hover:bg-[#0d5c5f]">
                  {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Definir senha
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
