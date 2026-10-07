// __tests__/paginas/senhaProvisoria.test.tsx
// A senha provisória na tela, seguindo o desenho aprovado: o botão com a chave em Gerenciar Usuários,
// a janela que define e mostra a senha para copiar, e a tela que obriga a criar uma senha nova.
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { reauthenticateWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { definirSenhaProvisoria, gerarSenhaProvisoria, trocarMinhaSenhaProvisoria } from '@/services/senhaService';
import { BotaoSenhaProvisoria } from '@/components/admin/senha-provisoria';
import { TrocarSenhaProvisoria } from '@/components/auth/trocar-senha-provisoria';
import { AuthGuard } from '@/components/auth/auth-guard';
import { abrirDoZero } from '@/lib/navegar';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/senhaService', () => ({
  definirSenhaProvisoria: jest.fn(),
  trocarMinhaSenhaProvisoria: jest.fn(),
  gerarSenhaProvisoria: jest.fn(),
}));
jest.mock('@/lib/firebaseConfig', () => ({ auth: { currentUser: { email: 'paula@medicina.ufrj.br' } } }));
jest.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: jest.fn(() => 'credencial') },
  reauthenticateWithCredential: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/lib/navegar', () => ({ abrirDoZero: jest.fn() }));

const router = { replace: jest.fn(), push: jest.fn() };
beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue(router);
});

describe('o botão com a chave, em Gerenciar Usuários', () => {
  const PAULA = { uid: 'uid-paula', nome: 'Paula Fono', email: 'paula@medicina.ufrj.br' };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'uid-ana' } });
    (gerarSenhaProvisoria as jest.Mock).mockReturnValueOnce('libelle-111111').mockReturnValueOnce('libelle-222222');
  });

  it('sugere uma senha, deixa gerar outra e, ao definir, mostra a senha para copiar', async () => {
    (definirSenhaProvisoria as jest.Mock).mockResolvedValue({ ok: true });
    const escrever = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText: escrever } });
    render(<BotaoSenhaProvisoria pessoa={PAULA} />);

    fireEvent.click(screen.getByRole('button', { name: 'Senha provisória de Paula Fono' }));
    const campo = screen.getByRole('textbox', { name: 'Senha provisória' });
    expect(campo).toHaveValue('libelle-111111');

    fireEvent.click(screen.getByRole('button', { name: 'Gerar outra' }));
    expect(campo).toHaveValue('libelle-222222');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Definir senha' }));
    });
    expect(definirSenhaProvisoria).toHaveBeenCalledWith('uid-paula', 'libelle-222222');
    expect(screen.getByText('Senha definida')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copiar' }));
    });
    expect(escrever).toHaveBeenCalledWith('libelle-222222');
  });

  it('senha curta não deixa definir', () => {
    render(<BotaoSenhaProvisoria pessoa={PAULA} />);
    fireEvent.click(screen.getByRole('button', { name: 'Senha provisória de Paula Fono' }));

    fireEvent.change(screen.getByRole('textbox', { name: 'Senha provisória' }), { target: { value: '123' } });

    expect(screen.getByRole('button', { name: 'Definir senha' })).toBeDisabled();
    expect(screen.getByText('Pelo menos 6 caracteres.')).toBeInTheDocument();
  });

  it('mostra o erro do servidor', async () => {
    (definirSenhaProvisoria as jest.Mock).mockResolvedValue({ ok: false, erro: 'Seu perfil não tem acesso a esta função.' });
    render(<BotaoSenhaProvisoria pessoa={PAULA} />);
    fireEvent.click(screen.getByRole('button', { name: 'Senha provisória de Paula Fono' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Definir senha' }));
    });

    expect(screen.getByText('Seu perfil não tem acesso a esta função.')).toBeInTheDocument();
  });

  it('o admin não vê a chave na própria linha', () => {
    (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'uid-paula' } });
    render(<BotaoSenhaProvisoria pessoa={PAULA} />);

    expect(screen.queryByRole('button', { name: /Senha provisória/ })).not.toBeInTheDocument();
  });
});

describe('a tela "Crie uma senha nova"', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { email: 'paula@medicina.ufrj.br' },
      firestoreUser: { uid: 'uid-paula', displayName: 'Paula Fono', trocarSenha: true },
      loading: false,
    });
  });

  const preencher = (nova: string, confirma: string) => {
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: nova } });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), { target: { value: confirma } });
  };

  it('avisa quando as duas senhas não são iguais', async () => {
    render(<TrocarSenhaProvisoria />);
    preencher('minha-senha', 'minha-senhx');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar e entrar' }));
    });

    expect(screen.getByText('As duas senhas não são iguais.')).toBeInTheDocument();
    expect(trocarMinhaSenhaProvisoria).not.toHaveBeenCalled();
  });

  it('não deixa repetir a senha provisória', async () => {
    (reauthenticateWithCredential as jest.Mock).mockResolvedValue({});
    render(<TrocarSenhaProvisoria />);
    preencher('libelle-111111', 'libelle-111111');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar e entrar' }));
    });

    expect(screen.getByText('Escolha uma senha diferente da provisória.')).toBeInTheDocument();
    expect(trocarMinhaSenhaProvisoria).not.toHaveBeenCalled();
  });

  it('salva a senha nova, entra de novo com ela e abre o sistema', async () => {
    (reauthenticateWithCredential as jest.Mock).mockRejectedValue({ code: 'auth/invalid-credential' });
    (trocarMinhaSenhaProvisoria as jest.Mock).mockResolvedValue({ ok: true });
    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({});
    render(<TrocarSenhaProvisoria />);
    preencher('minha-senha-nova', 'minha-senha-nova');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Salvar e entrar' }));
    });

    expect(trocarMinhaSenhaProvisoria).toHaveBeenCalledWith('minha-senha-nova');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'paula@medicina.ufrj.br', 'minha-senha-nova');
    await waitFor(() => expect(abrirDoZero).toHaveBeenCalledWith('/'));
  });

  it('quem não precisa trocar volta para o início', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: { email: 'x' }, firestoreUser: { uid: 'u', trocarSenha: false }, loading: false });
    render(<TrocarSenhaProvisoria />);

    expect(router.replace).toHaveBeenCalledWith('/');
  });
});

it('com a senha provisória, nenhuma tela do sistema abre antes de trocar', () => {
  (useAuth as jest.Mock).mockReturnValue({
    user: { uid: 'u' },
    firestoreUser: { uid: 'u', profile: { role: 'profissional', status: 'aprovado' }, trocarSenha: true },
    loading: false,
  });
  render(<AuthGuard><p>Tela do sistema</p></AuthGuard>);

  expect(screen.queryByText('Tela do sistema')).not.toBeInTheDocument();
  expect(router.replace).toHaveBeenCalledWith('/trocar-senha');
});
