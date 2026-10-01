// lib/horariosRecorrentes.ts
// O assistente de agendamento: para cada terapia pedida, os horários semanais de cada profissional
// da especialidade e em quantas das próximas 12 semanas o horário está livre, para ele e para a
// criança. Daí sai a sugestão (a mesma pessoa nos dias mais livres) e as outras opções.
// Tudo no relógio da clínica (Brasília), qualquer que seja o fuso do servidor.

export const SEMANAS_ANALISADAS = 12;
const DURACAO_DA_SESSAO = 50; // minutos
const OUTRAS_OPCOES = 5;
const FUSO_DA_CLINICA = 'America/Sao_Paulo';

const HORARIOS_BASE = {
  manha: ['07:20', '08:10', '09:00', '09:50', '10:40', '11:30'],
  tarde: ['12:20', '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'],
  noite: [] as string[],
};

// Como o cadastro de profissionais grava os dias (sem acento) e como a tela os escreve
const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const DIAS_UTEIS: Record<string, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
};
const ORDEM_DOS_DIAS = Object.keys(DIAS_UTEIS);

export type Turno = keyof typeof HORARIOS_BASE;
export interface NecessidadeDeTerapia { terapia: string; frequencia: number; }
export interface Preferencias { turno?: Turno; profissionaisIds?: string[]; }

export interface ProfissionalDaGrade {
  id: string;
  fullName: string;
  especialidade?: string;
  status?: string;
  diasAtendimento?: string[];
  horarioInicio?: string;
  horarioFim?: string;
}

export interface AtendimentoDaGrade {
  professionalId: string;
  patientId?: string;
  start: Date;
  end: Date;
  status?: string;
}

export interface PadraoDeHorario {
  terapia: string;
  profissional: { id: string; fullName: string };
  /** Como no cadastro de profissionais: "terca". */
  dia: string;
  /** Para mostrar: "Terça-feira". */
  diaSemana: string;
  horario: string;
  /** Em quantas das próximas 12 semanas o profissional e a criança estão livres nesse horário. */
  semanasLivres: number;
}

export interface SugestaoDaTerapia {
  terapia: string;
  frequencia: number;
  /** A mesma pessoa nos dias mais livres, um horário por dia. Nula se nada estiver livre. */
  sugestao: { profissional: { id: string; fullName: string }; horarios: PadraoDeHorario[] } | null;
  outrasOpcoes: PadraoDeHorario[];
}

const UM_DIA = 24 * 60 * 60 * 1000;

const relogioDaClinica = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO_DA_CLINICA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** O dia (aaaa-mm-dd), o dia da semana e os minutos desde a meia-noite no relógio da clínica. */
const naClinica = (momento: Date) => {
  const p = Object.fromEntries(relogioDaClinica.formatToParts(momento).map((parte) => [parte.type, parte.value]));
  const meiaNoite = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
  return {
    dia: `${p.year}-${p.month}-${p.day}`,
    diaDaSemana: DIAS_DA_SEMANA[new Date(meiaNoite).getUTCDay()],
    minutos: Number(p.hour) * 60 + Number(p.minute),
    meiaNoite,
  };
};

const emMinutos = (horario?: string) => {
  const [hora, minuto] = (horario ?? '').split(':').map(Number);
  return hora * 60 + minuto;
};

/** O período analisado: de hoje até o fim da 12ª semana, nas datas da clínica. */
const periodoAnalisado = (hoje: Date) => {
  const { meiaNoite } = naClinica(hoje);
  return {
    primeiroDia: new Date(meiaNoite).toISOString().slice(0, 10),
    ultimoDia: new Date(meiaNoite + (SEMANAS_ANALISADAS * 7 - 1) * UM_DIA).toISOString().slice(0, 10),
  };
};

type Ocupacao = Map<string, { dia: string; inicio: number; fim: number }[]>;
const doProfissional = (id: string, dia: string) => `profissional|${id}|${dia}`;
const daCrianca = (dia: string) => `crianca|${dia}`;

/** Os trechos ocupados de cada profissional, e da criança, em cada dia da semana, com a data de cada um. */
const ocupacaoNoPeriodo = (atendimentos: AtendimentoDaGrade[], hoje: Date, pacienteId?: string): Ocupacao => {
  const { primeiroDia, ultimoDia } = periodoAnalisado(hoje);
  const ocupacao: Ocupacao = new Map();
  const ocupar = (chave: string, trecho: { dia: string; inicio: number; fim: number }) =>
    ocupacao.set(chave, [...(ocupacao.get(chave) ?? []), trecho]);

  for (const atendimento of atendimentos) {
    if (atendimento.status === 'cancelado') continue;
    const inicio = naClinica(atendimento.start);
    if (inicio.dia < primeiroDia || inicio.dia > ultimoDia) continue;
    const fim = naClinica(atendimento.end);
    const trecho = { dia: inicio.dia, inicio: inicio.minutos, fim: fim.dia === inicio.dia ? fim.minutos : 24 * 60 };

    ocupar(doProfissional(atendimento.professionalId, inicio.diaDaSemana), trecho);
    if (pacienteId && atendimento.patientId === pacienteId) ocupar(daCrianca(inicio.diaDaSemana), trecho);
  }
  return ocupacao;
};

/** A terapia pedida é da especialidade do profissional ("Fonoaudiologia Unimed" é de quem faz Fonoaudiologia). */
const atendeA = (profissional: ProfissionalDaGrade, terapia: string) => {
  const especialidade = profissional.especialidade?.trim().toLowerCase();
  return !!especialidade && terapia.toLowerCase().includes(especialidade);
};

export function encontrarPadroesRecorrentes({
  necessidades,
  preferencias = {},
  profissionais,
  atendimentos,
  pacienteId,
  hoje = new Date(),
}: {
  necessidades: NecessidadeDeTerapia[];
  preferencias?: Preferencias;
  profissionais: ProfissionalDaGrade[];
  atendimentos: AtendimentoDaGrade[];
  /** A criança: os horários em que ela já tem atendimento não contam como livres. */
  pacienteId?: string;
  hoje?: Date;
}): PadraoDeHorario[] {
  const { turno, profissionaisIds = [] } = preferencias;
  const horarios = turno ? HORARIOS_BASE[turno] : [...HORARIOS_BASE.manha, ...HORARIOS_BASE.tarde, ...HORARIOS_BASE.noite];
  const ocupacao = ocupacaoNoPeriodo(atendimentos, hoje, pacienteId);
  const padroes: PadraoDeHorario[] = [];

  for (const { terapia } of necessidades) {
    let qualificados = profissionais.filter((p) => p.status === 'ativo' && atendeA(p, terapia));
    // Se a pessoa escolheu profissionais e algum deles atende a terapia, só eles
    const preferidos = qualificados.filter((p) => profissionaisIds.includes(p.id));
    if (preferidos.length > 0) qualificados = preferidos;

    for (const profissional of qualificados) {
      const abre = emMinutos(profissional.horarioInicio);
      const fecha = emMinutos(profissional.horarioFim);
      if (Number.isNaN(abre) || Number.isNaN(fecha)) continue;

      for (const [dia, diaSemana] of Object.entries(DIAS_UTEIS)) {
        if (!profissional.diasAtendimento?.includes(dia)) continue;
        const ocupados = [
          ...(ocupacao.get(doProfissional(profissional.id, dia)) ?? []),
          ...(ocupacao.get(daCrianca(dia)) ?? []),
        ];

        for (const horario of horarios) {
          const inicio = emMinutos(horario);
          const fim = inicio + DURACAO_DA_SESSAO;
          if (inicio < abre || fim > fecha) continue;

          const semanasOcupadas = new Set(ocupados.filter((o) => o.inicio < fim && o.fim > inicio).map((o) => o.dia));
          padroes.push({
            terapia,
            profissional: { id: profissional.id, fullName: profissional.fullName },
            dia,
            diaSemana,
            horario,
            semanasLivres: SEMANAS_ANALISADAS - semanasOcupadas.size,
          });
        }
      }
    }
  }
  return padroes;
}

const maisLivreAntes = (a: PadraoDeHorario, b: PadraoDeHorario) =>
  b.semanasLivres - a.semanasLivres ||
  ORDEM_DOS_DIAS.indexOf(a.dia) - ORDEM_DOS_DIAS.indexOf(b.dia) ||
  a.horario.localeCompare(b.horario);

const naOrdemDaSemana = (a: PadraoDeHorario, b: PadraoDeHorario) => ORDEM_DOS_DIAS.indexOf(a.dia) - ORDEM_DOS_DIAS.indexOf(b.dia);

/** O menor intervalo, em dias, entre uma sessão e a seguinte, contando a virada da semana (de sexta a segunda são 3). */
const espacamento = (horarios: PadraoDeHorario[]) => {
  const dias = horarios.map((h) => DIAS_DA_SEMANA.indexOf(h.dia)).sort((a, b) => a - b);
  if (dias.length < 2) return 7;
  return Math.min(...dias.map((dia, i) => (dias[(i + 1) % dias.length] - dia + 7) % 7 || 7));
};

const combinacoes = <T>(itens: T[], tamanho: number): T[][] =>
  tamanho === 0 ? [[]] : itens.flatMap((item, i) => combinacoes(itens.slice(i + 1), tamanho - 1).map((resto) => [item, ...resto]));

interface Plano { horarios: PadraoDeHorario[]; semanas: number; espaco: number; }

/** Melhor é o plano que cobre mais dias, depois o mais livre, depois o que mais espaça as sessões. */
const comparar = (a: Plano, b: Plano) => a.horarios.length - b.horarios.length || a.semanas - b.semanas || a.espaco - b.espaco;

/**
 * Para cada terapia, a sugestão: o profissional que cobre mais dos dias pedidos, um horário por
 * dia, nos dias mais livres e mais espaçados. As outras opções variam o dia ou o profissional.
 * As terapias seguintes não usam os horários já sugeridos à criança.
 */
export function montarSugestoes(necessidades: NecessidadeDeTerapia[], padroes: PadraoDeHorario[]): SugestaoDaTerapia[] {
  const horariosDaCrianca = new Set<string>();

  return necessidades.map(({ terapia, frequencia }) => {
    const livres = padroes
      .filter((p) => p.terapia === terapia && p.semanasLivres > 0 && !horariosDaCrianca.has(`${p.dia} ${p.horario}`))
      .sort(maisLivreAntes);

    // As opções já vêm das mais livres para as menos: a primeira de cada profissional em cada dia é a melhor
    const melhorDeCadaDia = livres.filter(
      (opcao, i) => livres.findIndex((o) => o.profissional.id === opcao.profissional.id && o.dia === opcao.dia) === i
    );

    let melhor: Plano | null = null;
    for (const profissionalId of new Set(melhorDeCadaDia.map((o) => o.profissional.id))) {
      const dias = melhorDeCadaDia.filter((o) => o.profissional.id === profissionalId).sort(naOrdemDaSemana);
      for (const horarios of combinacoes(dias, Math.min(frequencia, dias.length))) {
        const plano = { horarios, semanas: horarios.reduce((total, h) => total + h.semanasLivres, 0), espaco: espacamento(horarios) };
        if (!melhor || comparar(plano, melhor) > 0) melhor = plano;
      }
    }

    const sugeridos: PadraoDeHorario[] = melhor?.horarios ?? [];
    sugeridos.forEach((h) => horariosDaCrianca.add(`${h.dia} ${h.horario}`));
    const outrasOpcoes = melhorDeCadaDia
      .filter((o) => !sugeridos.some((s) => s.profissional.id === o.profissional.id && s.dia === o.dia))
      .slice(0, OUTRAS_OPCOES);

    const sugestao = sugeridos.length > 0 ? { profissional: sugeridos[0].profissional, horarios: sugeridos } : null;
    return { terapia, frequencia, sugestao, outrasOpcoes };
  });
}
