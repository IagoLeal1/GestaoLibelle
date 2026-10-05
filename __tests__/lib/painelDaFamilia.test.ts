// __tests__/lib/painelDaFamilia.test.ts
// Os próximos atendimentos na tela inicial da família. Antes apareciam os cancelados, a sala pelo
// código interno, o status como está gravado ("nao_compareceu") e a data sem o mês.
import { partesDaData, proximosAtendimentos } from '@/lib/painelDaFamilia';

const SALAS = [{ id: 'k2Xb9', name: 'Sala Azul' }];

const atendimento = (id: string, dia: number, extra: Record<string, unknown> = {}) => ({
  id,
  start: new Date(2026, 9, dia, 9, 0),
  patientName: 'Lucas Souza',
  professionalName: 'Paula Fonoaudióloga',
  tipo: 'Fonoaudiologia',
  status: 'agendado',
  ...extra,
});

describe('próximos atendimentos da família', () => {
  it('não mostra os cancelados e segue a ordem das datas', () => {
    const lista = proximosAtendimentos(
      [atendimento('c', 20), atendimento('a', 6), atendimento('b', 13, { status: 'cancelado' })],
      { salas: SALAS, criancas: 1 }
    );

    expect(lista.map((a) => a.id)).toEqual(['a', 'c']);
  });

  it('mostra o nome da sala, nunca o código; sala desconhecida não aparece', () => {
    const [comSala, salaApagada, semSala] = proximosAtendimentos(
      [atendimento('a', 6, { sala: 'k2Xb9' }), atendimento('b', 7, { sala: 'zz99' }), atendimento('c', 8)],
      { salas: SALAS, criancas: 1 }
    );

    expect(comSala.sala).toBe('Sala Azul');
    expect(salaApagada.sala).toBeUndefined();
    expect(semSala.sala).toBeUndefined();
  });

  it('o status aparece por extenso', () => {
    const lista = proximosAtendimentos(
      [atendimento('a', 6), atendimento('b', 7, { status: 'nao_compareceu' }), atendimento('c', 8, { status: 'em_atendimento' })],
      { salas: SALAS, criancas: 1 }
    );

    expect(lista.map((a) => a.status.rotulo)).toEqual(['Agendado', 'Não compareceu', 'Em atendimento']);
  });

  it('o nome da criança só aparece quando a família tem mais de uma', () => {
    const umFilho = proximosAtendimentos([atendimento('a', 6)], { salas: SALAS, criancas: 1 });
    const doisFilhos = proximosAtendimentos([atendimento('a', 6)], { salas: SALAS, criancas: 2 });

    expect(umFilho[0].crianca).toBeUndefined();
    expect(doisFilhos[0].crianca).toBe('Lucas Souza');
  });

  it('mostra no máximo cinco', () => {
    const muitos = Array.from({ length: 8 }, (_, i) => atendimento(`a${i}`, i + 1));

    expect(proximosAtendimentos(muitos, { salas: SALAS, criancas: 1 })).toHaveLength(5);
  });
});

describe('data do cartão', () => {
  it('tem o dia da semana, o dia, o mês e a hora', () => {
    expect(partesDaData(new Date(2026, 9, 11, 9, 0))).toEqual({ diaDaSemana: 'dom', dia: '11', mes: 'out', hora: '09:00' });
  });
});
