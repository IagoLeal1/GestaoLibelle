// __tests__/firebase/prontuario.test.ts
// O serviço do prontuário contra o emulador: o terapeuta escreve uma anotação na terapia dele (e entra
// junto na equipe da criança), corrige, fixa em "Para lembrar", e quem não atende a criança não lê.
// Roda contra o emulador: npm run test:firebase
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth } from '@/lib/firebaseConfig';
import { corrigirAnotacao, escreverAnotacao, getAnotacoes, getParaLembrar } from '@/services/prontuarioService';
import { criarPaciente, criarProfissional, criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;
beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);
beforeEach(limparDados);

async function sessao(id: string, patientId: string, professionalId: string, tipo: string) {
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const agora = Date.now();
    await setDoc(doc(contexto.firestore(), 'appointments', id), {
      patientId, professionalId, tipo, status: 'finalizado',
      start: Timestamp.fromMillis(agora - 3_600_000), end: Timestamp.fromMillis(agora - 600_000),
    });
  });
}

async function cenario() {
  const paula = await criarUsuario('Paula Fono', { role: 'profissional' });
  const lia = await criarUsuario('Lia TO', { role: 'profissional' });
  await criarProfissional('prof-paula', paula);
  await criarProfissional('prof-lia', lia);
  await criarPaciente('lucas', 'Lucas Souza');
  await sessao('sessao-paula', 'lucas', 'prof-paula', 'Fonoaudiologia');
  return { paula, lia };
}
const autor = (u: UsuarioDeTeste) => ({ uid: u.uid, nome: u.displayName });

it('o terapeuta escreve, lê, corrige e fixa em "Para lembrar"', async () => {
  const { paula } = await cenario();
  await entrarComo(paula);

  const escrita = await escreverAnotacao('lucas', autor(paula), {
    terapia: 'Fonoaudiologia', texto: 'Começar pelo jogo de encaixe.', fixada: false, atendimentoId: 'sessao-paula',
  });

  expect((await getAnotacoes('lucas')).map((a) => a.texto)).toEqual(['Começar pelo jogo de encaixe.']);
  expect(await getParaLembrar('lucas', 'Fonoaudiologia')).toEqual([]);

  await corrigirAnotacao('lucas', escrita.id, { texto: 'Começar sempre pelo jogo de encaixe.', fixada: true });

  const lembrar = await getParaLembrar('lucas', 'Fonoaudiologia');
  expect(lembrar.map((a) => [a.texto, a.fixada, !!a.editadoEm])).toEqual([['Começar sempre pelo jogo de encaixe.', true, true]]);
});

it('quem não atende a criança não lê o prontuário dela', async () => {
  const { paula, lia } = await cenario();
  await entrarComo(paula);
  await escreverAnotacao('lucas', autor(paula), {
    terapia: 'Fonoaudiologia', texto: 'Objetivo: frases de 3 palavras.', fixada: true, atendimentoId: 'sessao-paula',
  });

  await entrarComo(lia);
  await expect(getAnotacoes('lucas')).rejects.toMatchObject({ code: 'permission-denied' });
  expect(auth.currentUser?.uid).toBe(lia.uid);
});
