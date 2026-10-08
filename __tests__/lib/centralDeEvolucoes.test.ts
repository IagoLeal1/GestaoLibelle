// __tests__/lib/centralDeEvolucoes.test.ts
// A página de Evoluções do admin e da coordenação: a situação de cada sessão, os números que também
// filtram, os filtros e a lista por dia. Tudo sai da agenda, sem ler o texto das evoluções.
import {
  agruparPorDia, intervaloDoPeriodo, rotuloDaSituacao, sessoesDaCentral, situacaoDaSessao, type Filtros,
} from '@/lib/centralDeEvolucoes';
import type { SessaoDaAgenda } from '@/lib/evolucoes';

const AGORA = new Date(2026, 9, 14, 18, 0); // terça, 14/10, 18h
const DESDE = new Date(2026, 9, 6);
const quando = { agora: AGORA, desde: DESDE };

let n = 0;
const sessao = (dia: number, hora: number, extra: Partial<SessaoDaAgenda> = {}): SessaoDaAgenda => ({
  id: `s${++n}`,
  patientId: 'lucas',
  patientName: 'Lucas Souza',
  professionalId: 'paula',
  professionalName: 'Paula Fonoaudióloga',
  tipo: 'Fonoaudiologia',
  start: new Date(2026, 9, dia, hora, 0),
  end: new Date(2026, 9, dia, hora, 50),
  status: 'agendado',
  ...extra,
});

describe('situacaoDaSessao', () => {
  it('escrita, não aconteceu e pendente', () => {
    expect(situacaoDaSessao(sessao(14, 9, { evolucao: 'escrita' }), quando)).toBe('escrita');
    expect(situacaoDaSessao(sessao(14, 9, { evolucao: 'nao_aconteceu' }), quando)).toBe('nao_aconteceu');
    expect(situacaoDaSessao(sessao(14, 9), quando)).toBe('pendente');
  });

  it('não bate com a recepção: escrita numa sessão com falta, ou "não aconteceu" numa finalizada', () => {
    expect(situacaoDaSessao(sessao(14, 9, { evolucao: 'escrita', status: 'nao_compareceu' }), quando)).toBe('nao_bate');
    expect(situacaoDaSessao(sessao(14, 9, { evolucao: 'nao_aconteceu', status: 'finalizado' }), quando)).toBe('nao_bate');
  });

  it('fica de fora: sessão que ainda não terminou, falta sem evolução e sessão de antes do começo', () => {
    expect(situacaoDaSessao(sessao(14, 17, { end: new Date(2026, 9, 14, 18, 30) }), quando)).toBeNull();
    expect(situacaoDaSessao(sessao(14, 9, { status: 'nao_compareceu' }), quando)).toBeNull();
    expect(situacaoDaSessao(sessao(3, 9), quando)).toBeNull();
  });
});

describe('intervaloDoPeriodo', () => {
  it('hoje, ontem, 7 e 14 dias contam o dia de hoje inteiro', () => {
    expect(intervaloDoPeriodo('hoje', AGORA)).toEqual({ de: new Date(2026, 9, 14), ate: new Date(2026, 9, 14, 23, 59, 59, 999) });
    expect(intervaloDoPeriodo('ontem', AGORA)).toEqual({ de: new Date(2026, 9, 13), ate: new Date(2026, 9, 13, 23, 59, 59, 999) });
    expect(intervaloDoPeriodo('7dias', AGORA).de).toEqual(new Date(2026, 9, 8));
    expect(intervaloDoPeriodo('14dias', AGORA).de).toEqual(new Date(2026, 9, 1));
  });

  it('datas escolhidas valem do começo do primeiro ao fim do último dia', () => {
    expect(intervaloDoPeriodo('datas', AGORA, { de: new Date(2026, 9, 7, 15), ate: new Date(2026, 9, 9, 8) })).toEqual({
      de: new Date(2026, 9, 7),
      ate: new Date(2026, 9, 9, 23, 59, 59, 999),
    });
  });
});

describe('sessoesDaCentral', () => {
  const sessoes = [
    sessao(14, 9, { evolucao: 'escrita' }),
    sessao(14, 10, { patientId: 'bia', patientName: 'Bia Lima', professionalId: 'rui', professionalName: 'Rui Psicólogo', tipo: 'Psicologia', evolucao: 'escrita' }),
    sessao(14, 11, { patientName: 'Théo Martins', patientId: 'theo', evolucao: 'escrita', status: 'cancelado' }),
    sessao(14, 14, { patientId: 'davi', patientName: 'Davi Rocha', professionalId: 'lia', professionalName: 'Lia TO', tipo: 'Terapia Ocupacional' }),
    sessao(13, 15, { patientId: 'bia', patientName: 'Bia Lima', professionalId: 'rui', professionalName: 'Rui Psicólogo', tipo: 'Psicologia', evolucao: 'nao_aconteceu' }),
    sessao(2, 9, { evolucao: 'escrita' }), // antes do começo das evoluções
  ];
  const filtros = (extra: Partial<Filtros> = {}): Filtros => ({ periodo: '7dias', ...extra });

  it('conta cada situação e calcula quantas sessões estão em dia', () => {
    const { contagem, emDia, lista } = sessoesDaCentral(sessoes, filtros(), quando);

    expect(contagem).toEqual({ escrita: 2, pendente: 1, nao_bate: 1, nao_aconteceu: 1 });
    expect(emDia).toBe(80);
    expect(lista).toHaveLength(5);
  });

  it('a situação escolhida filtra a lista, mas os números continuam contando tudo', () => {
    const { contagem, lista } = sessoesDaCentral(sessoes, filtros({ situacao: 'pendente' }), quando);

    expect(lista.map((s) => s.patientName)).toEqual(['Davi Rocha']);
    expect(contagem.escrita).toBe(2);
  });

  it('filtra por terapeuta, por terapia e pelo nome da criança, sem precisar de acento', () => {
    expect(sessoesDaCentral(sessoes, filtros({ terapeuta: 'rui' }), quando).lista).toHaveLength(2);
    expect(sessoesDaCentral(sessoes, filtros({ terapia: 'Terapia Ocupacional' }), quando).lista).toHaveLength(1);
    expect(sessoesDaCentral(sessoes, filtros({ busca: 'theo' }), quando).lista.map((s) => s.patientName)).toEqual(['Théo Martins']);
  });

  it('o período deixa de fora as sessões de outros dias', () => {
    expect(sessoesDaCentral(sessoes, filtros({ periodo: 'ontem' }), quando).lista.map((s) => s.patientName)).toEqual(['Bia Lima']);
  });

  it('por terapeuta: quantas fez e quantas faltam, quem tem pendência primeiro', () => {
    const { porTerapeuta } = sessoesDaCentral(sessoes, filtros({ terapeuta: 'paula' }), quando);

    // O filtro de terapeuta não esconde os colegas aqui: é a lista para escolher
    expect(porTerapeuta.map((t) => [t.nome, t.feitas, t.pendentes])).toEqual([
      ['Lia TO', 0, 1],
      ['Paula Fonoaudióloga', 2, 0],
      ['Rui Psicólogo', 2, 0],
    ]);
  });

  it('cada terapeuta vem com a terapia que mais atende no período', () => {
    const { porTerapeuta } = sessoesDaCentral(sessoes, filtros(), quando);

    expect(Object.fromEntries(porTerapeuta.map((t) => [t.nome, t.terapia]))).toEqual({
      'Lia TO': 'Terapia Ocupacional',
      'Paula Fonoaudióloga': 'Fonoaudiologia',
      'Rui Psicólogo': 'Psicologia',
    });
  });

  it('as opções de terapeuta e de terapia saem das sessões do período', () => {
    const { terapeutas, terapias } = sessoesDaCentral(sessoes, filtros(), quando);

    expect(terapeutas.map((t) => t.nome)).toEqual(['Lia TO', 'Paula Fonoaudióloga', 'Rui Psicólogo']);
    expect(terapias).toEqual(['Fonoaudiologia', 'Psicologia', 'Terapia Ocupacional']);
  });
});

describe('agruparPorDia', () => {
  it('o dia mais recente primeiro e, dentro do dia, na ordem dos horários', () => {
    const { lista } = sessoesDaCentral(
      [sessao(13, 15, { evolucao: 'escrita' }), sessao(14, 14), sessao(14, 9, { evolucao: 'escrita' })],
      { periodo: '7dias' },
      quando
    );
    const dias = agruparPorDia(lista);

    expect(dias.map((d) => d.sessoes.map((s) => s.start.getHours()))).toEqual([[9, 14], [15]]);
  });
});

describe('rotuloDaSituacao', () => {
  it('a pendente atrasada diz há quantos dias; as outras, a situação', () => {
    const { lista } = sessoesDaCentral(
      [sessao(14, 9, { id: 'hoje' }), sessao(12, 9, { id: 'anteontem' }), sessao(14, 10, { id: 'escrita', evolucao: 'escrita' })],
      { periodo: '7dias' },
      quando
    );
    const rotulo = (id: string) => rotuloDaSituacao(lista.find((s) => s.id === id)!, AGORA);

    expect([rotulo('hoje'), rotulo('anteontem'), rotulo('escrita')]).toEqual(['Pendente', 'Atrasada há 2 dias', 'Escrita']);
  });
});
