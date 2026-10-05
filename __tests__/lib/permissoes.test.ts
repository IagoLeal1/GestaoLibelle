// __tests__/lib/permissoes.test.ts
// Quem abre qual tela: a mesma lista de papéis do menu vale para o endereço digitado.
import { ehGestao, podeAcessar } from '@/lib/permissoes';

describe('telas por papel', () => {
  it('só o admin abre o Financeiro, mesmo digitando o endereço', () => {
    expect(podeAcessar('/financeiro', 'admin')).toBe(true);
    expect(podeAcessar('/financeiro', 'familiar')).toBe(false);
    expect(podeAcessar('/financeiro', 'funcionario')).toBe(false);
    expect(podeAcessar('/financeiro', 'coordenador')).toBe(false);
  });

  it('a família não abre as telas da clínica', () => {
    expect(podeAcessar('/pacientes', 'familiar')).toBe(false);
    expect(podeAcessar('/agendamentos', 'familiar')).toBe(false);
    expect(podeAcessar('/admin/gerenciar-usuarios', 'familiar')).toBe(false);
  });

  it('vale também para as telas de dentro de cada seção', () => {
    expect(podeAcessar('/pacientes/editar/abc', 'funcionario')).toBe(true);
    expect(podeAcessar('/pacientes/editar/abc', 'familiar')).toBe(false);
  });

  it('o terapeuta consulta a agenda e os pacientes, mas não cadastra nem edita', () => {
    expect(podeAcessar('/agendamentos', 'profissional')).toBe(true);
    expect(podeAcessar('/pacientes', 'profissional')).toBe(true);
    expect(podeAcessar('/pacientes/novo', 'profissional')).toBe(false);
    expect(podeAcessar('/pacientes/editar/abc', 'profissional')).toBe(false);
    expect(podeAcessar('/profissionais', 'profissional')).toBe(false);
  });

  it('o assistente de agendamento é só da gestão', () => {
    expect(podeAcessar('/agendamentos/assistente', 'funcionario')).toBe(true);
    expect(podeAcessar('/agendamentos/assistente', 'profissional')).toBe(false);
  });

  it('montar a agenda é só da gestão', () => {
    for (const tela of ['/agendamentos/novo', '/agendamentos/renovacoes']) {
      expect(podeAcessar(tela, 'profissional')).toBe(false);
      expect(podeAcessar(tela, 'funcionario')).toBe(true);
    }
  });

  it('o terapeuta vê as grades da semana para se organizar', () => {
    for (const tela of ['/agendamentos/grade', '/agendamentos/terapia', '/agendamentos/terapeuta']) {
      expect(podeAcessar(tela, 'profissional')).toBe(true);
      expect(podeAcessar(tela, 'funcionario')).toBe(true);
      expect(podeAcessar(tela, 'familiar')).toBe(false);
    }
  });

  it('todos abrem o início, a comunicação, as mensagens e a própria conta', () => {
    for (const papel of ['admin', 'coordenador', 'funcionario', 'profissional', 'familiar']) {
      expect(podeAcessar('/', papel)).toBe(true);
      expect(podeAcessar('/comunicacao', papel)).toBe(true);
      expect(podeAcessar('/mensagens/grupo-1', papel)).toBe(true);
      expect(podeAcessar('/minha-conta', papel)).toBe(true);
    }
  });

  it('telas fora do menu continuam como estão', () => {
    expect(podeAcessar('/tarefas', 'familiar')).toBe(true);
  });

  it('gestão é admin, coordenação e recepção', () => {
    expect(['admin', 'coordenador', 'funcionario', 'profissional', 'familiar'].filter(ehGestao))
      .toEqual(['admin', 'coordenador', 'funcionario']);
  });
});
