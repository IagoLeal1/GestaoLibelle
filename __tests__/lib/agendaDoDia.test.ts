// __tests__/lib/agendaDoDia.test.ts
// A Agenda no celular: o nome do dia escolhido (hoje, ontem, amanhã) e o resumo numa linha, no
// lugar dos 6 números grandes que empurravam a lista para baixo.
import { nomeDoDia, resumoDoDia } from '@/lib/agendaDoDia';

const HOJE = new Date(2026, 9, 5, 10, 0);

describe('nome do dia', () => {
  it('hoje, ontem e amanhã pelo nome; os outros pelo dia da semana', () => {
    expect(nomeDoDia(new Date(2026, 9, 5), HOJE)).toEqual({ titulo: 'Hoje', data: 'segunda, 05/10' });
    expect(nomeDoDia(new Date(2026, 9, 4), HOJE)).toEqual({ titulo: 'Ontem', data: 'domingo, 04/10' });
    expect(nomeDoDia(new Date(2026, 9, 6), HOJE)).toEqual({ titulo: 'Amanhã', data: 'terça, 06/10' });
    expect(nomeDoDia(new Date(2026, 9, 8), HOJE)).toEqual({ titulo: 'Quinta', data: 'quinta, 08/10' });
  });
});

describe('resumo do dia', () => {
  const sessao = (status: string) => ({ status });

  it('conta as sessões e, quando há, as finalizadas e as faltas', () => {
    expect(resumoDoDia([sessao('agendado'), sessao('finalizado'), sessao('finalizado'), sessao('nao_compareceu')])).toBe(
      '4 sessões · 2 finalizadas · 1 falta'
    );
    expect(resumoDoDia([sessao('agendado')])).toBe('1 sessão');
    expect(resumoDoDia([])).toBe('Nenhuma sessão');
  });
});
