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