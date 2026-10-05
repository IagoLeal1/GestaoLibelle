// __tests__/lib/semanaNoCelular.test.ts
// As grades da semana no celular: em vez da tabela larga, um dia por vez. Abre no dia de hoje
// (se ele está na semana) e lista os horários do dia: os ocupados e, para quem agenda, os livres.
import { diaInicial, linhasDoDia, rotuloDoDia } from '@/lib/semanaNoCelular';

// Semana de 05/10/2026 (segunda) a 11/10/2026 (domingo)
const SEMANA = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 5 + i));
const item = (id: string, hora: string) => ({ id, hora, titulo: id, detalhe: '' });

describe('dia em que a grade abre', () => {
  it('abre no dia de hoje quando ele está na semana', () => {
    expect(diaInicial(SEMANA, new Date(2026, 9, 7, 15, 0))).toBe(2);
  });

  it('em outra semana, abre na segunda', () => {
    expect(diaInicial(SEMANA, new Date(2026, 9, 20))).toBe(0);
  });
});

describe('horários do dia', () => {
  const HORARIOS = ['07:20', '08:10', '09:00'];

  it('quem só consulta vê só os horários ocupados, em ordem', () => {
    const linhas = linhasDoDia(HORARIOS, [item('b', '09:00'), item('a', '07:20')], { comLivres: false });

    expect(linhas).toEqual([
      { hora: '07:20', itens: [item('a', '07:20')] },
      { hora: '09:00', itens: [item('b', '09:00')] },
    ]);
  });

  it('quem agenda vê também os horários livres', () => {
    const linhas = linhasDoDia(HORARIOS, [item('a', '08:10')], { comLivres: true });

    expect(linhas.map((l) => [l.hora, l.itens.length])).toEqual([['07:20', 0], ['08:10', 1], ['09:00', 0]]);
  });

  it('sessão fora dos horários da clínica aparece no lugar certo, e duas no mesmo horário ficam juntas', () => {
    const linhas = linhasDoDia(HORARIOS, [item('fora', '08:30'), item('x', '09:00'), item('y', '09:00')], { comLivres: false });

    expect(linhas.map((l) => [l.hora, l.itens.map((i) => i.id)])).toEqual([['08:30', ['fora']], ['09:00', ['x', 'y']]]);
  });
});

describe('título do dia', () => {
  it('diz o dia e quantas sessões', () => {
    expect(rotuloDoDia(new Date(2026, 9, 6), 3)).toBe('Terça, 06/10 · 3 sessões');
    expect(rotuloDoDia(new Date(2026, 9, 6), 1)).toBe('Terça, 06/10 · 1 sessão');
    expect(rotuloDoDia(new Date(2026, 9, 11), 0)).toBe('Domingo, 11/10');
  });
});
