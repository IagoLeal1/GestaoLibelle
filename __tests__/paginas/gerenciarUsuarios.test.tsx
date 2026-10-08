// __tests__/paginas/gerenciarUsuarios.test.tsx
// Gerenciar Usuários liga a conta de cada profissional ao cadastro dela em Profissionais: sozinho ao
// abrir a tela (conserta quem já virou profissional sem a ligação) e ao trocar o papel para profissional.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { getAllApprovedUsers, ligarContaAoProfissional, trocarCadastroDoProfissional, updateUserRole } from '@/services/adminService';
import { getProfessionals } from '@/services/professionalService';
import { useToast } from '@/hooks/use-toast';
import GerenciarUsuariosPage from '@/app/(dashboard)/admin/gerenciar-usuarios/page';

jest.mock('@/services/adminService', () => ({
  getAllApprovedUsers: jest.fn(),
  updateUserRole: jest.fn(),
  deleteActiveUser: jest.fn(),
  ligarContaAoProfissional: jest.fn(),
  trocarCadastroDoProfissional: jest.fn(),
}));
jest.mock('@/services/professionalService', () => ({ getProfessionals: jest.fn() }));
jest.mock('@/hooks/use-toast', () => ({ useToast: jest.fn() }));
jest.mock('@/components/admin/senha-provisoria', () => ({ BotaoSenhaProvisoria: () => null }));
// O Select do Radix não abre no jsdom: um <select> comum faz o mesmo papel no teste
jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select aria-label="Papel" value={value} onChange={(e) => onValueChange(e.target.value)}>{children}</select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

const toast = jest.fn();
const usuario = (id: string, nome: string, role: string, profile: Record<string, unknown> = {}) => ({
  id, displayName: nome, email: `${id}@clinica.test`, phone: null, cpf: (profile.cpf as string) ?? null,
  profile: { role, status: 'aprovado', ...profile },
});

beforeEach(() => {
  jest.clearAllMocks();
  (useToast as jest.Mock).mockReturnValue({ toast });
  (ligarContaAoProfissional as jest.Mock).mockResolvedValue({ success: true });
  (updateUserRole as jest.Mock).mockResolvedValue({ success: true });
  (trocarCadastroDoProfissional as jest.Mock).mockResolvedValue({ success: true });
});

it('ao abrir, liga sozinha a profissional que estava sem ligação e avisa', async () => {
  (getAllApprovedUsers as jest.Mock).mockResolvedValue([
    usuario('karla', 'Karla Mendes', 'profissional', { cpf: '123.456.789-00' }),
    usuario('paula', 'Paula Fono', 'profissional', { professionalId: 'prof-paula' }),
  ]);
  (getProfessionals as jest.Mock).mockResolvedValue([
    { id: 'prof-karla', fullName: 'Karla Mendes', cpf: '12345678900', email: '' },
    { id: 'prof-paula', fullName: 'Paula Fono', cpf: '', email: '', userId: 'paula' },
  ]);
  render(<GerenciarUsuariosPage />);

  await waitFor(() => expect(ligarContaAoProfissional).toHaveBeenCalledTimes(1));
  expect(ligarContaAoProfissional).toHaveBeenCalledWith('karla', expect.objectContaining({ professionalId: 'prof-karla', noPerfil: true, noCadastro: true }));
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('Karla Mendes') }));
});

it('profissional sem cadastro em Profissionais fica marcada na tabela', async () => {
  (getAllApprovedUsers as jest.Mock).mockResolvedValue([usuario('karla', 'Karla Mendes', 'profissional', { cpf: '123.456.789-00' })]);
  (getProfessionals as jest.Mock).mockResolvedValue([]);
  render(<GerenciarUsuariosPage />);

  expect(await screen.findAllByText('Sem cadastro em Profissionais')).not.toHaveLength(0);
  expect(ligarContaAoProfissional).not.toHaveBeenCalled();
});

it('trocar de funcionária para profissional já liga ao cadastro', async () => {
  (getAllApprovedUsers as jest.Mock).mockResolvedValue([usuario('karla', 'Karla Mendes', 'funcionario', { cpf: '123.456.789-00' })]);
  (getProfessionals as jest.Mock).mockResolvedValue([{ id: 'prof-karla', fullName: 'Karla Mendes', cpf: '123.456.789-00', email: '' }]);
  render(<GerenciarUsuariosPage />);

  const [papel] = await screen.findAllByRole('combobox', { name: 'Papel' });
  expect(ligarContaAoProfissional).not.toHaveBeenCalled(); // funcionária não precisa de cadastro
  fireEvent.change(papel, { target: { value: 'profissional' } });

  await waitFor(() => expect(ligarContaAoProfissional).toHaveBeenCalledWith('karla', expect.objectContaining({ professionalId: 'prof-karla' })));
  expect(updateUserRole).toHaveBeenCalledWith('karla', 'profissional');
});

it('trocar para profissional sem cadastro explica o que fazer', async () => {
  (getAllApprovedUsers as jest.Mock).mockResolvedValue([usuario('karla', 'Karla Mendes', 'funcionario')]);
  (getProfessionals as jest.Mock).mockResolvedValue([]);
  render(<GerenciarUsuariosPage />);

  const [papel] = await screen.findAllByRole('combobox', { name: 'Papel' });
  fireEvent.change(papel, { target: { value: 'profissional' } });

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: expect.stringContaining('Novo Profissional') }))
  );
  expect(ligarContaAoProfissional).not.toHaveBeenCalled();
});

// ——— Ligar na mão: o cadastro foi feito com um e-mail e a conta com outro ———
const contasComThays = () => {
  (getAllApprovedUsers as jest.Mock).mockResolvedValue([
    usuario('thays', 'Thays Rocha', 'profissional'),
    usuario('rui', 'Rui Psicólogo', 'profissional', { professionalId: 'prof-rui' }),
  ]);
  (getProfessionals as jest.Mock).mockResolvedValue([
    { id: 'prof-rui', fullName: 'Rui Psicólogo', especialidade: 'Psicologia', email: '', cpf: '', userId: 'rui' },
    { id: 'prof-thays', fullName: 'Thays Rocha', especialidade: 'Fonoaudiologia', email: 'thays.rocha@outro.test', cpf: '' },
  ]);
};

const abrirOCadastroDaThays = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Cadastro de profissional de Thays Rocha' }));
  return screen.findByRole('dialog');
};

it('o admin liga na mão a conta ao cadastro feito com outro e-mail', async () => {
  contasComThays();
  render(<GerenciarUsuariosPage />);

  const janela = await abrirOCadastroDaThays();
  expect(within(janela).getByText(/sem cadastro ligado/)).toBeInTheDocument();
  fireEvent.change(within(janela).getByRole('searchbox', { name: 'Buscar profissional' }), { target: { value: 'fono' } });
  expect(within(janela).getAllByRole('radio')).toHaveLength(1);
  fireEvent.click(within(janela).getByRole('radio', { name: /Thays Rocha/ }));
  fireEvent.click(within(janela).getByRole('button', { name: 'Ligar' }));

  await waitFor(() =>
    expect(trocarCadastroDoProfissional).toHaveBeenCalledWith('thays', 'prof-thays', expect.objectContaining({ soltarCadastros: [], soltarContas: [] }))
  );
  expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Cadastro ligado' }));
  expect(ligarContaAoProfissional).not.toHaveBeenCalled(); // e-mails diferentes: a ligação automática não acha
});

it('avisa quando o cadastro escolhido já é de outra conta, e só liga com "Ligar mesmo assim"', async () => {
  contasComThays();
  render(<GerenciarUsuariosPage />);

  const janela = await abrirOCadastroDaThays();
  expect(within(janela).getByRole('radio', { name: /Rui Psicólogo/ })).toHaveAccessibleName(/Ligado a Rui Psicólogo/);
  fireEvent.click(within(janela).getByRole('radio', { name: /Rui Psicólogo/ }));

  expect(within(janela).getByRole('alert')).toHaveTextContent('já está ligado à conta de Rui Psicólogo');
  expect(within(janela).queryByRole('button', { name: 'Ligar' })).not.toBeInTheDocument();
  fireEvent.click(within(janela).getByRole('button', { name: 'Ligar mesmo assim' }));

  await waitFor(() =>
    expect(trocarCadastroDoProfissional).toHaveBeenCalledWith('thays', 'prof-rui', expect.objectContaining({ soltarContas: ['rui'] }))
  );
});

it('avisa quando a conta já usa outro cadastro', async () => {
  (getAllApprovedUsers as jest.Mock).mockResolvedValue([usuario('thays', 'Thays Rocha', 'profissional', { professionalId: 'prof-velho' })]);
  (getProfessionals as jest.Mock).mockResolvedValue([
    { id: 'prof-thays', fullName: 'Thays Rocha', especialidade: 'Fonoaudiologia', email: 'thays.rocha@outro.test', cpf: '' },
    { id: 'prof-velho', fullName: 'Thays R.', especialidade: '', email: '', cpf: '', userId: 'thays' },
  ]);
  render(<GerenciarUsuariosPage />);

  const janela = await abrirOCadastroDaThays();
  expect(within(janela).getByText('Thays R.', { selector: 'strong' })).toBeInTheDocument();
  fireEvent.click(within(janela).getByRole('radio', { name: /Thays Rocha/ }));

  expect(within(janela).getByRole('alert')).toHaveTextContent('Thays Rocha já usa o cadastro Thays R.');
  fireEvent.click(within(janela).getByRole('button', { name: 'Ligar mesmo assim' }));
  await waitFor(() =>
    expect(trocarCadastroDoProfissional).toHaveBeenCalledWith('thays', 'prof-thays', expect.objectContaining({ soltarCadastros: ['prof-velho'] }))
  );
});
