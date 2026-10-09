// __tests__/lib/encaixes.test.ts
// O assistente de encaixe: opções de horário semanal para a criança, livres ou com uma troca segura
// (outra criança muda de horário no mesmo dia, com a mesma terapeuta, e continua emendada com outra
// terapia dela). Os horários são os da clínica (Brasília). Para simular a hospedagem, que roda em UTC:
// TZ=UTC npx jest __tests__/lib/encaixes.test.ts
import { AtendimentoDaAgenda, Bloqueio, bloqueiosDoNao, encontrarEncaixes, filtrarPorBloqueios, PedidoDeEncaixe, SalaDaClinica } from '@/lib/encaixes';
import { ProfissionalDaGrade } from '@/lib/horariosRecorrentes';

const HOJE = new Date('2026-10-01T09:00:00-03:00'); // uma quinta-feira
const TERCA = '2026-10-06';
const QUINTA = '2026-10-08';

const terapeuta = (id: string, fullName: string, especialidade: string, dias = ['terca', 'quinta']): ProfissionalDaGrade => ({
  id, fullName, especialidade, status: 'ativo', diasAtendimento: dias, horarioInicio: '13:00', horarioFim: '18:30',
});
const ana = terapeuta('prof-ana', 'Ana Costa', 'Fonoaudiologia');
const carla = terapeuta('prof-carla', 'Carla Dias', 'Fonoaudiologia');
const julia = terapeuta('prof-julia', 'Júlia Reis', 'Terapia Ocupacional', ['terca']);
const SALAS: SalaDaClinica[] = [{ id: 'sala-1', name: 'Sala Azul' }, { id: 'sala-2', name: 'Sala Verde' }];

const maisDias = (dia: string, dias: number) => {
  const d = new Date(`${dia}T12:00:00-03:00`);
  d.setDate(d.getDate() + dias);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(d);
};

/** Uma série semanal (12 semanas, se nada for dito) a partir do primeiro dia. */
const serie = (
  primeiroDia: string,
  inicio: string,
  fim: string,
  quem: { professionalId: string; patientId: string; patientName: string; tipo: string; sala?: string },
  semanas = 12
): AtendimentoDaAgenda[] =>
  Array.from({ length: semanas }, (_, i) => {
    const dia = maisDias(primeiroDia, i * 7);
    return {
      ...quem,
      status: 'agendado',
      start: new Date(`${dia}T${inicio}:00-03:00`),
      end: new Date(`${dia}T${fim}:00-03:00`),
    };
  });

const lucas = { patientId: 'paciente-lucas', patientName: 'Lucas Souza' };
const bia = { patientId: 'paciente-bia', patientName: 'Bia Lima' };
// O Lucas faz fono com a Ana às 14:10 e TO com a Júlia às 15:50, toda terça: há um buraco às 15:00
const agendaDoLucas = [
  ...serie(TERCA, '14:10', '15:00', { ...lucas, professionalId: 'prof-ana', tipo: 'Fonoaudiologia', sala: 'sala-1' }),
  ...serie(TERCA, '15:50', '16:40', { ...lucas, professionalId: 'prof-julia', tipo: 'Terapia Ocupacional', sala: 'sala-2' }),
];

const pedido = (extra: Partial<PedidoDeEncaixe> = {}): PedidoDeEncaixe => ({
  pacienteId: 'paciente-theo',
  necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 1 }],
  familia: { dias: ['terca'], desde: '14:00', ate: '15:00' },
  emendar: true,
  preferidos: [],
  ...extra,
});

const buscar = (p: PedidoDeEncaixe, atendimentos: AtendimentoDaAgenda[], extra: { profissionais?: ProfissionalDaGrade[]; bloqueios?: Bloqueio[] } = {}) =>
  encontrarEncaixes({ pedido: p, profissionais: extra.profissionais ?? [ana], atendimentos, salas: SALAS, bloqueios: extra.bloqueios, hoje: HOJE });

describe('horários livres', () => {
  it('com a agenda vazia, oferece os horários da família, livres nas 12 semanas', () => {
    const opcoes = buscar(pedido({ familia: { dias: ['terca', 'quinta'], desde: '14:00', ate: '16:00' } }), []);

    expect(opcoes.length).toBeGreaterThan(0);
    for (const opcao of opcoes) {
      expect(opcao.troca).toBeNull();
      expect(opcao.semanasLivres).toBe(12);
      for (const s of opcao.sessoes) {
        expect(['terca', 'quinta']).toContain(s.dia);
        expect(s.horario >= '14:00' && s.fim <= '16:00').toBe(true);
      }
    }
  });

  it('uma série curta, que vai ser renovada, não deixa o horário livre', () => {
    const curta = serie(TERCA, '14:10', '15:00', { ...bia, professionalId: 'prof-ana', tipo: 'Fonoaudiologia' }, 4);

    const opcoes = buscar(pedido(), curta);

    expect(opcoes.some((o) => o.troca === null && o.sessoes[0].horario === '14:10')).toBe(false);
  });

  it('duas vezes por semana: a mesma terapeuta, em dias espalhados', () => {
    const opcoes = buscar(
      pedido({ necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 2 }], familia: { dias: ['terca', 'quinta'], desde: '14:00', ate: '15:00' } }),
      []
    );

    expect(opcoes[0].sessoes.map((s) => [s.dia, s.profissional.nome])).toEqual([['terca', 'Ana Costa'], ['quinta', 'Ana Costa']]);
  });

  it('emenda as terapias no mesmo dia, para a família vir uma vez só', () => {
    const opcoes = buscar(
      pedido({
        necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 1 }, { terapia: 'Terapia Ocupacional', frequencia: 1 }],
        familia: { dias: ['terca'], desde: '14:00', ate: '17:00' },
      }),
      [],
      { profissionais: [ana, julia] }
    );

    expect(opcoes[0].diasEmendados).toEqual(['terca']);
    const [primeira, segunda] = opcoes[0].sessoes;
    expect(primeira.fim).toBe(segunda.horario);
  });

  it('a terapeuta de preferência vem antes', () => {
    const opcoes = buscar(pedido({ preferidos: ['prof-carla'] }), [], { profissionais: [ana, carla] });

    expect(opcoes[0].sessoes[0].profissional.nome).toBe('Carla Dias');
    expect(opcoes[0].sessoes[0].preferida).toBe(true);
  });

  it('sugere a sala que a terapeuta costuma usar, se estiver livre', () => {
    const daAnaNaSalaVerde = serie(QUINTA, '16:40', '17:30', { ...bia, professionalId: 'prof-ana', tipo: 'Fonoaudiologia', sala: 'sala-2' });

    const opcoes = buscar(pedido(), daAnaNaSalaVerde);

    expect(opcoes[0].sessoes[0].sala).toEqual({ id: 'sala-2', nome: 'Sala Verde' });
  });
});

describe('a agenda que conta', () => {
  const fonoDaAna = { ...bia, professionalId: 'prof-ana', tipo: 'Fonoaudiologia' };
  const horariosOferecidos = (atendimentos: AtendimentoDaAgenda[], p = pedido()) =>
    buscar(p, atendimentos).flatMap((o) => o.sessoes.filter((s) => !s.comTroca).map((s) => `${s.dia} ${s.horario}`));

  it('atendimento cancelado não ocupa o horário', () => {
    const cancelados = serie(TERCA, '14:10', '15:00', fonoDaAna).map((a) => ({ ...a, status: 'cancelado' }));

    expect(horariosOferecidos(cancelados)).toContain('terca 14:10');
  });

  it('só contam as próximas 12 semanas', () => {
    const depois = serie(maisDias(TERCA, 12 * 7), '14:10', '15:00', fonoDaAna);

    expect(horariosOferecidos(depois)).toContain('terca 14:10');
  });

  it('o horário em que a criança já tem outra terapia não serve', () => {
    const psicoDoTheo = serie(TERCA, '14:10', '15:00', { patientId: 'paciente-theo', patientName: 'Theo', professionalId: 'prof-rui', tipo: 'Psicologia' });

    expect(horariosOferecidos(psicoDoTheo)).not.toContain('terca 14:10');
  });

  it('só oferece quem atende a terapia, nos dias e horários de cada um', () => {
    const opcoes = encontrarEncaixes({
      pedido: pedido({ familia: { dias: [] } }), profissionais: [ana, julia], atendimentos: [], salas: SALAS, hoje: HOJE,
    });

    const sessoes = opcoes.flatMap((o) => o.sessoes);
    expect(new Set(sessoes.map((s) => s.profissional.nome))).toEqual(new Set(['Ana Costa']));
    expect(new Set(sessoes.map((s) => s.dia))).toEqual(new Set(['terca', 'quinta']));
    expect(sessoes.every((s) => s.horario >= '13:00' && s.fim <= '18:30')).toBe(true);
  });
});

describe('troca segura', () => {
  it('abre o horário mudando a outra criança no mesmo dia, com a mesma terapeuta, emendada com outra terapia dela', () => {
    const opcoes = buscar(pedido(), agendaDoLucas);

    const comTroca = opcoes.find((o) => o.troca);
    expect(comTroca?.sessoes[0]).toEqual(expect.objectContaining({ dia: 'terca', horario: '14:10', comTroca: true, semanasLivres: 12 }));
    expect(comTroca?.troca).toEqual(expect.objectContaining({
      paciente: { id: 'paciente-lucas', nome: 'Lucas Souza' },
      profissional: { id: 'prof-ana', nome: 'Ana Costa' },
      dia: 'terca', de: '14:10', para: '15:00',
      sala: { id: 'sala-1', nome: 'Sala Azul' },
      emendaCom: { horario: '15:50', terapia: 'Terapia Ocupacional' },
    }));
  });

  it('não mexe em quem não tem outra terapia no mesmo dia (a família teria de vir em outra hora à toa)', () => {
    const soAFono = agendaDoLucas.filter((a) => a.professionalId === 'prof-ana');

    expect(buscar(pedido(), soAFono).filter((o) => o.troca)).toEqual([]);
  });

  it('não troca horário ocupado por crianças diferentes em semanas diferentes', () => {
    const alternado = [
      ...agendaDoLucas.filter((_, i) => i % 2 === 0 || agendaDoLucas[i].professionalId !== 'prof-ana'),
      ...serie(maisDias(TERCA, 7), '14:10', '15:00', { ...bia, professionalId: 'prof-ana', tipo: 'Fonoaudiologia' }, 1),
    ];

    expect(buscar(pedido(), alternado).filter((o) => o.troca)).toEqual([]);
  });

  it('com a sala da outra criança ocupada às 15:00, ela vai para depois da TO, ainda emendada', () => {
    const salaOcupada = serie(TERCA, '15:00', '15:50', { ...bia, professionalId: 'prof-carla', tipo: 'Fonoaudiologia', sala: 'sala-1' });

    const trocas = buscar(pedido(), [...agendaDoLucas, ...salaOcupada]).flatMap((o) => (o.troca ? [o.troca] : []));

    expect(trocas.map((t) => t.para)).toEqual(['16:40']);
    expect(trocas[0].emendaCom).toEqual({ horario: '15:50', terapia: 'Terapia Ocupacional' });
  });

  it('não troca para onde a terapeuta, a sala ou a própria criança já estão ocupadas', () => {
    const ocupado = [
      ...serie(TERCA, '15:00', '15:50', { ...bia, professionalId: 'prof-ana', tipo: 'Fonoaudiologia' }),
      ...serie(TERCA, '16:40', '17:30', { ...bia, professionalId: 'prof-carla', tipo: 'Fonoaudiologia', sala: 'sala-1' }),
    ];

    expect(buscar(pedido(), [...agendaDoLucas, ...ocupado]).filter((o) => o.troca)).toEqual([]);
  });

  it('o horário livre vem antes do que precisa de troca', () => {
    const opcoes = buscar(pedido({ familia: { dias: ['terca'], desde: '13:00', ate: '15:00' } }), agendaDoLucas);

    expect(opcoes[0].troca).toBeNull();
    expect(opcoes.some((o) => o.troca)).toBe(true);
  });

  it('no máximo uma troca por opção', () => {
    // A Bia faz fono com a Carla às 14:10 e psico às 15:50: as duas fonos só cabem com troca
    const agendaDaBia = [
      ...serie(TERCA, '14:10', '15:00', { ...bia, professionalId: 'prof-carla', tipo: 'Fonoaudiologia' }),
      ...serie(TERCA, '15:50', '16:40', { ...bia, professionalId: 'prof-rui', tipo: 'Psicologia' }),
    ];
    const opcoes = buscar(
      pedido({ necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 2 }] }),
      [...agendaDoLucas, ...agendaDaBia],
      { profissionais: [ana, carla] }
    );

    for (const opcao of opcoes) expect(opcao.sessoes.filter((s) => s.comTroca).length).toBeLessThanOrEqual(1);
  });
});

describe('o que a coordenação recusou não volta', () => {
  it('"a família não aceita mudar": nenhuma troca com aquela criança', () => {
    const opcoes = buscar(pedido(), agendaDoLucas, { bloqueios: [{ tipo: 'nao_mexer', pacienteId: 'paciente-lucas' }] });

    expect(opcoes.filter((o) => o.troca)).toEqual([]);
  });

  it('"o horário é ruim para a família": o horário sai das opções da criança', () => {
    const p = pedido({ familia: { dias: ['terca'], desde: '14:00', ate: '16:00' } });
    const bloqueios: Bloqueio[] = [{ tipo: 'horario', pacienteId: 'paciente-theo', dia: 'terca', horario: '15:00' }];

    const opcoes = buscar(p, [], { bloqueios });

    expect(opcoes.flatMap((o) => o.sessoes.map((s) => s.horario))).not.toContain('15:00');
  });

  it('a troca recusada e a opção recusada não voltam', () => {
    const [comTroca] = buscar(pedido(), agendaDoLucas).filter((o) => o.troca);

    expect(buscar(pedido(), agendaDoLucas, { bloqueios: [{ tipo: 'troca', chave: comTroca.troca!.chave }] }).filter((o) => o.troca)).toEqual([]);
    expect(buscar(pedido(), agendaDoLucas, { bloqueios: [{ tipo: 'opcao', chave: comTroca.chave }] }).map((o) => o.chave)).not.toContain(comTroca.chave);
  });
});

it('a terapia que não cabe todas as vezes pedidas aparece como faltando', () => {
  const opcoes = buscar(pedido({ necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 2 }] }), []);

  expect(opcoes[0].faltam).toEqual([{ terapia: 'Fonoaudiologia', sessoes: 1 }]);
});

it('responde rápido com a clínica cheia (muitas terapeutas, a semana toda, várias terapias)', () => {
  const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'];
  const equipe = [
    ...Array.from({ length: 6 }, (_, i) => ({ ...terapeuta(`fono-${i}`, `Fono ${i}`, 'Fonoaudiologia', dias), horarioInicio: '07:00' })),
    ...Array.from({ length: 4 }, (_, i) => ({ ...terapeuta(`to-${i}`, `TO ${i}`, 'Terapia Ocupacional', dias), horarioInicio: '07:00' })),
    ...Array.from({ length: 4 }, (_, i) => ({ ...terapeuta(`psi-${i}`, `Psi ${i}`, 'Psicologia', dias), horarioInicio: '07:00' })),
  ];
  // Metade dos horários de cada uma ocupada por séries de crianças diferentes
  const horas = [['08:10', '09:00'], ['09:50', '10:40'], ['13:20', '14:10'], ['15:00', '15:50'], ['16:40', '17:30']];
  const agenda = equipe.flatMap((p, i) =>
    [0, 1, 2, 3, 4].flatMap((d) =>
      horas.filter((_, h) => (h + d + i) % 2 === 0).flatMap(([inicio, fim], h) =>
        serie(maisDias('2026-10-05', d), inicio, fim, { professionalId: p.id, patientId: `crianca-${i}-${d}-${h}`, patientName: 'X', tipo: p.especialidade! })
      )
    )
  );

  const comeco = Date.now();
  const opcoes = encontrarEncaixes({
    pedido: pedido({
      necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 2 }, { terapia: 'Terapia Ocupacional', frequencia: 2 }, { terapia: 'Psicologia', frequencia: 1 }],
      familia: { dias: [] },
    }),
    profissionais: equipe, atendimentos: agenda, salas: SALAS, hoje: HOJE,
  });

  expect(opcoes.length).toBeGreaterThan(0);
  expect(Date.now() - comeco).toBeLessThan(3000);
});

describe('depois do "Não"', () => {
  it('cada motivo bloqueia só o necessário', () => {
    const [comTroca] = buscar(pedido(), agendaDoLucas).filter((o) => o.troca);

    expect(bloqueiosDoNao('familia_da_troca', comTroca, 'paciente-theo')).toEqual([{ tipo: 'nao_mexer', pacienteId: 'paciente-lucas' }]);
    expect(bloqueiosDoNao('horario_ruim', comTroca, 'paciente-theo')).toEqual([{ tipo: 'horario', pacienteId: 'paciente-theo', dia: 'terca', horario: '14:10' }]);
    expect(bloqueiosDoNao('terapeuta', comTroca, 'paciente-theo')).toEqual([{ tipo: 'troca', chave: comTroca.troca!.chave }]);
    expect(bloqueiosDoNao('outro', comTroca, 'paciente-theo')).toEqual([{ tipo: 'opcao', chave: comTroca.chave }]);
  });

  it('as opções na tela somem como sumiriam numa busca nova', () => {
    const p = pedido({ familia: { dias: ['terca'], desde: '13:00', ate: '15:00' } });
    const opcoes = buscar(p, agendaDoLucas);
    const bloqueios = bloqueiosDoNao('familia_da_troca', opcoes.find((o) => o.troca)!, 'paciente-theo');

    expect(filtrarPorBloqueios(opcoes, bloqueios, 'paciente-theo').map((o) => o.chave))
      .toEqual(buscar(p, agendaDoLucas, { bloqueios }).map((o) => o.chave));
  });
});

it('a melhor troca aparece entre as 3 primeiras, mesmo com várias opções livres antes dela', () => {
  // Muitas livres (Carla, a semana toda) e uma troca possível com a Ana
  const opcoes = buscar(
    pedido({ familia: { dias: ['terca', 'quinta'], desde: '13:00', ate: '18:30' }, preferidos: ['prof-ana'] }),
    [...agendaDoLucas, ...serie(TERCA, '13:20', '14:10', { ...bia, professionalId: 'prof-ana', tipo: 'Fonoaudiologia' })],
    { profissionais: [ana, carla] }
  );

  expect(opcoes.length).toBeGreaterThan(3);
  expect(opcoes.slice(0, 3).some((o) => o.troca)).toBe(true);
  expect(opcoes[0].troca).toBeNull();
});
