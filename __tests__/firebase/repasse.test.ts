// __tests__/firebase/repasse.test.ts
// Repasse ao profissional, gerado quando a recepção finaliza um atendimento. A recepção só mexe
// no repasse: o resto do Financeiro é do admin.
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { updateAppointment } from '@/services/appointmentService';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, UsuarioDeTeste } from './helpers';

const REPASSE = 'Repasse de Profissional';

let testEnv: RulesTestEnvironment;
let recepcao: UsuarioDeTeste;
let admin: UsuarioDeTeste;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await limparDados();
  recepcao = await criarUsuario('Rafa Recepção', { role: 'funcionario' });
  admin = await criarUsuario('Ana Admin', { role: 'admin' });
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    // Paula recebe 50% do valor da sessão
    await setDoc(doc(banco, 'professionals', 'prof-paula'), {
      fullName: 'Paula Fonoaudióloga',
      status: 'ativo',
      financeiro: { tipoPagamento: 'repasse', percentualRepasse: 50 },
    });
    await setDoc(doc(banco, 'bankAccounts', 'conta-padrao'), { name: 'Conta principal', isDefault: true, currentBalance: 0 });
    await setDoc(doc(banco, 'bankAccounts', 'conta-reserva'), { name: 'Reserva', isDefault: false, currentBalance: 0 });
    const inicio = Timestamp.fromDate(new Date('2026-09-28T10:00:00-03:00'));
    await setDoc(doc(banco, 'appointments', 'ag-1'), {
      patientId: 'paciente-lucas',
      patientName: 'Lucas Souza',
      professionalId: 'prof-paula',
      professionalName: 'Paula Fonoaudióloga',
      title: 'Lucas Souza - Paula Fonoaudióloga',
      start: inicio,
      end: inicio,
      status: 'agendado',
      tipo: 'Fonoaudiologia',
      convenio: 'particular',
      valorConsulta: 200,
      observacoes: '',
    });
  });
});

/** Os lançamentos ligados ao atendimento, como o admin os vê no Financeiro. */
const lancamentosDo = async (atendimento: string) => {
  await entrarComo(admin);
  const lancamentos = await getDocs(query(collection(db, 'transactions'), where('appointmentId', '==', atendimento)));
  return lancamentos.docs.map((lancamento) => ({ id: lancamento.id, ...lancamento.data() }));
};

describe('repasse ao profissional', () => {
  it('a recepção finaliza um atendimento e o repasse é gerado na conta padrão', async () => {
    await entrarComo(recepcao);

    const resultado = await updateAppointment('ag-1', { status: 'finalizado' });

    expect(resultado).toMatchObject({ success: true });
    expect(await lancamentosDo('ag-1')).toEqual([
      expect.objectContaining({ category: REPASSE, status: 'pendente', value: 100, bankAccountId: 'conta-padrao' }),
    ]);
  });

  it('salvar de novo um atendimento com o repasse já pago mantém o pagamento', async () => {
    await testEnv.withSecurityRulesDisabled(async (contexto) => {
      const banco = contexto.firestore();
      await setDoc(doc(banco, 'appointments', 'ag-1'), { status: 'finalizado' }, { merge: true });
      await setDoc(doc(banco, 'transactions', 'repasse-pago'), {
        category: REPASSE, appointmentId: 'ag-1', status: 'pago', value: 100, type: 'despesa',
      });
    });
    await entrarComo(recepcao);

    const resultado = await updateAppointment('ag-1', { observacoes: 'Trouxe o relatório da escola' });

    expect(resultado).toMatchObject({ success: true });
    expect(await lancamentosDo('ag-1')).toEqual([expect.objectContaining({ id: 'repasse-pago', status: 'pago' })]);
  });

  it('cancelar um atendimento finalizado apaga o repasse ainda pendente', async () => {
    await entrarComo(recepcao);
    await updateAppointment('ag-1', { status: 'finalizado' });

    await updateAppointment('ag-1', { status: 'cancelado' });

    expect(await lancamentosDo('ag-1')).toEqual([]);
  });
});
