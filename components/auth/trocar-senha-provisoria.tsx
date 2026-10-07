"use client"

// "Crie uma senha nova": aparece logo depois de entrar com a senha provisória que o admin definiu
// (lib/senhaProvisoria) e não deixa abrir nenhuma outra tela antes de trocar (components/auth/auth-guard).
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebaseConfig";
import { abrirDoZero } from "@/lib/navegar";
import { trocarMinhaSenhaProvisoria } from "@/services/senhaService";

const SENHA_MINIMA = 6;

/** A senha nova é a própria provisória? Confere entrando de novo com ela, sem guardar nada. */
async function ehASenhaAtual(user: User, email: string, senha: string) {
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, senha));
    return true;
  } catch {
    return false;
  }
}

export function TrocarSenhaProvisoria() {
  const { user, firestoreUser, loading } = useAuth();
  const router = useRouter();
  const [nova, setNova] = useState("");
  const [confirma, setConfirma] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (firestoreUser && !firestoreUser.trocarSenha) router.replace("/");
  }, [loading, user, firestoreUser, router]);

  const email = user?.email ?? "";
  const primeiro = firestoreUser?.displayName?.split(" ")[0];

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (nova.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (nova !== confirma) return setErro("As duas senhas não são iguais.");
    setSalvando(true);
    if (user && (await ehASenhaAtual(user, email, nova))) {
      setSalvando(false);
      return setErro("Escolha uma senha diferente da provisória.");
    }
    const resultado = await trocarMinhaSenhaProvisoria(nova);
    if (!resultado.ok) {
      setSalvando(false);
      return setErro(resultado.erro);
    }
    // Trocar a senha encerra a sessão antiga: entra de novo com a senha nova e abre o sistema do zero
    try {
      await signInWithEmailAndPassword(auth, email, nova);
    } catch (e) {
      console.error("Erro ao entrar com a senha nova:", e);
    }
    abrirDoZero("/");
  };

  const sair = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  if (loading || !user || !firestoreUser?.trocarSenha) {
    return <p className="text-sm text-muted-foreground">Verificando acesso...</p>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="relative h-16 w-24">
            <Image src="/images/logotipo-azul.png" alt="Casa Libelle" fill className="object-contain" />
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-2xl font-bold text-primary-dark-blue">Crie uma senha nova</CardTitle>
          <CardDescription className="text-[15px]">
            {primeiro ? `Olá, ${primeiro}! ` : ""}A clínica redefiniu a sua senha. Para continuar, crie uma senha só sua.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={salvar} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="senha-nova">Nova senha</Label>
            <div className="relative">
              <Input
                id="senha-nova"
                type={mostrar ? "text" : "password"}
                autoComplete="new-password"
                value={nova}
                onChange={(e) => setNova(e.target.value)}
                className="pr-10 text-base"
              />
              <button
                type="button"
                onClick={() => setMostrar((m) => !m)}
                aria-label={mostrar ? "Esconder as senhas" : "Mostrar as senhas"}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Pelo menos {SENHA_MINIMA} caracteres.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha-confirma">Confirme a nova senha</Label>
            <Input
              id="senha-confirma"
              type={mostrar ? "text" : "password"}
              autoComplete="new-password"
              value={confirma}
              onChange={(e) => setConfirma(e.target.value)}
              className="text-base"
            />
          </div>
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <Button type="submit" disabled={salvando} className="h-11 w-full bg-primary-teal text-base hover:bg-primary-teal/90">
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar e entrar
          </Button>
          <button type="button" onClick={sair} className="w-full text-center text-sm text-muted-foreground hover:text-primary-teal">
            Sair
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
