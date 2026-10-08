// __tests__/firebase/ligarProfissional.test.ts
// Quem entrou como funcionária e virou profissional em Gerenciar Usuários ficava sem as sessões, porque
// a conta não era ligada ao cadastro em Profissionais. O admin liga os dois lados de uma vez.
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { ligacaoDoProfissional } from '@/lib/ligarProfissional';
import { ligarContaAoProfissional, updateUserRole } from '@/services/adminService';
import { getProfessionals } from '@/services/professionalService';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, type UsuarioDeTeste } from './helpers';

let testEnv: RulesTestEnvironment;
let admin: UsuarioDeTeste;
let karla: UsuarioDeTeste;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await limparDados();
  admin = await criarUsuario('Ana Admin', { role: 'admin' });
  karla = await criarUsuario('Karla Mendes', { role: 'funcionario' });
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    const banco = contexto.firestore();
    await updateDoc(doc(banco, 'users', karla.uid), { 'profile.cpf': '123.456.789-00' });
    // O cadastro feito em Profissionais → Novo, sem conta ligada
    await setDoc(doc(banco, 'professionals', 'prof-karla'), {
      fullName: 'Karla Mendes', cpf: '12345678900', email: 'karla@clinica.test', status: 'ativo',
    });
  });
  await entrarComo(admin);
});

it('o admin troca para profissional e liga a conta ao cadastro dos dois lados', async () => {
  await updateUserRole(karla.uid, 'profissional');
  const ligacao = ligacaoDoProfissional({ uid: karla.uid, email: karla.email, cpf: '123.456.789-00' }, await getProfessionals());
  expect(ligacao).toMatchObject({ tipo: 'ligar', professionalId: 'prof-karla' });
  if (ligacao.tipo !== 'ligar') return;

  expect(await ligarContaAoProfissional(karla.uid, ligacao)).toEqual({ success: true });

  expect((await getDoc(doc(db, 'professionals', 'prof-karla'))).data()).toMatchObject({ userId: karla.uid, fullName: 'Karla Mendes' });
  expect((await getDoc(doc(db, 'users', karla.uid))).data()?.profile).toMatchObject({ role: 'profissional', professionalId: 'prof-karla', cpf: '123.456.789-00' });
});

it('quem não é admin não consegue ligar', async () => {
  const coordenadora = await criarUsuario('Carla Coord', { role: 'coordenador' });
  await entrarComo(coordenadora);

  const resultado = await ligarContaAoProfissional(karla.uid, { professionalId: 'prof-karla', noPerfil: true, noCadastro: true });

  expect(resultado.success).toBe(false);
  await entrarComo(admin);
  expect((await getDoc(doc(db, 'professionals', 'prof-karla'))).data()?.userId).toBeUndefined();
});
