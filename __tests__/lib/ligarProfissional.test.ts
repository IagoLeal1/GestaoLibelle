// __tests__/lib/ligarProfissional.test.ts
// Uma conta de profissional precisa estar ligada ao cadastro dela em Profissionais: é por ele que a
// agenda, as evoluções e as regras do banco sabem quais sessões são dela. A aprovação já ligava; trocar
// o papel para "profissional" não, e a terapeuta ficava sem as sessões.
import { ligacaoDoProfissional, trocaDeCadastro } from '@/lib/ligarProfissional';

const conta = { uid: 'karla', email: 'Karla.M@clinica.test', cpf: '123.456.789-00' };
const cadastro = (id: string, extra: Record<string, unknown> = {}) => ({ id, cpf: '', email: '', ...extra });

it('já ligada dos dois lados: nada a fazer', () => {
  expect(ligacaoDoProfissional({ ...conta, professionalId: 'prof-k' }, [cadastro('prof-k', { userId: 'karla' })])).toEqual({ tipo: 'ligada' });
});

it('acha o cadastro livre pelo CPF, mesmo escrito de outro jeito', () => {
  const cadastros = [cadastro('prof-x', { cpf: '999.999.999-99' }), cadastro('prof-k', { cpf: '12345678900' })];

  expect(ligacaoDoProfissional(conta, cadastros)).toEqual({ tipo: 'ligar', professionalId: 'prof-k', noPerfil: true, noCadastro: true });
});

it('sem CPF que bata, acha pelo e-mail, sem diferença de maiúsculas', () => {
  const cadastros = [cadastro('prof-k', { email: ' karla.m@clinica.test ' })];

  expect(ligacaoDoProfissional({ ...conta, cpf: null }, cadastros)).toMatchObject({ tipo: 'ligar', professionalId: 'prof-k' });
});

it('não pega o cadastro que já é de outra conta', () => {
  const cadastros = [cadastro('prof-k', { cpf: '123.456.789-00', email: 'karla.m@clinica.test', userId: 'outra-conta' })];

  expect(ligacaoDoProfissional(conta, cadastros)).toEqual({ tipo: 'sem_cadastro' });
});

it('com dois cadastros livres que batem, não escolhe sozinho', () => {
  const cadastros = [cadastro('prof-a', { email: 'karla.m@clinica.test' }), cadastro('prof-b', { email: 'karla.m@clinica.test' })];

  expect(ligacaoDoProfissional({ ...conta, cpf: null }, cadastros)).toEqual({ tipo: 'sem_cadastro' });
});

it('meio ligada: o cadastro já aponta para a conta, falta só o perfil', () => {
  expect(ligacaoDoProfissional(conta, [cadastro('prof-k', { userId: 'karla' })])).toEqual({
    tipo: 'ligar', professionalId: 'prof-k', noPerfil: true, noCadastro: false,
  });
});

it('meio ligada: o perfil já aponta para um cadastro livre, falta só o cadastro', () => {
  expect(ligacaoDoProfissional({ ...conta, cpf: null, email: '', professionalId: 'prof-k' }, [cadastro('prof-k')])).toEqual({
    tipo: 'ligar', professionalId: 'prof-k', noPerfil: false, noCadastro: true,
  });
});

it('sem cadastro que bata, avisa', () => {
  expect(ligacaoDoProfissional(conta, [cadastro('prof-x', { cpf: '999.999.999-99', email: 'x@clinica.test' })])).toEqual({ tipo: 'sem_cadastro' });
});

it('CPF e e-mail vazios nunca batem com cadastros vazios', () => {
  expect(ligacaoDoProfissional({ uid: 'karla', email: '', cpf: '' }, [cadastro('prof-x')])).toEqual({ tipo: 'sem_cadastro' });
});

// ——— Ligar na mão (botão em Gerenciar Usuários): para quando o cadastro foi feito com outro e-mail ———
const thays = { uid: 'thays', email: 'thays@gmail.test', cpf: null };
const cadastrosDaClinica = [
  { id: 'prof-thays', fullName: 'Thays Rocha', email: 'thays@clinica.test' },
  { id: 'prof-velho', fullName: 'Thays R.', email: '', userId: 'thays' },
  { id: 'prof-rui', fullName: 'Rui Psicólogo', email: '', userId: 'rui' },
];
const contasDaClinica = [
  { uid: 'thays', nome: 'Thays Rocha', professionalId: 'prof-velho' },
  { uid: 'rui', nome: 'Rui Psicólogo', professionalId: 'prof-rui' },
];

it('cadastro livre e conta sem ligação: liga sem avisos', () => {
  expect(trocaDeCadastro(thays, 'prof-thays', cadastrosDaClinica.slice(0, 1), [])).toEqual({ soltarCadastros: [], soltarContas: [] });
});

it('a conta já tinha outro cadastro: avisa e solta o antigo', () => {
  expect(trocaDeCadastro({ ...thays, professionalId: 'prof-velho' }, 'prof-thays', cadastrosDaClinica, contasDaClinica)).toEqual({
    cadastroAnterior: { id: 'prof-velho', nome: 'Thays R.' },
    soltarCadastros: ['prof-velho'],
    soltarContas: [],
  });
});

it('o cadastro escolhido é de outra conta: avisa quem perde e solta o perfil dela', () => {
  expect(trocaDeCadastro({ ...thays, professionalId: 'prof-velho' }, 'prof-rui', cadastrosDaClinica, contasDaClinica)).toEqual({
    outraConta: { uid: 'rui', nome: 'Rui Psicólogo' },
    cadastroAnterior: { id: 'prof-velho', nome: 'Thays R.' },
    soltarCadastros: ['prof-velho'],
    soltarContas: ['rui'],
  });
});

it('o cadastro é de uma conta que já não está na lista: avisa do mesmo jeito', () => {
  const cadastros = [{ id: 'prof-thays', fullName: 'Thays Rocha', userId: 'conta-apagada' }];

  expect(trocaDeCadastro(thays, 'prof-thays', cadastros, [])).toEqual({
    outraConta: { uid: 'conta-apagada', nome: 'uma conta que não está mais na lista' },
    soltarCadastros: [],
    soltarContas: [],
  });
});

it('ligação só pelo perfil também conta como cadastro anterior', () => {
  const cadastros = [{ id: 'prof-thays', fullName: 'Thays Rocha' }, { id: 'prof-velho', fullName: 'Thays R.' }];

  expect(trocaDeCadastro({ ...thays, professionalId: 'prof-velho' }, 'prof-thays', cadastros, [])).toEqual({
    cadastroAnterior: { id: 'prof-velho', nome: 'Thays R.' },
    soltarCadastros: [],
    soltarContas: [],
  });
});
