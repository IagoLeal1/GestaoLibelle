// __tests__/firebase/aprovacao.test.ts
// Aprovação de profissionais em "Aprovação de Acesso". Sem cadastro prévio em Profissionais, a
// aprovação criava o cadastro com campos em inglês (name, specialties...) e ele sumia das listas.
// Roda contra o emulador: npm run test:firebase
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseConfig';
import { approveUser } from '@/services/adminService';
import { getProfessionals } from '@/services/professionalService';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados } from './helpers';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await iniciarAmbiente();
});
afterAll(encerrarAmbiente);

beforeEach(async () => {
  await limparDados();
  const admin = await criarUsuario('Ana Admin', { role: 'admin' });
  // O cadastro que a tela de inscrição grava para um profissional (signUpAndCreateProfile)
  await testEnv.withSecurityRulesDisabled(async (contexto) => {
    await setDoc(doc(contexto.firestore(), 'users', 'paula-nova'), {
      uid: 'paula-nova',
      displayName: 'Paula Nova',
      email: 'paula.nova@libelle.test',
      profile: {
        role: 'profissional',
        status: 'pendente',
        cpf: '123.456.789-00',
        telefone: '(21) 98888-7777',
        createdAt: Timestamp.now(),
        professionalData: { especialidade: 'Fonoaudiologia', conselho: 'CRFa', numeroConselho: '1-2345' },
      },
    });
  });
  await entrarComo(admin);
});

describe('aprovação de profissionais', () => {
  it('sem cadastro prévio, cria o profissional no formato das outras telas e ele aparece na lista', async () => {
    const resultado = await approveUser('paula-nova');

    expect(resultado).toMatchObject({ success: true });
    const [paula] = await getProfessionals();
    expect(paula).toMatchObject({
      userId: 'paula-nova',
      fullName: 'Paula Nova',
      email: 'paula.nova@libelle.test',
      especialidade: 'Fonoaudiologia',
      conselho: 'CRFa',
      numeroConselho: '1-2345',
      cpf: '123.456.789-00',
      telefone: '(21) 98888-7777',
      status: 'ativo',
    });
    const perfil = (await getDoc(doc(db, 'users', 'paula-nova'))).data()?.profile;
    expect(perfil).toMatchObject({ status: 'aprovado', professionalId: paula.id });
  });

  it('com cadastro prévio pelo CPF, liga a conta ao profissional que já existe', async () => {
    await testEnv.withSecurityRulesDisabled(async (contexto) => {
      await setDoc(doc(contexto.firestore(), 'professionals', 'prof-paula'), {
        fullName: 'Paula Nova', cpf: '123.456.789-00', especialidade: 'Fonoaudiologia', status: 'ativo',
      });
    });

    await approveUser('paula-nova');

    const profissionais = await getDocs(collection(db, 'professionals'));
    expect(profissionais.docs.map((p) => [p.id, p.data().userId])).toEqual([['prof-paula', 'paula-nova']]);
    const perfil = (await getDoc(doc(db, 'users', 'paula-nova'))).data()?.profile;
    expect(perfil).toMatchObject({ status: 'aprovado', professionalId: 'prof-paula' });
  });
});
