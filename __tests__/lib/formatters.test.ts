// __tests__/lib/formatters.test.ts

import {
  formatCPF_CNPJ,
  formatCEP,
  formatPhone,
  formatSpecialtyName
} from '@/lib/formatters';

// Testes para a função formatCPF_CNPJ
describe('formatCPF_CNPJ', () => {
  it('should format a string of numbers into a CPF mask', () => {
    expect(formatCPF_CNPJ('12345678900')).toBe('123.456.789-00');
  });

  it('should format a string of numbers into a CNPJ mask', () => {
    expect(formatCPF_CNPJ('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('should handle incomplete values gracefully', () => {
    expect(formatCPF_CNPJ('12345')).toBe('123.45');
  });
});

// Testes para a função formatCEP
describe('formatCEP', () => {
  it('should format a string of numbers into a CEP mask', () => {
    expect(formatCEP('12345678')).toBe('12345-678');
  });
});

// Testes para a função formatPhone
describe('formatPhone', () => {
  it('should format a string of numbers into a phone mask', () => {
    expect(formatPhone('21999998888')).toBe('(21) 99999-8888');
  });
});

// Testes para a função formatSpecialtyName
describe('formatSpecialtyName', () => {
  it('should remove a single keyword from the end', () => {
    expect(formatSpecialtyName('Psicologia Amil')).toBe('Psicologia');
  });

  it('should remove multiple keywords from the end', () => {
    expect(formatSpecialtyName('Fisioterapia Motora Bradesco SulAmérica')).toBe('Fisioterapia Motora');
  });

  it('should handle keywords in the middle of the string', () => {
    expect(formatSpecialtyName('Terapia Ocupacional Unimed e Particular')).toBe('Terapia Ocupacional');
  });

  it('should return the original name if no keywords are found', () => {
    expect(formatSpecialtyName('Acupuntura')).toBe('Acupuntura');
  });
  
  it('should handle case-insensitivity', () => {
    expect(formatSpecialtyName('Nutrição UNIMED')).toBe('Nutrição');
  });

  it('should return "N/A" for empty input', () => {
    expect(formatSpecialtyName('')).toBe('N/A');
  });
});