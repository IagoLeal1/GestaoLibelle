// __tests__/firebase/senhaProvisoria.test.ts
// A senha provisória: só o admin define a senha de outra pessoa. Quem entra com ela é obrigado a criar
// uma senha nova, e só então a marca de "trocar a senha" sai do cadastro.
// Roda contra o emulador: npm run test:firebase
import admin from 'firebase-admin';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { definirSenhaProvisoria, trocarSenhaProvisoria } from '@/lib/senhaProvisoria';
import { initAdmin } from '@/lib/firebaseAdmin';
import { criarUsuario, encerrarAmbiente, entrarComo, iniciarAmbiente, limparDados, UsuarioDeTeste } from './helpers';

beforeAll(iniciarAmbiente);
afterAll(async () => {
  await Promise.all(admin.apps.map((app) => app?.delete()));
  await encerrarAmbiente();
});
beforeEach(limparDados);

const loginDe = async (usuario: UsuarioDeTeste) => {
  await entrarComo(usuario);
  return `Bearer ${await auth.currentUser!.getIdToken()}`;
};
const cadastro = async (uid: string) => (await initAdmin().doc(`users/${uid}`).get()).data();
const consegueEntrar = async (email: string, senha: string) => {
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    await signOut(auth);
    return true;
  } catch {
    return false;
  }
};

describe('definir a senha provisória', () => {
  it('o admin define: a pessoa entra com ela e fica marcada para trocar', async () => {
    const ana = await criarUsuario('Ana Admin', { role: 'admin' });
    const paula = await criarUsuario('Paula Fono', { role: 'profissional' });

    const resposta = await definirSenhaProvisoria(await loginDe(ana), { uid: paula.uid, senha: 'libelle-482193' });

    expect(resposta.status).toBe(200);
    expect(await consegueEntrar(paula.email, 'libelle-482193')).toBe(true);
    expect(await cadastro(paula.uid)).toMatchObject({ trocarSenha: true, senhaProvisoriaPor: ana.uid });
  });

  it('a coordenação e a recepção não podem', async () => {
    const carla = await criarUsuario('Carla Coordenadora', { role: 'coordenador' });
    const paula = await criarUsuario('Paula Fono', { role: 'profissional' });

    const resposta = await definirSenhaProvisoria(await loginDe(carla), { uid: paula.uid, senha: 'libelle-482193' });

    expect(resposta.status).toBe(403);
    expect((await cadastro(paula.uid))?.trocarSenha).toBeUndefined();
  });

  it('recusa senha curta e a própria senha do admin', async () => {
    const ana = await criarUsuario('Ana Admin', { role: 'admin' });
    const paula = await criarUsuario('Paula Fono', { role: 'profissional' });
    const login = await loginDe(ana);

    expect((await definirSenhaProvisoria(login, { uid: paula.uid, senha: '123' })).status).toBe(400);
    expect((await definirSenhaProvisoria(login, { uid: ana.uid, senha: 'libelle-482193' })).status).toBe(400);
  });

  it('quem não tem cadastro não ganha senha', async () => {
    const ana = await criarUsuario('Ana Admin', { role: 'admin' });

    expect((await definirSenhaProvisoria(await loginDe(ana), { uid: 'nao-existe', senha: 'libelle-482193' })).status).toBe(404);
  });
});

describe('trocar a senha provisória', () => {
  async function comSenhaProvisoria() {
    const ana = await criarUsuario('Ana Admin', { role: 'admin' });
    const paula = await criarUsuario('Paula Fono', { role: 'profissional' });
    await definirSenhaProvisoria(await loginDe(ana), { uid: paula.uid, senha: 'libelle-482193' });
    await signInWithEmailAndPassword(auth, paula.email, 'libelle-482193');
    return { paula, login: `Bearer ${await auth.currentUser!.getIdToken()}` };
  }

  it('a pessoa cria a senha dela: a provisória para de valer e a marca sai', async () => {
    const { paula, login } = await comSenhaProvisoria();

    const resposta = await trocarSenhaProvisoria(login, { senha: 'minha-senha-nova' });

    expect(resposta.status).toBe(200);
    expect(await consegueEntrar(paula.email, 'minha-senha-nova')).toBe(true);
    expect(await consegueEntrar(paula.email, 'libelle-482193')).toBe(false);
    expect((await cadastro(paula.uid))?.trocarSenha).toBeUndefined();
  });

  it('recusa senha curta', async () => {
    const { login } = await comSenhaProvisoria();

    expect((await trocarSenhaProvisoria(login, { senha: '123' })).status).toBe(400);
  });

  it('quem não está com senha provisória não troca por aqui', async () => {
    const paula = await criarUsuario('Paula Fono', { role: 'profissional' });

    expect((await trocarSenhaProvisoria(await loginDe(paula), { senha: 'minha-senha-nova' })).status).toBe(409);
  });
});
