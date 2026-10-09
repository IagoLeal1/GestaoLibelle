// lib/encaixes.ts
// O assistente de encaixe: para a criança e as terapias pedidas, monta opções de horário semanal nas
// próximas 12 semanas. Cada sessão fica num horário livre ou, quando não há, num horário que se abre
// com uma troca segura: outra criança muda de horário no mesmo dia, com a mesma terapeuta, e continua
// emendada com outra terapia dela (a família já está na clínica). No máximo uma troca por opção.
// As opções respeitam os dias e horários da família, preferem as terapias emendadas no mesmo dia e a
// terapeuta de preferência, e deixam de fora o que a coordenação já recusou (Bloqueio).
// Tudo no relógio da clínica; o cálculo dos horários base e das semanas fica em horariosRecorrentes.
import {
  AtendimentoDaGrade,
  atendeA,
  DIAS_UTEIS,
  DURACAO_DA_SESSAO,
  emMinutos,
  HORARIOS_BASE,
  naClinica,
  NecessidadeDeTerapia,
  ORDEM_DOS_DIAS,
  periodoAnalisado,
  ProfissionalDaGrade,
  SEMANAS_ANALISADAS,
} from './horariosRecorrentes';

/** Livre de verdade: em pelo menos 10 das 12 semanas (uma série curta que vai ser renovada não conta). */
export const MINIMO_DE_SEMANAS_LIVRES = 10;
const MAXIMO_DE_OPCOES = 8;
const TAMANHO_DA_BUSCA = 150;
/** Horários guardados por dia de cada terapeuta, conforme as vezes por semana (a busca não explode). */
const HORARIOS_POR_DIA = (frequencia: number) => (frequencia <= 1 ? 13 : frequencia === 2 ? 8 : 4);
/** Uma sessão "emenda" na outra quando começa até 10 minutos depois do fim dela. */
const FOLGA_PARA_EMENDAR = 10;

export interface AtendimentoDaAgenda extends AtendimentoDaGrade {
  patientName?: string;
  sala?: string | null;
  tipo?: string;
}

export interface SalaDaClinica { id: string; name: string; status?: string; }

export interface FamiliaPode {
  /** Como no cadastro de profissionais ("terca"); vazio = qualquer dia útil. */
  dias: string[];
  desde?: string;
  ate?: string;
}

export interface PedidoDeEncaixe {
  pacienteId: string;
  necessidades: NecessidadeDeTerapia[];
  familia: FamiliaPode;
  emendar: boolean;
  preferidos: string[];
}

/** O que um "Não" com motivo tira das próximas buscas. */
export type Bloqueio =
  | { tipo: 'nao_mexer'; pacienteId: string }
  | { tipo: 'horario'; pacienteId: string; dia: string; horario: string }
  | { tipo: 'troca'; chave: string }
  | { tipo: 'opcao'; chave: string };

export interface Pessoa { id: string; nome: string; }
export interface SalaSugerida { id: string; nome: string; }

export interface SessaoDoEncaixe {
  terapia: string;
  profissional: Pessoa;
  /** Como no cadastro de profissionais: "terca". */
  dia: string;
  horario: string;
  fim: string;
  /** Em quantas das 12 semanas o horário fica livre para a terapeuta e a criança (já com a troca). */
  semanasLivres: number;
  sala: SalaSugerida | null;
  preferida: boolean;
  /** O horário só se abre com a troca desta opção. */
  comTroca: boolean;
}

export interface TrocaDoEncaixe {
  chave: string;
  paciente: Pessoa;
  profissional: Pessoa;
  terapia: string;
  dia: string;
  de: string;
  para: string;
  sala: SalaSugerida | null;
  /** A sessão da mesma criança, no mesmo dia, com que ela continua emendada. */
  emendaCom: { horario: string; terapia: string };
}

export interface OpcaoDeEncaixe {
  chave: string;
  sessoes: SessaoDoEncaixe[];
  troca: TrocaDoEncaixe | null;
  /** O menor número de semanas livres entre as sessões. */
  semanasLivres: number;
  /** Dias em que as sessões ficam emendadas (a família vem uma vez só). */
  diasEmendados: string[];
  /** Terapias que não couberam todas as vezes pedidas com a mesma terapeuta. */
  faltam: { terapia: string; sessoes: number }[];
}

// --- A agenda da clínica, semana a semana ---

interface Trecho {
  /** A data (aaaa-mm-dd): no mesmo dia da semana, cada data é uma semana. */
  data: string;
  inicio: number;
  fim: number;
  pacienteId?: string;
  pacienteNome?: string;
  profissionalId: string;
  sala?: string | null;
  tipo?: string;
}

const hhmm = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
const cruza = (t: { inicio: number; fim: number }, inicio: number, fim: number) => t.inicio < fim && t.fim > inicio;
const semanas = (trechos: Trecho[]) => new Set(trechos.map((t) => t.data));

class Agenda {
  private porProfissional = new Map<string, Trecho[]>();
  private porPaciente = new Map<string, Trecho[]>();
  private porSala = new Map<string, Trecho[]>();

  constructor(atendimentos: AtendimentoDaAgenda[], hoje: Date) {
    const { primeiroDia, ultimoDia } = periodoAnalisado(hoje);
    for (const atendimento of atendimentos) {
      if (atendimento.status === 'cancelado') continue;
      const inicio = naClinica(atendimento.start);
      if (inicio.dia < primeiroDia || inicio.dia > ultimoDia) continue;
      const fim = naClinica(atendimento.end);
      const trecho: Trecho = {
        data: inicio.dia,
        inicio: inicio.minutos,
        fim: fim.dia === inicio.dia ? fim.minutos : 24 * 60,
        pacienteId: atendimento.patientId,
        pacienteNome: atendimento.patientName,
        profissionalId: atendimento.professionalId,
        sala: atendimento.sala,
        tipo: atendimento.tipo,
      };
      const guardar = (mapa: Map<string, Trecho[]>, chave: string) => mapa.set(chave, [...(mapa.get(chave) ?? []), trecho]);
      guardar(this.porProfissional, `${atendimento.professionalId}|${inicio.diaDaSemana}`);
      if (atendimento.patientId) guardar(this.porPaciente, `${atendimento.patientId}|${inicio.diaDaSemana}`);
      if (atendimento.sala) guardar(this.porSala, `${atendimento.sala}|${inicio.diaDaSemana}`);
    }
  }

  doProfissional = (id: string, dia: string, inicio: number, fim: number) =>
    (this.porProfissional.get(`${id}|${dia}`) ?? []).filter((t) => cruza(t, inicio, fim));
  doPaciente = (id: string, dia: string, inicio: number, fim: number) =>
    (this.porPaciente.get(`${id}|${dia}`) ?? []).filter((t) => cruza(t, inicio, fim));
  daSala = (id: string, dia: string, inicio: number, fim: number) =>
    (this.porSala.get(`${id}|${dia}`) ?? []).filter((t) => cruza(t, inicio, fim));
  /** Todos os atendimentos da criança naquele dia da semana, nas 12 semanas. */
  doPacienteNoDia = (id: string, dia: string) => this.porPaciente.get(`${id}|${dia}`) ?? [];
  /** As salas em que a terapeuta mais atende, da mais usada para a menos. */
  salasDe = (profissionalId: string) => {
    const usos = new Map<string, number>();
    for (const [chave, trechos] of this.porProfissional) {
      if (!chave.startsWith(`${profissionalId}|`)) continue;
      for (const t of trechos) if (t.sala) usos.set(t.sala, (usos.get(t.sala) ?? 0) + 1);
    }
    return [...usos.entries()].sort((a, b) => b[1] - a[1]).map(([sala]) => sala);
  };
}

/** O valor que mais se repete (o horário ou a sala de uma série). */
const maisComum = <T>(valores: T[]): T | undefined => {
  const contagem = new Map<T, number>();
  valores.forEach((v) => contagem.set(v, (contagem.get(v) ?? 0) + 1));
  return [...contagem.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};

// --- Os horários possíveis de cada terapia ---

interface Candidato {
  sessao: SessaoDoEncaixe;
  inicio: number;
  fim: number;
  troca: (TrocaDoEncaixe & { inicioNovo: number; fimNovo: number }) | null;
}

function horariosDaTerapeuta(profissional: ProfissionalDaGrade, familia: FamiliaPode) {
  const abre = emMinutos(profissional.horarioInicio);
  const fecha = emMinutos(profissional.horarioFim);
  if (Number.isNaN(abre) || Number.isNaN(fecha)) return [];
  const desde = familia.desde ? emMinutos(familia.desde) : 0;
  const ate = familia.ate ? emMinutos(familia.ate) : 24 * 60;
  return [...HORARIOS_BASE.manha, ...HORARIOS_BASE.tarde, ...HORARIOS_BASE.noite]
    .map((horario) => ({ horario, inicio: emMinutos(horario), fim: emMinutos(horario) + DURACAO_DA_SESSAO }))
    .filter((h) => h.inicio >= abre && h.fim <= fecha)
    .map((h) => ({ ...h, daFamilia: h.inicio >= desde && h.fim <= ate }));
}

function salaLivre(
  agenda: Agenda,
  salas: SalaDaClinica[],
  profissionalId: string,
  dia: string,
  inicio: number,
  fim: number,
  ignorar: Set<Trecho> = new Set()
): SalaSugerida | null {
  const ativas = salas.filter((s) => (s.status ?? 'ativa') === 'ativa');
  const preferidas = agenda.salasDe(profissionalId);
  const ordem = [...ativas].sort((a, b) => {
    const pa = preferidas.indexOf(a.id);
    const pb = preferidas.indexOf(b.id);
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
  });
  const livre = ordem.find((sala) => {
    const ocupadas = semanas(agenda.daSala(sala.id, dia, inicio, fim).filter((t) => !ignorar.has(t)));
    return SEMANAS_ANALISADAS - ocupadas.size >= MINIMO_DE_SEMANAS_LIVRES;
  });
  return livre ? { id: livre.id, nome: livre.name } : null;
}

function candidatosDaTerapia(
  terapia: string,
  pedido: PedidoDeEncaixe,
  profissionais: ProfissionalDaGrade[],
  agenda: Agenda,
  salas: SalaDaClinica[],
  bloqueios: Bloqueio[]
): Candidato[] {
  const candidatos: Candidato[] = [];
  const naoMexer = new Set(bloqueios.flatMap((b) => (b.tipo === 'nao_mexer' ? [b.pacienteId] : [])));
  const trocasRecusadas = new Set(bloqueios.flatMap((b) => (b.tipo === 'troca' ? [b.chave] : [])));
  const horarioRecusado = (dia: string, horario: string) =>
    bloqueios.some((b) => b.tipo === 'horario' && b.pacienteId === pedido.pacienteId && b.dia === dia && b.horario === horario);
  const nomeSala = (id?: string | null): SalaSugerida | null => {
    if (!id) return null;
    const sala = salas.find((s) => s.id === id);
    return { id, nome: sala?.name ?? id };
  };

  for (const profissional of profissionais.filter((p) => p.status === 'ativo' && atendeA(p, terapia))) {
    const pessoa = { id: profissional.id, nome: profissional.fullName };
    const preferida = pedido.preferidos.includes(profissional.id);
    const horarios = horariosDaTerapeuta(profissional, pedido.familia);

    for (const dia of ORDEM_DOS_DIAS) {
      if (!profissional.diasAtendimento?.includes(dia)) continue;
      if (pedido.familia.dias.length > 0 && !pedido.familia.dias.includes(dia)) continue;

      for (const { horario, inicio, fim, daFamilia } of horarios) {
        if (!daFamilia || horarioRecusado(dia, horario)) continue;
        const daCrianca = semanas(agenda.doPaciente(pedido.pacienteId, dia, inicio, fim));
        const ocupacao = agenda.doProfissional(profissional.id, dia, inicio, fim);
        const sessao = (semanasLivres: number, comTroca: boolean, ignorar?: Set<Trecho>): SessaoDoEncaixe => ({
          terapia, profissional: pessoa, dia, horario, fim: hhmm(fim), semanasLivres, preferida, comTroca,
          sala: salaLivre(agenda, salas, profissional.id, dia, inicio, fim, ignorar),
        });

        const livres = SEMANAS_ANALISADAS - new Set([...semanas(ocupacao), ...daCrianca]).size;
        if (livres >= MINIMO_DE_SEMANAS_LIVRES) {
          candidatos.push({ sessao: sessao(livres, false), inicio, fim, troca: null });
          continue;
        }

        // Ocupado: só serve se for sempre a mesma criança, e ela puder mudar de horário com segurança
        const ocupantes = new Set(ocupacao.map((t) => t.pacienteId));
        const outra = [...ocupantes][0];
        if (ocupantes.size !== 1 || !outra || outra === pedido.pacienteId || naoMexer.has(outra)) continue;
        if (SEMANAS_ANALISADAS - daCrianca.size < MINIMO_DE_SEMANAS_LIVRES) continue;

        const daOutra = new Set(ocupacao);
        const semanasDaOutra = semanas(ocupacao);
        const de = maisComum(ocupacao.map((t) => t.inicio))!;
        const duracao = maisComum(ocupacao.map((t) => t.fim - t.inicio))!;
        const salaDaOutra = maisComum(ocupacao.map((t) => t.sala ?? null)) ?? null;
        const outrasSessoes = agenda.doPacienteNoDia(outra, dia).filter((t) => !daOutra.has(t));

        const destinos = horarios
          .filter((h) => h.horario !== horario && !cruza({ inicio, fim }, h.inicio, h.inicio + duracao))
          .flatMap((h) => {
            const fimNovo = h.inicio + duracao;
            const daTerapeuta = semanas(agenda.doProfissional(profissional.id, dia, h.inicio, fimNovo).filter((t) => !daOutra.has(t)));
            if (SEMANAS_ANALISADAS - daTerapeuta.size < MINIMO_DE_SEMANAS_LIVRES) return [];
            if ([...semanasDaOutra].some((s) => daTerapeuta.has(s))) return [];
            const criancaOcupada = outrasSessoes.some((t) => cruza(t, h.inicio, fimNovo) && semanasDaOutra.has(t.data));
            if (criancaOcupada) return [];
            if (salaDaOutra) {
              const salaOcupada = agenda.daSala(salaDaOutra, dia, h.inicio, fimNovo).some((t) => !daOutra.has(t) && semanasDaOutra.has(t.data));
              if (salaOcupada) return [];
            }
            // Continua emendada com outra sessão dela no mesmo dia, na maioria das semanas
            const vizinhas = outrasSessoes.filter(
              (t) => Math.abs(t.inicio - fimNovo) <= FOLGA_PARA_EMENDAR || Math.abs(h.inicio - t.fim) <= FOLGA_PARA_EMENDAR
            );
            if (semanas(vizinhas).size * 2 < semanasDaOutra.size) return [];
            const vizinha = vizinhas[0];
            return [{ ...h, fimNovo, emendaCom: { horario: hhmm(vizinha.inicio), terapia: vizinha.tipo ?? '' } }];
          })
          .sort((a, b) => Math.abs(a.inicio - inicio) - Math.abs(b.inicio - inicio));

        const destino = destinos[0];
        if (!destino) continue;
        const chave = `${outra}|${profissional.id}|${dia}|${hhmm(de)}>${destino.horario}`;
        if (trocasRecusadas.has(chave)) continue;

        candidatos.push({
          sessao: sessao(SEMANAS_ANALISADAS - daCrianca.size, true, daOutra),
          inicio,
          fim,
          troca: {
            chave,
            paciente: { id: outra, nome: ocupacao[0].pacienteNome ?? 'Outra criança' },
            profissional: pessoa,
            terapia: maisComum(ocupacao.map((t) => t.tipo ?? '')) || terapia,
            dia,
            de: hhmm(de),
            para: destino.horario,
            sala: nomeSala(salaDaOutra),
            emendaCom: destino.emendaCom,
            inicioNovo: destino.inicio,
            fimNovo: destino.fimNovo,
          },
        });
      }
    }
  }
  return candidatos;
}

// --- As opções: uma escolha de horários para cada terapia ---

interface Escolha { candidatos: Candidato[]; terapia: string; faltam: number; }

const combinacoes = <T>(itens: T[], tamanho: number): T[][] =>
  tamanho === 0 ? [[]] : itens.flatMap((item, i) => combinacoes(itens.slice(i + 1), tamanho - 1).map((resto) => [item, ...resto]));

/** Para cada terapia: a mesma terapeuta em tantos dias quantos foram pedidos, um horário por dia. */
function escolhasDaTerapia(terapia: string, frequencia: number, candidatos: Candidato[]): Escolha[] {
  const escolhas: Escolha[] = [];
  const porProfissional = new Map<string, Map<string, Candidato[]>>();
  // Os livres antes dos com troca, os mais livres antes
  const melhores = [...candidatos].sort((a, b) => Number(!!a.troca) - Number(!!b.troca) || b.sessao.semanasLivres - a.sessao.semanasLivres);
  for (const c of melhores) {
    const dias = porProfissional.get(c.sessao.profissional.id) ?? new Map<string, Candidato[]>();
    const doDia = dias.get(c.sessao.dia) ?? [];
    if (doDia.length < HORARIOS_POR_DIA(frequencia)) dias.set(c.sessao.dia, [...doDia, c]);
    porProfissional.set(c.sessao.profissional.id, dias);
  }
  for (const dias of porProfissional.values()) {
    const quantos = Math.min(frequencia, dias.size);
    for (const grupo of combinacoes([...dias.keys()], quantos)) {
      // Um horário em cada dia do grupo: todas as combinações
      let parciais: Candidato[][] = [[]];
      for (const dia of grupo) parciais = parciais.flatMap((p) => dias.get(dia)!.map((c) => [...p, c]));
      for (const p of parciais) escolhas.push({ candidatos: p, terapia, faltam: frequencia - quantos });
    }
  }
  return escolhas;
}

interface Plano { candidatos: Candidato[]; faltam: { terapia: string; sessoes: number }[]; pontos: number; }

const trocaDo = (candidatos: Candidato[]) => candidatos.find((c) => c.troca)?.troca ?? null;

/** As sessões novas não se cruzam, e a criança que muda não cai em cima de uma sessão nova. */
function cabe(plano: Candidato[], escolha: Candidato[]) {
  const todas = [...plano, ...escolha];
  const trocas = todas.filter((c) => c.troca).map((c) => c.troca!.chave);
  if (new Set(trocas).size > 1) return false;
  for (let i = 0; i < todas.length; i++) {
    for (let j = i + 1; j < todas.length; j++) {
      const a = todas[i];
      const b = todas[j];
      if (a.sessao.dia === b.sessao.dia && cruza(a, b.inicio, b.fim)) return false;
    }
  }
  const troca = trocaDo(todas);
  if (troca) {
    const naTerapeuta = todas.some(
      (c) => c.sessao.dia === troca.dia && c.sessao.profissional.id === troca.profissional.id && cruza(c, troca.inicioNovo, troca.fimNovo)
    );
    if (naTerapeuta) return false;
  }
  return true;
}

function diasEmendados(candidatos: Candidato[], existentes: (dia: string) => { inicio: number; fim: number }[]) {
  const dias: string[] = [];
  for (const dia of ORDEM_DOS_DIAS) {
    const doDia = [...candidatos.filter((c) => c.sessao.dia === dia), ...existentes(dia)].sort((a, b) => a.inicio - b.inicio);
    if (doDia.length < 2 || !candidatos.some((c) => c.sessao.dia === dia)) continue;
    const emendado = doDia.slice(1).every((s, i) => s.inicio - doDia[i].fim <= FOLGA_PARA_EMENDAR);
    if (emendado) dias.push(dia);
  }
  return dias;
}

function pontuar(candidatos: Candidato[], faltam: { sessoes: number }[], pedido: PedidoDeEncaixe, existentes: (dia: string) => { inicio: number; fim: number }[]) {
  let pontos = 0;
  for (const c of candidatos) {
    pontos += c.sessao.semanasLivres;
    if (c.sessao.preferida) pontos += 12;
  }
  if (trocaDo(candidatos)) pontos -= 40;
  pontos -= faltam.reduce((total, f) => total + f.sessoes, 0) * 100;

  const dias = new Set(candidatos.map((c) => c.sessao.dia));
  for (const dia of dias) {
    const doDia = [...candidatos.filter((c) => c.sessao.dia === dia), ...existentes(dia)].sort((a, b) => a.inicio - b.inicio);
    doDia.slice(1).forEach((s, i) => {
      const espera = s.inicio - doDia[i].fim;
      if (espera <= FOLGA_PARA_EMENDAR) pontos += pedido.emendar ? 20 : 4;
      else if (pedido.emendar) pontos -= Math.ceil(espera / DURACAO_DA_SESSAO) * 4;
    });
    if (existentes(dia).length === 0) pontos -= pedido.emendar ? 10 : 2;
  }

  // A mesma terapia mais de uma vez na semana: melhor espalhada (terça e quinta, não terça e quarta)
  const porTerapia = new Map<string, number[]>();
  candidatos.forEach((c) => porTerapia.set(c.sessao.terapia, [...(porTerapia.get(c.sessao.terapia) ?? []), ORDEM_DOS_DIAS.indexOf(c.sessao.dia)]));
  for (const indices of porTerapia.values()) {
    if (indices.length < 2) continue;
    const ordenados = indices.sort((a, b) => a - b);
    pontos += Math.min(...ordenados.slice(1).map((d, i) => d - ordenados[i])) * 3;
  }
  return pontos;
}

const chaveDoPlano = (candidatos: Candidato[]) =>
  [...candidatos]
    .map((c) => `${c.sessao.terapia}|${c.sessao.profissional.id}|${c.sessao.dia}|${c.sessao.horario}`)
    .sort()
    .join(';') + (trocaDo(candidatos) ? `#${trocaDo(candidatos)!.chave}` : '');

export function encontrarEncaixes({
  pedido,
  profissionais,
  atendimentos,
  salas = [],
  bloqueios = [],
  hoje = new Date(),
}: {
  pedido: PedidoDeEncaixe;
  profissionais: ProfissionalDaGrade[];
  atendimentos: AtendimentoDaAgenda[];
  salas?: SalaDaClinica[];
  bloqueios?: Bloqueio[];
  hoje?: Date;
}): OpcaoDeEncaixe[] {
  const agenda = new Agenda(atendimentos, hoje);
  // As sessões que a criança já tem e se repetem (em pelo menos 3 semanas): contam para emendar
  const jaVistos = new Map<string, { inicio: number; fim: number }[]>();
  const existentes = (dia: string) => {
    if (jaVistos.has(dia)) return jaVistos.get(dia)!;
    const trechos = agenda.doPacienteNoDia(pedido.pacienteId, dia);
    const vezes = new Map<string, { inicio: number; fim: number; n: number }>();
    trechos.forEach((t) => {
      const chave = `${t.inicio}-${t.fim}`;
      vezes.set(chave, { inicio: t.inicio, fim: t.fim, n: (vezes.get(chave)?.n ?? 0) + 1 });
    });
    const repetidas = [...vezes.values()].filter((v) => v.n >= 3);
    jaVistos.set(dia, repetidas);
    return repetidas;
  };

  const necessidades = [...pedido.necessidades].sort((a, b) => b.frequencia - a.frequencia);
  let planos: Plano[] = [{ candidatos: [], faltam: [], pontos: 0 }];

  for (const { terapia, frequencia } of necessidades) {
    const escolhas = escolhasDaTerapia(terapia, frequencia, candidatosDaTerapia(terapia, pedido, profissionais, agenda, salas, bloqueios));
    const proximos: Plano[] = [];
    for (const plano of planos) {
      const semEscolha = { candidatos: plano.candidatos, faltam: [...plano.faltam, { terapia, sessoes: frequencia }] };
      proximos.push({ ...semEscolha, pontos: pontuar(semEscolha.candidatos, semEscolha.faltam, pedido, existentes) });
      for (const escolha of escolhas) {
        if (!cabe(plano.candidatos, escolha.candidatos)) continue;
        const candidatos = [...plano.candidatos, ...escolha.candidatos];
        const faltam = escolha.faltam > 0 ? [...plano.faltam, { terapia, sessoes: escolha.faltam }] : plano.faltam;
        proximos.push({ candidatos, faltam, pontos: pontuar(candidatos, faltam, pedido, existentes) });
      }
    }
    planos = proximos.sort((a, b) => b.pontos - a.pontos).slice(0, TAMANHO_DA_BUSCA);
  }

  const recusadas = new Set(bloqueios.flatMap((b) => (b.tipo === 'opcao' ? [b.chave] : [])));
  const vistas = new Set<string>();
  const opcoes: OpcaoDeEncaixe[] = [];
  for (const plano of planos) {
    if (plano.candidatos.length === 0) continue;
    const chave = chaveDoPlano(plano.candidatos);
    if (vistas.has(chave) || recusadas.has(chave)) continue;
    vistas.add(chave);
    const troca = trocaDo(plano.candidatos);
    const sessoes = [...plano.candidatos]
      .sort((a, b) => ORDEM_DOS_DIAS.indexOf(a.sessao.dia) - ORDEM_DOS_DIAS.indexOf(b.sessao.dia) || a.inicio - b.inicio)
      .map((c) => c.sessao);
    opcoes.push({
      chave,
      sessoes,
      troca: troca ? (({ inicioNovo, fimNovo, ...resto }) => resto)(troca) : null,
      semanasLivres: Math.min(...sessoes.map((s) => s.semanasLivres)),
      diasEmendados: diasEmendados(plano.candidatos, existentes),
      faltam: plano.faltam,
    });
    if (opcoes.length === MAXIMO_DE_OPCOES) break;
  }
  return opcoes;
}

/** "terca" → "terça", para frases. */
export const nomeDoDia = (dia: string) => (DIAS_UTEIS[dia] ?? dia).replace('-feira', '').toLowerCase();

// --- O "Não" com motivo ---

export type MotivoDoNao = 'familia_da_troca' | 'horario_ruim' | 'terapeuta' | 'outro';

/** O que cada motivo tira das próximas buscas: só o necessário para a mesma sugestão ruim não voltar. */
export function bloqueiosDoNao(motivo: MotivoDoNao, opcao: OpcaoDeEncaixe, pacienteId: string): Bloqueio[] {
  const daOpcao: Bloqueio[] = [{ tipo: 'opcao', chave: opcao.chave }];
  switch (motivo) {
    case 'familia_da_troca':
      return opcao.troca ? [{ tipo: 'nao_mexer', pacienteId: opcao.troca.paciente.id }] : daOpcao;
    case 'horario_ruim':
      return opcao.sessoes.map((s) => ({ tipo: 'horario', pacienteId, dia: s.dia, horario: s.horario }));
    case 'terapeuta':
      return opcao.troca ? [{ tipo: 'troca', chave: opcao.troca.chave }] : daOpcao;
    default:
      return daOpcao;
  }
}

/** As opções que continuam valendo depois de um "Não" (sem buscar a agenda de novo). */
export const filtrarPorBloqueios = (opcoes: OpcaoDeEncaixe[], bloqueios: Bloqueio[], pacienteId: string) =>
  opcoes.filter((opcao) =>
    !bloqueios.some((b) => {
      switch (b.tipo) {
        case 'opcao': return b.chave === opcao.chave;
        case 'troca': return b.chave === opcao.troca?.chave;
        case 'nao_mexer': return b.pacienteId === opcao.troca?.paciente.id;
        case 'horario': return b.pacienteId === pacienteId && opcao.sessoes.some((s) => s.dia === b.dia && s.horario === b.horario);
      }
    })
  );
