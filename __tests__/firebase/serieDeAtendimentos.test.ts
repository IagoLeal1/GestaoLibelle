// __tests__/firebase/serieDeAtendimentos.test.ts
// Editar "este e os próximos" de uma série de atendimentos (a chave de série no modal de edição).
// Antes a série era apagada e recriada: os futuros voltavam para "agendado", perdiam as próprias
// observações e valores e ganhavam códigos novos.
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '@/lib/firebaseConfig';
import { Appointment, updateAppointmentBlock } from '@/services/appointmentService';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;
let recepcao: UsuarioDeTeste;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

// Horários no fuso do aparelho, como o formulário do app
const as = (ano: number, mes: number, dia: number, hora: number, minuto = 0) =>
  Timestamp.fromDate(new Date(ano, mes - 1, dia, hora, minuto));

// Série semanal de terça, 10h: uma sessão passada já finalizada, uma futura cancelada (com sala e
// observação próprias) e um buraco no dia 20/10, que foi excluído
const SERIE = {
  'ag-passado': { start: as(2026, 9, 29, 10), status: 'finalizado', sala: 'sala-1', observacoes: '' },
  'ag-1': { start: as(2026, 10, 6, 10), status: 'agendado', sala: 'sala-1', observacoes: '' },
  'ag-2': { start: as(2026, 10, 13, 10), status: 'cancelado', sala: 'sala-2', observacoes: 'Viagem da família' },
  'ag-3': { start: as(2026, 10, 27, 10), status: 'agendado', sala: 'sala-1', observacoes: '' },
};

beforeEach(async () => {
  await limparDados();
  recepcao = await criarUsuario('Rafa Recepção', { role: 'funcionario' });
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    await setDoc(doc(banco, 'patients', 'paciente-lucas'), { fullName: 'Lucas Souza', status: 'ativo' });
    await setDoc(doc(banco, 'professionals', 'prof-paula'), {
      fullName: 'Paula Fonoaudióloga', status: 'ativo', financeiro: { tipoPagamento: 'repasse', percentualRepasse: 50 },
    });
    await setDoc(doc(banco, 'professionals', 'prof-rui'), {
      fullName: 'Rui Psicólogo', status: 'ativo', financeiro: { tipoPagamento: 'repasse', percentualRepasse: 40 },
    });
    await setDoc(doc(banco, 'bankAccounts', 'conta-padrao'), { name: 'Conta principal', isDefault: true });
    for (const [id, atendimento] of Object.entries(SERIE)) {
      await setDoc(doc(banco, 'appointments', id), {
        ...atendimento,
        end: Timestamp.fromMillis(atendimento.start.toMillis() + 50 * 60 * 1000),
        patientId: 'paciente-lucas',
        patientName: 'Lucas Souza',
        professionalId: 'prof-paula',
        professionalName: 'Paula Fonoaudióloga',
        title: 'Lucas Souza - Paula Fonoaudióloga',
        tipo: 'Fonoaudiologia',
        convenio: 'particular',
        valorConsulta: 150,
        statusSecundario: '',
        blockId: 'serie-lucas',
        isLastInBlock: id === 'ag-3',
      });
    }
  });
  await entrarComo(recepcao);
});

/** O atendimento como a tela o tem ao abrir o modal de edição. */
const atendimento = async (id: string) =>
  ({ id, ...(await getDoc(doc(db, 'appointments', id))).data() } as Appointment);

/** O formulário do modal de edição, preenchido com os dados do ag-1, mais o que a pessoa mudou. */
const formulario = (mudancas: Record<string, unknown> = {}) => ({
  patientId: 'paciente-lucas',
  professionalId: 'prof-paula',
  data: '2026-10-06',
  horaInicio: '10:00',
  horaFim: '10:50',
  tipo: 'Fonoaudiologia',
  sala: 'sala-1',
  convenio: 'particular',
  valorConsulta: 150,
  observacoes: '',
  status: 'agendado' as const,
  statusSecundario: '',
  ...mudancas,
});

const quando = (atendimento: Appointment) => format(atendimento.start.toDate(), 'dd/MM HH:mm');

describe('editar este e os próximos atendimentos da série', () => {
  it('mudar o horário mantém os códigos, o cancelamento e as observações de cada atendimento', async () => {
    const resultado = await updateAppointmentBlock(await atendimento('ag-1'), formulario({ horaInicio: '14:00', horaFim: '14:50' }));

    expect(resultado).toMatchObject({ success: true });
    const [ag1, ag2, ag3, passado] = await Promise.all(['ag-1', 'ag-2', 'ag-3', 'ag-passado'].map(atendimento));
    expect([ag1, ag2, ag3].map(quando)).toEqual(['06/10 14:00', '13/10 14:00', '27/10 14:00']);
    expect(ag2).toMatchObject({ status: 'cancelado', observacoes: 'Viagem da família', sala: 'sala-2' });
    expect(format(ag1.end.toDate(), 'HH:mm')).toBe('14:50');
    expect(quando(passado)).toBe('29/09 10:00');
  });

  it('o que a pessoa muda no formulário vale para toda a série', async () => {
    await updateAppointmentBlock(await atendimento('ag-1'), formulario({ sala: 'sala-3', valorConsulta: 180 }));

    const serie = await Promise.all(['ag-1', 'ag-2', 'ag-3'].map(atendimento));
    expect(serie.map((a) => [a.sala, a.valorConsulta])).toEqual([['sala-3', 180], ['sala-3', 180], ['sala-3', 180]]);
    expect(serie[1]).toMatchObject({ status: 'cancelado', observacoes: 'Viagem da família' });
  });

  it('mudar a data leva a série inteira sem mudar o intervalo entre os atendimentos', async () => {
    await updateAppointmentBlock(await atendimento('ag-1'), formulario({ data: '2026-10-08' }));

    const serie = await Promise.all(['ag-1', 'ag-2', 'ag-3'].map(atendimento));
    expect(serie.map(quando)).toEqual(['08/10 10:00', '15/10 10:00', '29/10 10:00']);
  });

  it('trocar o terapeuta atualiza o nome dele em toda a série', async () => {
    await updateAppointmentBlock(await atendimento('ag-1'), formulario({ professionalId: 'prof-rui' }));

    const serie = await Promise.all(['ag-1', 'ag-2', 'ag-3'].map(atendimento));
    expect(serie.map((a) => a.professionalName)).toEqual(['Rui Psicólogo', 'Rui Psicólogo', 'Rui Psicólogo']);
    expect(serie[0].title).toBe('Lucas Souza - Rui Psicólogo');
  });

  it('finalizar pela série vale só para o atendimento editado e gera o repasse dele', async () => {
    await updateAppointmentBlock(await atendimento('ag-1'), formulario({ status: 'finalizado' }));

    const serie = await Promise.all(['ag-1', 'ag-2', 'ag-3'].map(atendimento));
    expect(serie.map((a) => a.status)).toEqual(['finalizado', 'cancelado', 'agendado']);
    const repasses = await getDocs(query(
      collection(db, 'transactions'),
      where('appointmentId', '==', 'ag-1'),
      where('category', '==', 'Repasse de Profissional')
    ));
    expect(repasses.docs.map((r) => r.data().value)).toEqual([75]);
  });
});
