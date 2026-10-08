// __tests__/firebase/diagnostico.test.ts
// O diagnóstico fica na ficha da criança e é escrito por quem já edita a ficha (admin, coordenação e
// recepção), sem regra nova; o terapeuta só lê. A equipe sai da agenda da criança, que o terapeuta já lê.
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { getSessoesDaEquipe, salvarDiagnostico } from '@/services/diagnosticoService';
import { criarPaciente, criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, type UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;
let recepcao: UsuarioDeTeste;
let terapeuta: UsuarioDeTeste;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await limparDados();
  recepcao = await criarUsuario('Rafa Recepção', { role: 'funcionario' });
  terapeuta = await criarUsuario('Rui Psicólogo', { role: 'profissional' });
  await criarPaciente('theo', 'Theo Martins');
});

it('a recepção salva o diagnóstico limpo, com quem atualizou e quando', async () => {
  await entrarComo(recepcao);

  await salvarDiagnostico('theo', [{ nome: ' TEA · nível 1 ', cid: 'f84.0', situacao: 'confirmado' }, { nome: '' }], 'Rafa Recepção');

  const ficha = (await getDoc(doc(db, 'patients', 'theo'))).data();
  expect(ficha?.diagnosticos).toEqual([{ nome: 'TEA · nível 1', cid: 'F84.0', situacao: 'confirmado' }]);
  expect(ficha?.diagnosticoAtualizadoPor).toBe('Rafa Recepção');
  expect(ficha?.diagnosticoAtualizadoEm).toBeInstanceOf(Timestamp);
  expect(ficha?.fullName).toBe('Theo Martins'); // o resto da ficha fica como estava
});

it('o terapeuta não escreve o diagnóstico', async () => {
  await entrarComo(terapeuta);

  await expect(salvarDiagnostico('theo', [{ nome: 'TDAH' }], 'Rui')).rejects.toThrow();
});

it('o terapeuta lê a equipe da criança, com as sessões de outros terapeutas', async () => {
  const agora = new Date();
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const sessao = (id: string, dias: number, tipo: string, professionalId: string, professionalName: string) =>
      setDoc(doc(contexto.firestore(), 'appointments', id), {
        patientId: 'theo', patientName: 'Theo Martins', tipo, professionalId, professionalName, status: 'agendado',
        start: Timestamp.fromMillis(agora.getTime() + dias * 86400000),
        end: Timestamp.fromMillis(agora.getTime() + dias * 86400000 + 50 * 60000),
      });
    await sessao('s1', -3, 'Psicologia', 'prof-rui', 'Rui Psicólogo');
    await sessao('s2', 2, 'Fonoaudiologia', 'prof-paula', 'Paula Fonoaudióloga');
    await sessao('s3', -60, 'Musicoterapia', 'prof-antiga', 'Fora da janela');
  });
  await entrarComo(terapeuta);

  const sessoes = await getSessoesDaEquipe('theo', agora);

  expect(sessoes.map((s) => s.tipo).sort()).toEqual(['Fonoaudiologia', 'Psicologia']);
  expect(sessoes[0].start).toBeInstanceOf(Date);
});
