// services/senhaService.ts
// A tela fala com as rotas da senha provisória (lib/senhaProvisoria) mandando o login de quem está usando.
import { auth } from "@/lib/firebaseConfig";

type Resultado = { ok: true } | { ok: false; erro: string };

async function chamar(url: string, corpo: object): Promise<Resultado> {
  const login = await auth.currentUser?.getIdToken();
  if (!login) return { ok: false, erro: "Entre no sistema de novo para continuar." };
  try {
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${login}` },
      body: JSON.stringify(corpo),
    });
    if (resposta.ok) return { ok: true };
    const dados = await resposta.json().catch(() => ({}));
    return { ok: false, erro: dados.erro ?? "Não foi possível concluir agora. Tente de novo em alguns minutos." };
  } catch {
    return { ok: false, erro: "Sem conexão com o servidor. Confira a internet e tente de novo." };
  }
}

/** Só o admin: define a senha provisória de outra pessoa. */
export const definirSenhaProvisoria = (uid: string, senha: string) => chamar("/api/admin/senha-provisoria", { uid, senha });

/** Quem entrou com a senha provisória cria a senha dela. */
export const trocarMinhaSenhaProvisoria = (senha: string) => chamar("/api/conta/trocar-senha", { senha });

/** Uma senha fácil de ditar por telefone ou WhatsApp, como libelle-482193. */
export function gerarSenhaProvisoria() {
  const numero = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return `libelle-${String(numero).padStart(6, "0")}`;
}
