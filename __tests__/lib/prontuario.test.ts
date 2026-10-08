// __tests__/lib/prontuario.test.ts
// O prontuário da criança: uma aba por terapia (as do terapeuta primeiro), o "Para lembrar" de cada
// terapia, a sessão que prova que o terapeuta atende a criança e a lista das crianças dele.
import {
  criancasDoTerapeuta, criancasNaAgenda, daTerapia, idade, minhaSessaoCom, paraLembrar, resumoDaAgenda, terapiasDoProntuario, type Anotacao,
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

describe('criancasNaAgenda e resumoDaAgenda', () => {
  const agora = new Date(2026, 9, 8, 10, 0); // quinta, 08/10, 10h
  const sessoes = [
    sessao('lucas-ontem', { patientId: 'lucas', patientName: 'Lucas Souza', start: new Date(2026, 9, 7, 9), end: new Date(2026, 9, 7, 9, 50) }),
    sessao('lucas-sexta', { patientId: 'lucas', patientName: 'Lucas Souza', start: new Date(2026, 9, 9, 9), end: new Date(2026, 9, 9, 9, 50) }),
    sessao('bia-hoje', { patientId: 'bia', patientName: 'Bia Lima', start: new Date(2026, 9, 8, 14), end: new Date(2026, 9, 8, 14, 50) }),
    sessao('davi-cedo', { patientId: 'davi', patientName: 'Davi Rocha', start: new Date(2026, 9, 8, 8), end: new Date(2026, 9, 8, 8, 50) }),
    sessao('theo-cancelada', { patientId: 'theo', patientName: 'Theo Martins', start: new Date(2026, 9, 8, 16), end: new Date(2026, 9, 8, 16, 50), status: 'cancelado' }),
  ];

  it('a próxima sessão de cada criança: quem tem sessão mais cedo vem primeiro; sem próxima, no fim', () => {
    expect(criancasNaAgenda(sessoes, agora).map((c) => [c.nome, c.proxima?.getDate(), c.proxima?.getHours()])).toEqual([
      ['Bia Lima', 8, 14],
      ['Lucas Souza', 9, 9],
      ['Davi Rocha', undefined, undefined],
    ]);
  });

  it('os números do topo: sessões de hoje e dos próximos 7 dias, sem as canceladas', () => {
    expect(resumoDaAgenda(sessoes, agora)).toEqual({ hoje: 2, proximosDias: 2 });
  });
});
