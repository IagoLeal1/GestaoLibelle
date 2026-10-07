// __tests__/lib/prontuario.test.ts
// O prontuário da criança: uma aba por terapia (as do terapeuta primeiro), o "Para lembrar" de cada
// terapia, a sessão que prova que o terapeuta atende a criança e a lista das crianças dele.
import {
  criancasDoTerapeuta, daTerapia, idade, minhaSessaoCom, paraLembrar, terapiasDoProntuario, type Anotacao,
} from '@/lib/prontuario';
import type { SessaoDaAgenda } from '@/lib/evolucoes';

const nota = (id: string, terapia: string, fixada: boolean, dia: number): Anotacao => ({
  id, terapia, texto: id, fixada, autorId: 'paula', autorNome: 'Paula', criadoEm: new Date(2026, 9, dia),
});
const sessao = (id: string, extra: Partial<SessaoDaAgenda> = {}): SessaoDaAgenda => ({
  id, patientId: 'lucas', patientName: 'Lucas Souza', professionalId: 'paula', professionalName: 'Paula',
  tipo: 'Fonoaudiologia', start: new Date(2026, 9, 6, 9), status: 'finalizado', ...extra,
});

describe('terapiasDoProntuario', () => {
  it('junta as terapias das anotações, das evoluções e as do terapeuta, com as dele primeiro', () => {
    expect(
      terapiasDoProntuario({
        anotacoes: [{ terapia: 'Terapia Ocupacional' }],
        evolucoes: [{ terapia: 'Psicologia' }, { terapia: 'Fonoaudiologia' }],
        minhas: ['Fonoaudiologia'],
      })
    ).toEqual([
      { terapia: 'Fonoaudiologia', minha: true },
      { terapia: 'Psicologia', minha: false },
      { terapia: 'Terapia Ocupacional', minha: false },
    ]);
  });
});

describe('as anotações de uma terapia', () => {
  const notas = [nota('a', 'Fonoaudiologia', true, 1), nota('b', 'Fonoaudiologia', false, 3), nota('c', 'Fonoaudiologia', true, 5), nota('d', 'Psicologia', true, 4)];

  it('"Para lembrar": só as fixadas da terapia, das mais novas para as mais antigas', () => {
    expect(paraLembrar(notas, 'Fonoaudiologia').map((n) => n.id)).toEqual(['c', 'a']);
  });

  it('a lista: todas da terapia, das mais novas para as mais antigas', () => {
    expect(daTerapia(notas, 'Fonoaudiologia').map((n) => n.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('minhaSessaoCom', () => {
  it('a sessão mais recente da criança naquela terapia, sem as canceladas', () => {
    const sessoes = [
      sessao('antiga', { start: new Date(2026, 9, 1, 9) }),
      sessao('recente', { start: new Date(2026, 9, 6, 9) }),
      sessao('cancelada', { start: new Date(2026, 9, 8, 9), status: 'cancelado' }),
      sessao('psico', { tipo: 'Psicologia', start: new Date(2026, 9, 7, 9) }),
      sessao('outra-crianca', { patientId: 'bia', start: new Date(2026, 9, 9, 9) }),
    ];
    expect(minhaSessaoCom(sessoes, 'lucas', 'Fonoaudiologia')).toBe('recente');
    expect(minhaSessaoCom(sessoes, 'lucas', 'Terapia Ocupacional')).toBeUndefined();
  });
});

describe('criancasDoTerapeuta', () => {
  it('cada criança uma vez, com as terapias dela com o terapeuta, em ordem de nome', () => {
    const lista = criancasDoTerapeuta([
      sessao('1', { patientId: 'lucas', patientName: 'Lucas Souza' }),
      sessao('2', { patientId: 'bia', patientName: 'Bia Lima', tipo: 'Psicologia' }),
      sessao('3', { patientId: 'lucas', patientName: 'Lucas Souza', tipo: 'Psicologia' }),
      sessao('4', { patientId: 'davi', patientName: 'Davi Rocha', status: 'cancelado' }),
    ]);
    expect(lista).toEqual([
      { id: 'bia', nome: 'Bia Lima', terapias: ['Psicologia'] },
      { id: 'lucas', nome: 'Lucas Souza', terapias: ['Fonoaudiologia', 'Psicologia'] },
    ]);
  });
});

describe('idade', () => {
  const hoje = new Date(2026, 9, 7);
  it('em anos, ou em meses para quem tem menos de 1 ano', () => {
    expect(idade('2020-03-15', hoje)).toBe('6 anos');
    expect(idade('2025-09-01', hoje)).toBe('1 ano');
    expect(idade('2026-02-01', hoje)).toBe('8 meses');
  });
  it('data que não dá para ler: nada', () => {
    expect(idade('', hoje)).toBeNull();
    expect(idade('sem data', hoje)).toBeNull();
  });
});
