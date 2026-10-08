// __tests__/lib/coresDasTerapias.test.ts
// As cores da clínica nas telas: cada terapia e cada criança com a sua cor, e a versão escura para texto.
import { corDaCrianca, corDaTerapia, corEscura } from '@/lib/coresDasTerapias';

it('cada criança tem sempre a mesma cor', () => {
  expect(corDaCrianca('paciente-lucas')).toBe(corDaCrianca('paciente-lucas'));
  expect(corDaCrianca('paciente-lucas')).toMatch(/^#[0-9a-f]{6}$/);
});

it('a fono é verde-água, a psico é vinho e a TO é laranja', () => {
  expect([corDaTerapia('Fonoaudiologia'), corDaTerapia('Psicologia'), corDaTerapia('Terapia Ocupacional')]).toEqual(['#1da7ac', '#b7133f', '#e68b00']);
});

it('a versão escura serve para texto em cima da cor clarinha', () => {
  expect(corEscura('#1da7ac')).toBe('#136d70');
  expect(corEscura('#ffffff', 0.5)).toBe('#808080');
});
