// lib/senhaProvisoria.ts
// A senha provisória, para quem esqueceu a senha e o e-mail de recuperação não chega: o admin define
// uma senha e passa para a pessoa; quando ela entra, o sistema obriga a criar uma senha só dela.
// Só roda no servidor (app/api): o navegador não pode mudar a senha de outra pessoa. A senha nunca
// é guardada no banco; no cadastro fica só a marca `trocarSenha`, que a própria pessoa não consegue
// apagar (a regra de users só deixa ela trocar o nome).
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, initAdmin } from "@/lib/firebaseAdmin";
import { verificarAcesso } from "@/lib/acessoServidor";
import type { Papel } from "@/services/chatService";

export const SENHA_MINIMA = 6;
const TODOS: Papel[] = ["admin", "coordenador", "funcionario", "profissional", "familiar"];

type Resposta = { status: number; corpo: { ok: true } | { erro: string } };
const erro = (status: number, mensagem: string): Resposta => ({ status, corpo: { erro: mensagem } });

const senhaValida = (senha: unknown): senha is string =>
  typeof senha === "string" && senha.length >= SENHA_MINIMA && senha.length <= 64;

/** O admin define a senha provisória de outra pessoa. As sessões abertas dela são encerradas. */
export async function definirSenhaProvisoria(authorization: string | null, pedido: { uid?: unknown; senha?: unknown }): Promise<Resposta> {
  const acesso = await verificarAcesso(authorization, ["admin"]);
  if (!acesso.ok) return erro(acesso.status, acesso.erro);

  const { uid, senha } = pedido;
  if (typeof uid !== "string" || !uid) return erro(400, "Escolha a pessoa.");
  if (uid === acesso.uid) return erro(400, "Para trocar a sua própria senha, use Minha Conta.");
  if (!senhaValida(senha)) return erro(400, `A senha precisa ter de ${SENHA_MINIMA} a 64 caracteres.`);

  const ref = initAdmin().doc(`users/${uid}`);
  if (!(await ref.get()).exists) return erro(404, "Cadastro não encontrado.");

  try {
    await adminAuth().updateUser(uid, { password: senha });
  } catch (e) {
    if ((e as { code?: string }).code === "auth/user-not-found") return erro(404, "Esta pessoa não tem login no sistema.");
    throw e;
  }
  await adminAuth().revokeRefreshTokens(uid);
  await ref.update({ trocarSenha: true, senhaProvisoriaEm: FieldValue.serverTimestamp(), senhaProvisoriaPor: acesso.uid });
  return { status: 200, corpo: { ok: true } };
}

/** Quem entrou com a senha provisória cria a senha dela, e a marca sai do cadastro. */
export async function trocarSenhaProvisoria(authorization: string | null, pedido: { senha?: unknown }): Promise<Resposta> {
  const acesso = await verificarAcesso(authorization, TODOS);
  if (!acesso.ok) return erro(acesso.status, acesso.erro);

  const ref = initAdmin().doc(`users/${acesso.uid}`);
  if ((await ref.get()).data()?.trocarSenha !== true) return erro(409, "Sua senha já foi trocada.");
  if (!senhaValida(pedido.senha)) return erro(400, `A senha precisa ter de ${SENHA_MINIMA} a 64 caracteres.`);

  await adminAuth().updateUser(acesso.uid, { password: pedido.senha });
  await ref.update({ trocarSenha: FieldValue.delete(), senhaTrocadaEm: FieldValue.serverTimestamp() });
  return { status: 200, corpo: { ok: true } };
}
