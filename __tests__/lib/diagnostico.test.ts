// __tests__/lib/diagnostico.test.ts
// O diagnóstico da criança (ficha › Diagnóstico e topo do prontuário), seguindo o desenho aprovado:
// uma lista com nome, CID opcional e situação; e a equipe, que sai da agenda de 30 dias para trás e
// para a frente: cada terapia com o terapeuta e os dias da semana.
import { diagnosticosDaFicha, diasDaSemana, equipeDaCrianca, limparDiagnosticos } from '@/lib/diagnostico';

describe('limparDiagnosticos', () => {
  it('tira espaços e linhas vazias, põe o CID em maiúsculas e o confirmado como padrão', () => {
    expect(limparDiagnosticos([
      { nome: '  TEA · nível 1 ', cid: ' f84.0 ', situacao: 'confirmado' },
      { nome: '   ', cid: 'F90.0' },
      { nome: 'TDAH', cid: '', situacao: 'investigacao' },
      { nome: 'Atraso de fala' },
    ])).toEqual([
      { nome: 'TEA · nível 1', cid: 'F84.0', situacao: 'confirmado' },
      { nome: 'TDAH', situacao: 'investigacao' },
      { nome: 'Atraso de fala', situacao: 'confirmado' },
    ]);
  });

  it('corta textos enormes e guarda no máximo 10 diagnósticos', () => {
    const lista = limparDiagnosticos(Array.from({ length: 12 }, (_, i) => ({ nome: `D${i} ${'x'.repeat(300)}`, cid: 'C'.repeat(40) })));

    expect(lista).toHaveLength(10);
    expect(lista[0].nome).toHaveLength(200);
    expect(lista[0].cid).toHaveLength(20);
  });
});

it('diagnosticosDaFicha aceita fichas antigas (sem o campo) e ignora o que não for diagnóstico', () => {
  expect(diagnosticosDaFicha(undefined)).toEqual([]);
  expect(diagnosticosDaFicha('TEA')).toEqual([]);
  expect(diagnosticosDaFicha([{ nome: 'TEA', situacao: 'confirmado' }, { cid: 'F84' }, null])).toEqual([{ nome: 'TEA', situacao: 'confirmado' }]);
});

it('diasDaSemana escreve os dias em ordem, de segunda a domingo, sem repetir', () => {
  // 05/10/2026 é segunda-feira
  expect(diasDaSemana([new Date(2026, 9, 8), new Date(2026, 9, 6), new Date(2026, 9, 13)])).toBe('ter e qui');
  expect(diasDaSemana([new Date(2026, 9, 9), new Date(2026, 9, 5), new Date(2026, 9, 7)])).toBe('seg, qua e sex');
  expect(diasDaSemana([new Date(2026, 9, 11)])).toBe('dom');
});

describe('equipeDaCrianca', () => {
  const sessao = (tipo: string, professionalId: string, professionalName: string, dia: number, status = 'agendado') => ({
    tipo, professionalId, professionalName, status, start: new Date(2026, 9, dia, 9),
  });

  it('uma linha por terapia e terapeuta, com os dias, sem as sessões canceladas, e marca a sua', () => {
    const equipe = equipeDaCrianca([
      sessao('Psicologia', 'prof-rui', 'Rui Psicólogo', 5),
      sessao('Fonoaudiologia', 'prof-paula', 'Paula Fonoaudióloga', 6),
      sessao('Fonoaudiologia', 'prof-paula', 'Paula Fonoaudióloga', 8),
      sessao('Fonoaudiologia', 'prof-paula', 'Paula Fonoaudióloga', 13),
      sessao('Terapia Ocupacional', 'prof-ana', 'Ana TO', 7, 'cancelado'),
    ], 'prof-rui');

    expect(equipe).toEqual([
      { terapia: 'Fonoaudiologia', professionalId: 'prof-paula', profissional: 'Paula Fonoaudióloga', dias: 'ter e qui', voce: false },
      { terapia: 'Psicologia', professionalId: 'prof-rui', profissional: 'Rui Psicólogo', dias: 'seg', voce: true },
    ]);
  });

  it('a mesma terapia com dois terapeutas aparece duas vezes', () => {
    const equipe = equipeDaCrianca([sessao('Psicologia', 'prof-rui', 'Rui', 5), sessao('Psicologia', 'prof-lia', 'Lia', 7)]);

    expect(equipe.map((m) => m.profissional)).toEqual(['Lia', 'Rui']);
  });
});
