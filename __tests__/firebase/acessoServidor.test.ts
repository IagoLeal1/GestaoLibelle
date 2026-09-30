// __tests__/firebase/acessoServidor.test.ts
// Quem pode usar as rotas do servidor (hoje, o assistente de agendamento). A rota lê o banco
// com acesso total, então confere o login e o cadastro antes de fazer qualquer coisa.
// Roda contra o emulador: npm run test:firebase
import admin from 'firebase-admin';
import { auth } from '@/lib/firebaseConfig';
import { PAPEIS_DA_GESTAO, verificarAcesso } from '@/lib/acessoServidor';
import {
  criarUsuario,
  encerrarAmbiente,
  entrarComo,
  iniciarAmbiente,
  limparDados,
  removerCadastro,
  UsuarioDeTeste,
} from './helpers';

beforeAll(iniciarAmbiente);
afterAll(async () => {
  await Promise.all(admin.apps.map((app) => app?.delete()));
  await encerrarAmbiente();
});
beforeEach(limparDados);

/** O cabeçalho que a tela manda: o login atual da pessoa. */
const loginDe = async (usuario: UsuarioDeTeste) => {
  await entrarComo(usuario);
  return `Bearer ${await auth.currentUser!.getIdToken()}`;
};

describe('acesso às rotas do servidor', () => {
  it('recusa quem não mandou o login', async () => {
    expect(await verificarAcesso(null, PAPEIS_DA_GESTAO)).toMatchObject({ ok: false, status: 401 });
  });

  it('recusa um login inválido', async () => {
    expect(await verificarAcesso('Bearer isto-nao-e-um-login', PAPEIS_DA_GESTAO)).toMatchObject({ ok: false, status: 401 });
  });

  it('recusa a família, mesmo aprovada', async () => {
    const maria = await criarUsuario('Maria Souza', { role: 'familiar' });

    expect(await verificarAcesso(await loginDe(maria), PAPEIS_DA_GESTAO)).toMatchObject({ ok: false, status: 403 });
  });

  it('recusa a gestão com cadastro ainda pendente', async () => {
    const carla = await criarUsuario('Carla Coordenadora', { role: 'coordenador', status: 'pendente' });

    expect(await verificarAcesso(await loginDe(carla), PAPEIS_DA_GESTAO)).toMatchObject({ ok: false, status: 403 });
  });

  it('recusa quem teve o cadastro removido, mesmo com o login ainda válido', async () => {
    const pedro = await criarUsuario('Pedro Recepção', { role: 'funcionario' });
    const login = await loginDe(pedro);
    await removerCadastro(pedro);

    expect(await verificarAcesso(login, PAPEIS_DA_GESTAO)).toMatchObject({ ok: false, status: 403 });
  });

  it('libera a gestão aprovada e diz quem é', async () => {
    const ana = await criarUsuario('Ana Recepção', { role: 'funcionario' });

    expect(await verificarAcesso(await loginDe(ana), PAPEIS_DA_GESTAO)).toEqual({ ok: true, uid: ana.uid, papel: 'funcionario' });
  });
});
