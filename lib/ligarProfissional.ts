// A conta de um profissional (users) e o cadastro dele em Profissionais (professionals) precisam estar
// ligados dos dois lados: o cadastro guarda o userId da conta (é o que as regras do banco conferem) e o
// perfil guarda o professionalId (é por onde a agenda e as evoluções acham as sessões). A aprovação já
// ligava; aqui fica a mesma busca para quando o admin troca o papel para "profissional" depois.

export interface ContaDoProfissional {
  uid: string;
  email?: string | null;
  cpf?: string | null;
  professionalId?: string | null;
}

export interface CadastroDoProfissional {
  id: string;
  fullName?: string;
  userId?: string;
  cpf?: string;
  email?: string;
}

export type Ligacao =
  | { tipo: "ligada" }
  | { tipo: "ligar"; professionalId: string; noPerfil: boolean; noCadastro: boolean }
  | { tipo: "sem_cadastro" };

const soDigitos = (cpf?: string | null) => (cpf ?? "").replace(/\D/g, "");
const emailLimpo = (email?: string | null) => (email ?? "").trim().toLowerCase();

/** Qual cadastro ligar à conta: o que já aponta para ela, o do perfil, ou um livre com o mesmo CPF ou e-mail. */
export function ligacaoDoProfissional(conta: ContaDoProfissional, cadastros: CadastroDoProfissional[]): Ligacao {
  const ligar = (cadastro: CadastroDoProfissional): Ligacao => {
    const noPerfil = conta.professionalId !== cadastro.id;
    const noCadastro = cadastro.userId !== conta.uid;
    return noPerfil || noCadastro ? { tipo: "ligar", professionalId: cadastro.id, noPerfil, noCadastro } : { tipo: "ligada" };
  };

  const jaDela = cadastros.find((c) => c.userId === conta.uid);
  if (jaDela) return ligar(jaDela);

  const livres = cadastros.filter((c) => !c.userId);
  const doPerfil = livres.find((c) => c.id === conta.professionalId);
  if (doPerfil) return ligar(doPerfil);

  // Só liga sozinho quando um único cadastro bate, para nunca escolher entre dois
  const cpf = soDigitos(conta.cpf);
  const peloCpf = cpf ? livres.filter((c) => soDigitos(c.cpf) === cpf) : [];
  if (peloCpf.length === 1) return ligar(peloCpf[0]);

  const email = emailLimpo(conta.email);
  const peloEmail = email ? livres.filter((c) => emailLimpo(c.email) === email) : [];
  if (peloCpf.length === 0 && peloEmail.length === 1) return ligar(peloEmail[0]);

  return { tipo: "sem_cadastro" };
}

export interface ContaListada {
  uid: string;
  nome: string;
  professionalId?: string | null;
}

export interface TrocaDeCadastro {
  /** Quem usa hoje o cadastro escolhido: deixa de ver as sessões dele. */
  outraConta?: { uid: string; nome: string };
  /** O cadastro que a conta usava antes: ela deixa de ver as sessões dele. */
  cadastroAnterior?: { id: string; nome: string };
  /** Cadastros que perdem o userId desta conta. */
  soltarCadastros: string[];
  /** Outras contas que perdem o professionalId do cadastro escolhido. */
  soltarContas: string[];
}

/**
 * Ligar na mão (quando o cadastro foi feito com outro e-mail e outro CPF): o que muda além da ligação
 * nova. A ligação é sempre de um para um, então a antiga de cada lado é desfeita, com aviso.
 */
export function trocaDeCadastro(
  conta: ContaDoProfissional,
  escolhidoId: string,
  cadastros: CadastroDoProfissional[],
  contas: ContaListada[]
): TrocaDeCadastro {
  const troca: TrocaDeCadastro = { soltarCadastros: [], soltarContas: [] };
  const escolhido = cadastros.find((c) => c.id === escolhidoId);

  if (escolhido?.userId && escolhido.userId !== conta.uid) {
    const dona = contas.find((c) => c.uid === escolhido.userId);
    troca.outraConta = { uid: escolhido.userId, nome: dona?.nome ?? "uma conta que não está mais na lista" };
  }
  troca.soltarContas = contas.filter((c) => c.uid !== conta.uid && c.professionalId === escolhidoId).map((c) => c.uid);

  const antigos = cadastros.filter((c) => c.id !== escolhidoId && c.userId === conta.uid);
  troca.soltarCadastros = antigos.map((c) => c.id);
  const anterior = antigos[0] ?? cadastros.find((c) => c.id !== escolhidoId && c.id === conta.professionalId);
  if (anterior) troca.cadastroAnterior = { id: anterior.id, nome: anterior.fullName ?? "sem nome" };

  return troca;
}
