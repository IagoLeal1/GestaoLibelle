// __tests__/lib/horariosRecorrentes.test.ts
// O assistente de agendamento: os horários semanais e em quantas das próximas 12 semanas cada um
// está livre, e a sugestão montada a partir deles. O cálculo antigo só via os atendimentos do
// próprio dia e nunca os de terça ("terça" não batia com "terca"): quase tudo aparecia livre.
// Os horários são os da clínica (Brasília). Para simular a hospedagem, que roda em UTC:
// TZ=UTC npx jest __tests__/lib/horariosRecorrentes.test.ts
import {
  AtendimentoDaGrade,
  encontrarPadroesRecorrentes,
  montarSugestoes,
  PadraoDeHorario,
  ProfissionalDaGrade,
} from '@/lib/horariosRecorrentes';

const HOJE = new Date('2026-10-01T09:00:00-03:00'); // uma quinta-feira

const paula: ProfissionalDaGrade = {
  id: 'prof-paula',
  fullName: 'Paula Fonoaudióloga',
  especialidade: 'Fonoaudiologia',
  status: 'ativo',
  diasAtendimento: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
  horarioInicio: '08:00',
  horarioFim: '17:00',
};

/** Um atendimento (da Paula, se nada for dito) no dia e horário da clínica. */
const atendimento = (dia: string, inicio: string, fim: string, extra: Partial<AtendimentoDaGrade> = {}): AtendimentoDaGrade => ({
  professionalId: 'prof-paula',
  patientId: 'paciente-ana',
  start: new Date(`${dia}T${inicio}:00-03:00`),
  end: new Date(`${dia}T${fim}:00-03:00`),
  status: 'agendado',
  ...extra,
});

const padroes = (atendimentos: AtendimentoDaGrade[], extra: { profissionais?: ProfissionalDaGrade[]; pacienteId?: string } = {}) =>
  encontrarPadroesRecorrentes({
    necessidades: [{ terapia: 'Fonoaudiologia', frequencia: 1 }],
    profissionais: extra.profissionais ?? [paula],
    atendimentos,
    pacienteId: extra.pacienteId,
    hoje: HOJE,
  });

/** Em quantas das 12 semanas o horário está livre. */
const livre = (lista: PadraoDeHorario[], diaSemana: string, horario: string) =>
  lista.find((p) => p.diaSemana === diaSemana && p.horario === horario)?.semanasLivres;

describe('semanas livres de cada horário', () => {
  it('atendimentos numa terça ocupam aquele horário da terça, e só ele', () => {
    const lista = padroes([
      atendimento('2026-10-06', '10:40', '11:30'),
      atendimento('2026-10-13', '10:40', '11:30'),
    ]);

    expect(livre(lista, 'Terça-feira', '10:40')).toBe(10);
    expect(livre(lista, 'Terça-feira', '09:50')).toBe(12);
    expect(livre(lista, 'Quarta-feira', '10:40')).toBe(12);
  });

  it('um atendimento fora da grade ocupa os dois horários que ele cruza', () => {
    const lista = padroes([atendimento('2026-10-07', '10:00', '10:50')]);

    expect(livre(lista, 'Quarta-feira', '09:50')).toBe(11);
    expect(livre(lista, 'Quarta-feira', '10:40')).toBe(11);
    expect(livre(lista, 'Quarta-feira', '11:30')).toBe(12);
  });

  it('atendimento cancelado não ocupa o horário', () => {
    const lista = padroes([atendimento('2026-10-06', '10:40', '11:30', { status: 'cancelado' })]);

    expect(livre(lista, 'Terça-feira', '10:40')).toBe(12);
  });

  it('conta as semanas ocupadas, não os atendimentos', () => {
    const lista = padroes([
      atendimento('2026-10-06', '10:40', '11:30'),
      atendimento('2026-10-06', '11:00', '11:50'),
    ]);

    expect(livre(lista, 'Terça-feira', '10:40')).toBe(11);
  });

  it('só contam as próximas 12 semanas', () => {
    const lista = padroes([
      atendimento('2026-09-29', '10:40', '11:30'), // terça passada
      atendimento('2026-12-29', '10:40', '11:30'), // 13ª terça
    ]);

    expect(livre(lista, 'Terça-feira', '10:40')).toBe(12);
  });

  it('o horário é o da clínica, qualquer que seja o fuso do servidor', () => {
    // Em UTC, 08:10 de Brasília são 11:10: um cálculo no relógio do servidor ocuparia 10:40 e 11:30
    const lista = padroes([atendimento('2026-10-06', '08:10', '09:00')]);

    expect(livre(lista, 'Terça-feira', '08:10')).toBe(11);
    expect(livre(lista, 'Terça-feira', '10:40')).toBe(12);
    expect(livre(lista, 'Terça-feira', '11:30')).toBe(12);
  });

  it('o horário em que a criança já tem outra terapia não conta como livre', () => {
    const comORui = [
      atendimento('2026-10-06', '10:40', '11:30', { professionalId: 'prof-rui', patientId: 'paciente-lucas' }),
      atendimento('2026-10-13', '10:40', '11:30', { professionalId: 'prof-rui', patientId: 'paciente-lucas' }),
    ];

    expect(livre(padroes(comORui, { pacienteId: 'paciente-lucas' }), 'Terça-feira', '10:40')).toBe(10);
    expect(livre(padroes(comORui, { pacienteId: 'paciente-davi' }), 'Terça-feira', '10:40')).toBe(12);
  });

  it('só oferece quem atende a terapia, nos dias e horários de cada um', () => {
    const paulaSoTercaDeManha = { ...paula, diasAtendimento: ['terca'], horarioFim: '12:00' };
    const rui = { ...paula, id: 'prof-rui', fullName: 'Rui Psicólogo', especialidade: 'Psicologia' };
    const semEspecialidade = { ...paula, id: 'prof-sem', fullName: 'Sem Especialidade', especialidade: '' };

    const lista = padroes([], { profissionais: [paulaSoTercaDeManha, rui, semEspecialidade] });

    expect(lista.map((p) => `${p.profissional.fullName} ${p.diaSemana} ${p.horario}`)).toEqual([
      'Paula Fonoaudióloga Terça-feira 08:10',
      'Paula Fonoaudióloga Terça-feira 09:00',
      'Paula Fonoaudióloga Terça-feira 09:50',
      'Paula Fonoaudióloga Terça-feira 10:40',
    ]);
  });
});

/** Uma opção de horário já calculada. */
const opcao = (nome: string, dia: string, horario: string, semanasLivres: number, terapia = 'Fonoaudiologia'): PadraoDeHorario => ({
  terapia,
  profissional: { id: nome, fullName: nome },
  dia,
  diaSemana: dia,
  horario,
  semanasLivres,
});
const resumo = (lista: PadraoDeHorario[] = []) => lista.map((p) => `${p.profissional.fullName} ${p.dia} ${p.horario}`);
const fono = (frequencia: number) => ({ terapia: 'Fonoaudiologia', frequencia });

describe('sugestão do assistente', () => {
  it('sugere a mesma pessoa nos dias mais livres, um horário por dia, e lista as outras opções', () => {
    const [sugestao] = montarSugestoes([fono(2)], [
      opcao('Paula', 'segunda', '08:10', 9),
      opcao('Paula', 'terca', '10:40', 12),
      opcao('Paula', 'terca', '11:30', 11),
      opcao('Paula', 'quinta', '10:40', 12),
      opcao('Rui', 'segunda', '08:10', 12),
    ]);

    expect(resumo(sugestao.sugestao?.horarios)).toEqual(['Paula terca 10:40', 'Paula quinta 10:40']);
    expect(resumo(sugestao.outrasOpcoes)).toEqual(['Rui segunda 08:10', 'Paula segunda 08:10']);
  });

  it('com a agenda livre, espalha as sessões na semana em vez de pegar dias seguidos', () => {
    const tudoLivre = ['segunda', 'terca', 'quarta', 'quinta', 'sexta'].map((dia) => opcao('Paula', dia, '08:10', 12));

    const [duasVezes, tresVezes] = montarSugestoes([fono(2), { terapia: 'Psicologia', frequencia: 3 }], [
      ...tudoLivre,
      ...tudoLivre.map((o) => ({ ...o, terapia: 'Psicologia', horario: '14:10' })),
    ]);

    expect(resumo(duasVezes.sugestao?.horarios)).toEqual(['Paula segunda 08:10', 'Paula quinta 08:10']);
    expect(resumo(tresVezes.sugestao?.horarios)).toEqual(['Paula segunda 14:10', 'Paula quarta 14:10', 'Paula sexta 14:10']);
  });

  it('as outras opções variam o dia ou o profissional', () => {
    const [sugestao] = montarSugestoes([fono(1)], [
      opcao('Paula', 'segunda', '08:10', 12),
      opcao('Paula', 'segunda', '09:00', 12),
      opcao('Paula', 'segunda', '09:50', 12),
      opcao('Paula', 'terca', '08:10', 11),
      opcao('Paula', 'terca', '09:00', 11),
      opcao('Rui', 'quarta', '14:10', 10),
    ]);

    expect(resumo(sugestao.sugestao?.horarios)).toEqual(['Paula segunda 08:10']);
    expect(resumo(sugestao.outrasOpcoes)).toEqual(['Paula terca 08:10', 'Rui quarta 14:10']);
  });

  it('prefere quem cobre todos os dias pedidos, mesmo com horários menos livres', () => {
    const [sugestao] = montarSugestoes([fono(2)], [
      opcao('Paula', 'terca', '10:40', 6),
      opcao('Paula', 'quinta', '10:40', 5),
      opcao('Rui', 'segunda', '08:10', 12),
    ]);

    expect(resumo(sugestao.sugestao?.horarios)).toEqual(['Paula terca 10:40', 'Paula quinta 10:40']);
  });

  it('entre quem cobre os mesmos dias, fica quem tem os horários mais livres', () => {
    const [sugestao] = montarSugestoes([fono(2)], [
      opcao('Paula', 'terca', '10:40', 10),
      opcao('Paula', 'quinta', '10:40', 10),
      opcao('Rui', 'segunda', '08:10', 12),
      opcao('Rui', 'quarta', '08:10', 11),
    ]);

    expect(sugestao.sugestao?.profissional.fullName).toBe('Rui');
  });

  it('não sugere duas terapias no mesmo horário da criança', () => {
    const sugestoes = montarSugestoes(
      [fono(1), { terapia: 'Terapia Ocupacional', frequencia: 1 }],
      [
        opcao('Paula', 'terca', '10:40', 12),
        opcao('Lia', 'terca', '10:40', 12, 'Terapia Ocupacional'),
        opcao('Lia', 'quinta', '14:10', 11, 'Terapia Ocupacional'),
      ]
    );

    expect(sugestoes.map((s) => resumo(s.sugestao?.horarios))).toEqual([['Paula terca 10:40'], ['Lia quinta 14:10']]);
    expect(resumo(sugestoes[1].outrasOpcoes)).toEqual([]);
  });

  it('horário sem nenhuma semana livre não entra; sem nada livre, não há sugestão', () => {
    const [sugestao] = montarSugestoes([fono(1)], [opcao('Paula', 'terca', '10:40', 0)]);

    expect(sugestao).toMatchObject({ sugestao: null, outrasOpcoes: [] });
  });
});
