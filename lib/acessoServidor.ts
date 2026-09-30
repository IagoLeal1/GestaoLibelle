// lib/acessoServidor.ts
// Confere quem chama uma rota do servidor. As rotas leem o banco com acesso de administrador,
// que ignora as regras, então só atendem quem mandou um login válido e tem cadastro aprovado
// com um dos papéis permitidos. O papel vem do cadastro, nunca do que o navegador envia.
import { adminAuth, initAdmin } from "@/lib/firebaseAdmin";
import type { Papel } from "@/services/chatService";

// Quem cria e organiza agendamentos (as mesmas pessoas que as regras deixam criar atendimentos)
export const PAPEIS_DA_GESTAO: readonly Papel[] = ["admin", "coordenador", "funcionario"];

export type ResultadoDoAcesso =
  | { ok: true; uid: string; papel: Papel }
  | { ok: false; status: 401 | 403; erro: string };

// `authorization` é o cabeçalho "Authorization: Bearer <login>" que a tela manda
export const verificarAcesso = async (
  authorization: string | null,
  papeis: readonly Papel[]
): Promise<ResultadoDoAcesso> => {
  const login = authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!login) return { ok: false, status: 401, erro: "Entre no sistema para usar esta função." };

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(login)).uid;
  } catch {
    return { ok: false, status: 401, erro: "Seu login expirou. Entre de novo no sistema." };
  }

  // Cadastro removido ou pendente não passa, mesmo com o login ainda válido
  const perfil = (await initAdmin().doc(`users/${uid}`).get()).data()?.profile;
  if (perfil?.status !== "aprovado" || !papeis.includes(perfil.role)) {
    return { ok: false, status: 403, erro: "Seu perfil não tem acesso a esta função." };
  }
  return { ok: true, uid, papel: perfil.role };
};
