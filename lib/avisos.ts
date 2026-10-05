// lib/avisos.ts
// Os avisos da clínica (coleção communications): para quem vai cada aviso, quem leu, o que é
// novo para cada pessoa e quem pode editar ou excluir. As regras do banco (firestore.rules)
// seguem o mesmo desenho: a gestão vê todos; terapeutas e famílias, só os do seu público.

export type PapelDeUsuario = "admin" | "coordenador" | "funcionario" | "profissional" | "familiar";

/** Para quem o aviso vai (campo targetRole). "profissional" e "funcionario" só existem em avisos antigos. */
export type PublicoDoAviso = "equipe" | "terapeutas" | "coordenador" | "familiar" | "profissional" | "funcionario";

export const PUBLICOS: Record<PublicoDoAviso, { nome: string; descricao: string; papeis: PapelDeUsuario[] }> = {
  equipe: { nome: "Equipe toda", descricao: "terapeutas, recepção e coordenação", papeis: ["profissional", "funcionario", "coordenador", "admin"] },
  terapeutas: { nome: "Terapeutas", descricao: "só os terapeutas", papeis: ["profissional"] },
  coordenador: { nome: "Coordenação", descricao: "coordenação e administração", papeis: ["coordenador", "admin"] },
  familiar: { nome: "Famílias", descricao: "todas as famílias com conta aprovada", papeis: ["familiar"] },
  // Avisos antigos: o "Aviso Interno" ia para a equipe toda, e "funcionario", para a recepção
  profissional: { nome: "Equipe toda", descricao: "terapeutas, recepção e coordenação", papeis: ["profissional", "funcionario", "coordenador", "admin"] },
  funcionario: { nome: "Recepção", descricao: "recepção e coordenação", papeis: ["funcionario", "coordenador", "admin"] },
};

/** Os públicos que aparecem para escolher ao escrever um aviso. */
export const PUBLICOS_PARA_ENVIAR: PublicoDoAviso[] = ["equipe", "terapeutas", "coordenador", "familiar"];

interface AvisoParaConta {
  targetRole: PublicoDoAviso;
  authorId: string;
  readBy: Record<string, unknown>;
}

interface QuemUsa { uid: string; papel: PapelDeUsuario }

const recebe = (publico: PublicoDoAviso, papel: PapelDeUsuario) => PUBLICOS[publico]?.papeis.includes(papel) ?? false;

/** Os públicos cujos avisos a pessoa recebe (é o que terapeutas e famílias podem ler). */
export const publicosQueRecebe = (papel: PapelDeUsuario) =>
  (Object.keys(PUBLICOS) as PublicoDoAviso[]).filter((publico) => recebe(publico, papel));

/** Quem recebe o aviso: as pessoas do público dele, sem quem escreveu. */
export const destinatarios = <P extends QuemUsa>(aviso: AvisoParaConta, pessoas: P[]) =>
  pessoas.filter((p) => recebe(aviso.targetRole, p.papel) && p.uid !== aviso.authorId);

/** Quem já leu e quem ainda não leu, entre os destinatários. */
export const leitura = <P extends QuemUsa>(aviso: AvisoParaConta, pessoas: P[]) => {
  const todos = destinatarios(aviso, pessoas);
  const leram = todos.filter((p) => p.uid in aviso.readBy);
  return { leram, naoLeram: todos.filter((p) => !(p.uid in aviso.readBy)), total: todos.length };
};

export const souDestinatario = (aviso: AvisoParaConta, eu: QuemUsa) =>
  recebe(aviso.targetRole, eu.papel) && aviso.authorId !== eu.uid;

/** Novo para mim: o aviso é para mim e eu ainda não li. */
export const novoParaMim = (aviso: AvisoParaConta, eu: QuemUsa) => souDestinatario(aviso, eu) && !(eu.uid in aviso.readBy);

export const contarNovos = (avisos: AvisoParaConta[], eu: QuemUsa) => avisos.filter((a) => novoParaMim(a, eu)).length;

/** Editar e excluir: quem escreveu, a administração e a coordenação. */
export const possoMexer = (aviso: AvisoParaConta, eu: QuemUsa) =>
  aviso.authorId === eu.uid || eu.papel === "admin" || eu.papel === "coordenador";
