// __tests__/lib/telaInicial.test.ts
// A lista "Agora e a seguir" e os números do dia nas telas iniciais da gestão e do terapeuta.
// Antes a lista mostrava os 5 primeiros do dia contando da meia-noite: às 15h ainda apareciam os da
// manhã, e num dia cheio os da tarde nunca entravam. A sala aparecia como "N/A", e o número de
// atendimentos de hoje só contava os ainda "agendados", então ia diminuindo ao longo do dia.
import { agendaDeHoje, numerosDoDia } from '@/lib/telaInicial';

const SALAS = [{ id: 'k2Xb9', name: 'Sala Azul' }];
const AS_10H = new Date(2026, 9, 5, 10, 0);

// Sessões de 50 minutos no dia 05/10/2026
const atendimento = (id: string, hora: number, minuto = 0, extra: Record<string, unknown> = {}) => {
  const start = new Date(2026, 9, 5, hora, minuto);
  return {
    id,
    start,
    end: new Date(start.getTime() + 50 * 60 * 1000),
    patientName: 'Lucas Souza',
    professionalName: 'Paula Fonoaudióloga',
    tipo: 'Fonoaudiologia',
    status: 'agendado',
    ...extra,
  };
};

const ids = (itens: { id: string }[]) => itens.map((i) => i.id);
const tarde = () => [11, 12, 13, 14, 15, 16, 17].map((h) => atendimento(`${h}h`, h));

describe('agora e a seguir', () => {
  it('começa do agora: os que já terminaram e os cancelados não aparecem', () => {
    const agenda = agendaDeHoje(
      [
        atendimento('14h', 14),
        atendimento('8h', 8, 0, { status: 'finalizado' }),
        atendimento('8h-sem-marcar', 8),
        atendimento('12h-cancelado', 12, 0, { status: 'cancelado' }),
        atendimento('11h', 11),
      ],
      { agora: AS_10H, salas: SALAS }
    );

    expect(ids(agenda.agora)).toEqual([]);
    expect(ids(agenda.aSeguir)).toEqual(['11h', '14h']);
  });

  it('o que está acontecendo fica em "Agora": em atendimento, ou agendado no horário', () => {
    const agenda = agendaDeHoje(
      [
        atendimento('no-horario', 9, 30), // 9h30 às 10h20, ainda como agendado
        atendimento('passou-da-hora', 9, 0, { status: 'em_atendimento' }), // 9h às 9h50, mas não terminou
        atendimento('acabou-cedo', 9, 30, { status: 'finalizado' }),
        atendimento('faltou', 9, 30, { status: 'nao_compareceu' }),
        atendimento('11h', 11),
      ],
      { agora: AS_10H, salas: SALAS }
    );

    expect(ids(agenda.agora)).toEqual(['passou-da-hora', 'no-horario']);
    expect(ids(agenda.aSeguir)).toEqual(['11h']);
  });

  it('com limite, mostra os próximos e conta quantos ficam para mais tarde', () => {
    const agenda = agendaDeHoje(tarde(), { agora: AS_10H, salas: SALAS, limite: 5 });

    expect(ids(agenda.aSeguir)).toEqual(['11h', '12h', '13h', '14h', '15h']);
    expect(agenda.maisTarde).toBe(2);
  });

  it('sem limite, mostra o resto do dia inteiro', () => {
    const agenda = agendaDeHoje(tarde(), { agora: AS_10H, salas: SALAS });

    expect(agenda.aSeguir).toHaveLength(7);
    expect(agenda.maisTarde).toBe(0);
  });

  it('mostra o nome da sala, nunca o código; sem sala conhecida, não aparece nada', () => {
    const agenda = agendaDeHoje(
      [atendimento('a', 11, 0, { sala: 'k2Xb9' }), atendimento('b', 12, 0, { sala: 'zz99' }), atendimento('c', 13)],
      { agora: AS_10H, salas: SALAS }
    );

    expect(agenda.aSeguir.map((i) => i.sala)).toEqual(['Sala Azul', undefined, undefined]);
  });

  it('cada item tem a hora, a criança, o profissional, a terapia e o status por extenso', () => {
    const [item] = agendaDeHoje([atendimento('a', 11, 30)], { agora: AS_10H, salas: SALAS }).aSeguir;

    expect(item).toMatchObject({
      hora: '11:30',
      paciente: 'Lucas Souza',
      profissional: 'Paula Fonoaudióloga',
      terapia: 'Fonoaudiologia',
      status: { rotulo: 'Agendado' },
    });
  });

  it('sem o fim gravado, o agendado não vira "agora" pelo horário', () => {
    const agenda = agendaDeHoje([atendimento('sem-fim', 9, 30, { end: undefined })], { agora: AS_10H, salas: SALAS });

    expect(ids(agenda.agora)).toEqual([]);
  });
});

describe('números do dia', () => {
  it('contam o dia inteiro: os atendimentos sem os cancelados, os finalizados e as faltas com os cancelados', () => {
    const numeros = numerosDoDia([
      atendimento('a', 8, 0, { status: 'finalizado' }),
      atendimento('b', 9, 30, { status: 'em_atendimento' }),
      atendimento('c', 9, 0, { status: 'nao_compareceu' }),
      atendimento('d', 11),
      atendimento('e', 12, 0, { status: 'cancelado' }),
    ]);

    expect(numeros).toEqual({ hoje: 4, finalizados: 1, faltasECancelados: 2 });
  });
});
