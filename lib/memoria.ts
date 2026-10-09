// As listas pequenas que várias telas leem (crianças, profissionais, salas, terapias): a primeira tela
// lê do banco e as outras reaproveitam por 10 minutos, só na memória do site (some ao fechar ou
// recarregar a página; nada fica guardado no aparelho). Quem grava numa dessas listas manda esquecer,
// e a próxima tela lê de novo. Assim, passar de uma tela para outra não lê tudo outra vez.

const VALIDADE = 10 * 60 * 1000;
const guardadas = new Map<string, { em: number; valor: Promise<unknown> }>();

/** O valor guardado com essa chave, se tiver menos de 10 minutos; senão, busca e guarda. */
export function lembrar<T>(chave: string, buscar: () => Promise<T>, validade = VALIDADE): Promise<T> {
  const agora = Date.now();
  const guardada = guardadas.get(chave);
  if (guardada && agora - guardada.em < validade) return guardada.valor as Promise<T>;

  const valor = buscar();
  guardadas.set(chave, { em: agora, valor });
  // Um erro (sem internet, por exemplo) não fica guardado: a próxima tela tenta de novo
  valor.catch(() => {
    if (guardadas.get(chave)?.valor === valor) guardadas.delete(chave);
  });
  return valor;
}

/** Esquece as listas cuja chave começa assim (ex.: "patients:" apaga ativos e todos). */
export function esquecer(prefixo: string) {
  for (const chave of [...guardadas.keys()]) {
    if (chave.startsWith(prefixo)) guardadas.delete(chave);
  }
}

export function esquecerTudo() {
  guardadas.clear();
}
