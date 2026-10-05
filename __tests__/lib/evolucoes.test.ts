// __tests__/lib/evolucoes.test.ts
// O que cada terapeuta tem para escrever, o resumo da equipe para a coordenação e as evoluções que
// não batem com o que a recepção marcou na agenda. A sessão da agenda guarda só a marca da
// evolução ("escrita" ou "nao_aconteceu"); o texto fica na evolução.
import {
  incompatibilidade, inicioDaJanela, paraConferir, paraEscrever, resumoDaEquipe, textoDoAtraso, ultimaEvolucao,
} from '@/lib/evolucoes';

// Segunda, 12/10/2026, 15h
const AGORA = new Date(2026, 9, 12, 15, 0);
const DESDE = new Date(2026, 9, 1);

const sessao = (id: string, dia: number, hora: number, extra: Record<string, unknown> = {}) => {
  const start = new Date(2026, 9, dia, hora, 0);
  return {
    id,
    patientId: 'lucas',
    patientName: 'Lucas Souza',
    professionalId: 'prof-paula',
    professionalName: 'Paula Fonoaudióloga',
    tipo: 'Fonoaudiologia',
    start,
    end: new Date(start.getTime() + 50 * 60 * 1000),
    status: 'agendado',
    ...extra,
  };
};

const evolucao = (appointmentId: string, extra: Record<string, unknown> = {}) => ({
  appointmentId,
  patientId: 'lucas',
  patientName: 'Lucas Souza',
  professionalId: 'prof-paula',
  professionalName: 'Paula Fonoaudióloga',
  terapia: 'Fonoaudiologia',
  dataDaSessao: new Date(2026, 9, 12, 9, 0),
  autorId: 'paula',
  autorNome: 'Paula Fonoaudióloga',
  aconteceu: true,
  trabalhado: 'Fonema /r/.',
  resposta: 'Participou bem.',
  orientacao: 'Treinar em casa.',
  proximaSessao: 'Palavras com /r/.',
  ...extra,
});

const ids = (lista: { sessao: { id: string } }[]) => lista.map((p) => p.sessao.id);

describe('para escrever', () => {
  it('a sessão entra quando termina o horário, sem esperar a recepção marcar presença', () => {
    const lista = paraEscrever(
      [sessao('manha', 12, 9), sessao('agora', 12, 14, { status: 'em_atendimento', start: new Date(2026, 9, 12, 14, 40), end: new Date(2026, 9, 12, 15, 30) }), sessao('tarde', 12, 16)],
      { agora: AGORA, desde: DESDE }
    );

    expect(ids(lista)).toEqual(['manha']);
  });

  it('falta, cancelamento e sessão já escrita (ou informada como não aconteceu) saem da lista', () => {
    const lista = paraEscrever(
      [
        sessao('faltou', 12, 8, { status: 'nao_compareceu' }),
        sessao('cancelada', 12, 9, { status: 'cancelado' }),
        sessao('escrita', 12, 10, { status: 'finalizado', evolucao: 'escrita' }),
        sessao('nao-aconteceu', 12, 11, { evolucao: 'nao_aconteceu' }),
        sessao('falta-escrever', 12, 12, { status: 'finalizado' }),
      ],
      { agora: AGORA, desde: DESDE }
    );

    expect(ids(lista)).toEqual(['falta-escrever']);
  });

  it('as mais antigas vêm primeiro, com quantos dias de atraso', () => {
    const lista = paraEscrever([sessao('hoje', 12, 9), sessao('quinta', 8, 10), sessao('sexta', 9, 10)], {
      agora: AGORA,
      desde: DESDE,
    });

    expect(lista.map((p) => [p.sessao.id, p.diasDeAtraso])).toEqual([['quinta', 4], ['sexta', 3], ['hoje', 0]]);
  });

  it('não cobra sessões de antes do começo das evoluções', () => {
    const lista = paraEscrever([sessao('antes', 30, 9, { start: new Date(2026, 8, 30, 9), end: new Date(2026, 8, 30, 9, 50) }), sessao('depois', 1, 9)], {
      agora: AGORA,
      desde: DESDE,
    });

    expect(ids(lista)).toEqual(['depois']);
  });
});

describe('textos e janela', () => {
  it('o atraso por extenso', () => {
    expect(textoDoAtraso(0)).toBe('Hoje');
    expect(textoDoAtraso(1)).toBe('Atrasada há 1 dia');
    expect(textoDoAtraso(4)).toBe('Atrasada há 4 dias');
  });

  it('a cobrança olha os últimos 14 dias, nunca antes do começo das evoluções', () => {
    expect(inicioDaJanela(AGORA, new Date(2026, 8, 1))).toEqual(new Date(2026, 8, 29));
    expect(inicioDaJanela(AGORA, DESDE)).toEqual(DESDE);
  });
});

describe('incompatível com a recepção', () => {
  it('evolução escrita, mas a recepção marcou falta ou cancelamento', () => {
    expect(incompatibilidade(sessao('a', 12, 9, { status: 'nao_compareceu' }), true)).toBe('A recepção marcou falta nesta sessão.');
    expect(incompatibilidade(sessao('a', 12, 9, { status: 'cancelado' }), true)).toBe('A recepção marcou esta sessão como cancelada.');
  });

  it('"não aconteceu", mas a recepção marcou que a criança veio', () => {
    expect(incompatibilidade(sessao('a', 12, 9, { status: 'finalizado' }), false)).toBe('A recepção marcou que a criança veio.');
  });

  it('a sessão saiu da agenda depois da evolução', () => {
    expect(incompatibilidade(undefined, true)).toBe('A sessão não está mais na agenda.');
  });

  it('quando bate, ou a recepção ainda não marcou, não há alerta', () => {
    expect(incompatibilidade(sessao('a', 12, 9, { status: 'finalizado' }), true)).toBeNull();
    expect(incompatibilidade(sessao('a', 12, 9), true)).toBeNull();
    expect(incompatibilidade(sessao('a', 12, 9, { status: 'nao_compareceu' }), false)).toBeNull();
  });

  it('a coordenação vê a lista para conferir, pela marca da evolução na agenda', () => {
    const lista = paraConferir([
      sessao('ok', 12, 9, { status: 'finalizado', evolucao: 'escrita' }),
      sessao('faltou', 12, 10, { status: 'nao_compareceu', evolucao: 'escrita' }),
      sessao('sem-evolucao', 12, 11, { status: 'nao_compareceu' }),
    ]);

    expect(lista.map((c) => [c.sessao.id, c.motivo])).toEqual([['faltou', 'A recepção marcou falta nesta sessão.']]);
  });
});

describe('resumo da equipe', () => {
  it('conta, por terapeuta, as sessões que pedem evolução, as escritas e as pendentes; quem tem pendência vem primeiro', () => {
    const rui = { professionalId: 'prof-rui', professionalName: 'Rui Psicólogo', tipo: 'Psicologia' };
    const resumo = resumoDaEquipe(
      [
        sessao('p1', 12, 9, { evolucao: 'escrita' }),
        sessao('p2', 12, 10, { evolucao: 'escrita' }),
        sessao('p3', 12, 11, { status: 'nao_compareceu' }),
        sessao('r1', 12, 9, { ...rui, evolucao: 'escrita' }),
        sessao('r2', 12, 10, { ...rui, evolucao: 'nao_aconteceu' }),
        sessao('r3', 12, 11, rui),
        sessao('futura', 12, 17, rui),
      ],
      { agora: AGORA, desde: DESDE }
    );

    expect(resumo.porTerapeuta.map((t) => [t.nome, t.sessoes, t.escritas, t.pendentes.length])).toEqual([
      ['Rui Psicólogo', 3, 2, 1],
      ['Paula Fonoaudióloga', 2, 2, 0],
    ]);
    expect(resumo).toMatchObject({ escritas: 4, pendentes: 1, emDia: 80 });
  });

  it('sem sessões, a equipe está 100% em dia', () => {
    expect(resumoDaEquipe([], { agora: AGORA, desde: DESDE }).emDia).toBe(100);
  });
});

describe('última evolução', () => {
  it('é a mais recente da mesma terapia, antes da sessão, que de fato aconteceu', () => {
    const historia = [
      evolucao('psico', { terapia: 'Psicologia', dataDaSessao: new Date(2026, 9, 9) }),
      evolucao('nao-veio', { dataDaSessao: new Date(2026, 9, 8), aconteceu: false }),
      evolucao('fono-antiga', { dataDaSessao: new Date(2026, 9, 1) }),
      evolucao('fono-ultima', { dataDaSessao: new Date(2026, 9, 5) }),
      evolucao('depois', { dataDaSessao: new Date(2026, 9, 13) }),
    ];

    expect(ultimaEvolucao(historia, { terapia: 'Fonoaudiologia', antesDe: new Date(2026, 9, 12, 9) })?.appointmentId).toBe('fono-ultima');
  });
});
