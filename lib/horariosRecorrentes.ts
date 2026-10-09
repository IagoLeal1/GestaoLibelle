// lib/horariosRecorrentes.ts
// A grade semanal da clínica, usada pelo assistente de encaixe (lib/encaixes.ts): os horários base,
// os dias úteis, as próximas 12 semanas analisadas e o relógio da clínica (Brasília), qualquer que
// seja o fuso do servidor.

export const SEMANAS_ANALISADAS = 12;
export const DURACAO_DA_SESSAO = 50; // minutos
const FUSO_DA_CLINICA = 'America/Sao_Paulo';

export const HORARIOS_BASE = {
  manha: ['07:20', '08:10', '09:00', '09:50', '10:40', '11:30'],
  tarde: ['12:20', '13:20', '14:10', '15:00', '15:50', '16:40', '17:30'],
  noite: [] as string[],
};

// Como o cadastro de profissionais grava os dias (sem acento) e como a tela os escreve
const DIAS_DA_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
export const DIAS_UTEIS: Record<string, string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
};
export const ORDEM_DOS_DIAS = Object.keys(DIAS_UTEIS);

export type Turno = keyof typeof HORARIOS_BASE;
export interface NecessidadeDeTerapia { terapia: string; frequencia: number; }

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
export const naClinica = (momento: Date) => {
  const p = Object.fromEntries(relogioDaClinica.formatToParts(momento).map((parte) => [parte.type, parte.value]));
  const meiaNoite = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day));
  return {
    dia: `${p.year}-${p.month}-${p.day}`,
    diaDaSemana: DIAS_DA_SEMANA[new Date(meiaNoite).getUTCDay()],
    minutos: Number(p.hour) * 60 + Number(p.minute),
    meiaNoite,
  };
};

export const emMinutos = (horario?: string) => {
  const [hora, minuto] = (horario ?? '').split(':').map(Number);
  return hora * 60 + minuto;
};

/** O período analisado: de hoje até o fim da 12ª semana, nas datas da clínica. */
export const periodoAnalisado = (hoje: Date) => {
  const { meiaNoite } = naClinica(hoje);
  return {
    primeiroDia: new Date(meiaNoite).toISOString().slice(0, 10),
    ultimoDia: new Date(meiaNoite + (SEMANAS_ANALISADAS * 7 - 1) * UM_DIA).toISOString().slice(0, 10),
  };
};

/** A terapia pedida é da especialidade do profissional ("Fonoaudiologia Unimed" é de quem faz Fonoaudiologia). */
export const atendeA = (profissional: ProfissionalDaGrade, terapia: string) => {
  const especialidade = profissional.especialidade?.trim().toLowerCase();
  return !!especialidade && terapia.toLowerCase().includes(especialidade);
};
