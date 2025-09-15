// lib/formatters.ts

/**
 * Formata um valor para o padrão de CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00).
 * A máscara é aplicada dinamicamente com base no comprimento do valor.
 */
export const formatCPF_CNPJ = (value: string) => {
    const cleanedValue = value.replace(/\D/g, ''); // Remove tudo que não for dígito
  
    if (cleanedValue.length <= 11) {
      // Formato CPF
      return cleanedValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .substring(0, 14);
    } else {
      // Formato CNPJ
      return cleanedValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .substring(0, 18);
    }
  };
  
  /**
   * Formata um valor para o padrão de CEP (00000-000).
   */
  export const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };
  
  /**
   * Formata um valor para o padrão de telefone com DDD ((00) 00000-0000).
   */
  export const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  // lib/formatters.ts

/**
 * Formata o nome de uma especialidade para remover nomes de convênios.
 * Ex: "Psicologia Amil e Unimed Leste" se torna "Psicologia".
 * Ex: "Fisioterapia Motora Bradesco" se torna "Fisioterapia Motora".
 * @param specialtyName O nome completo da especialidade que vem do banco de dados.
 * @returns O nome da especialidade formatado, sem os convênios.
 */
export const formatSpecialtyName = (specialtyName: string): string => {
  if (!specialtyName) return "N/A";

  // Lista de palavras-chave que marcam o início dos nomes dos convênios
  const keywords = ["unimed", "amil", "bradesco", "sulamérica", "sul américa", "ferj", "particular"];

  const lowerCaseName = specialtyName.toLowerCase();
  let cutIndex = -1;

  // Encontra a primeira ocorrência de uma das palavras-chave
  for (const keyword of keywords) {
    const index = lowerCaseName.indexOf(keyword);
    if (index !== -1) {
      if (cutIndex === -1 || index < cutIndex) {
        cutIndex = index;
      }
    }
  }

  // Se encontrou uma palavra-chave, corta a string antes dela.
  // Se não, retorna o nome original.
  if (cutIndex !== -1) {
    return specialtyName.substring(0, cutIndex).trim();
  }

  return specialtyName;
};