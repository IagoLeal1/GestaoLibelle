// __tests__/paginas/diagnosticoNaFicha.test.tsx
// Pacientes › Detalhes › Diagnóstico, seguindo o desenho aprovado: um cartão por diagnóstico, a equipe
// (da agenda) com os dias, quem atualizou e, só para a gestão e a recepção, "Editar diagnóstico".
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { getSessoesDaEquipe, salvarDiagnostico } from '@/services/diagnosticoService';
import { AbaDoDiagnostico } from '@/components/diagnostico/aba-do-diagnostico';

jest.mock('@/services/diagnosticoService', () => ({ getSessoesDaEquipe: jest.fn(), salvarDiagnostico: jest.fn() }));

const THEO = {
  id: 'theo',
  fullName: 'Theo Martins',
  diagnosticos: [
    { nome: 'TEA · nível 1 de suporte', cid: 'F84.0', situacao: 'confirmado' as const },
    { nome: 'TDAH', situacao: 'investigacao' as const },
  ],
  diagnosticoAtualizadoEm: { toDate: () => new Date(2026, 9, 8, 10) },
  diagnosticoAtualizadoPor: 'Rafa Recepção',
};

beforeEach(() => {
  jest.clearAllMocks();
  (getSessoesDaEquipe as jest.Mock).mockResolvedValue([
    { tipo: 'Fonoaudiologia', professionalId: 'prof-paula', professionalName: 'Paula Fonoaudióloga', status: 'agendado', start: new Date(2026, 9, 6, 9) },
    { tipo: 'Fonoaudiologia', professionalId: 'prof-paula', professionalName: 'Paula Fonoaudióloga', status: 'agendado', start: new Date(2026, 9, 8, 9) },
    { tipo: 'Psicologia', professionalId: 'prof-rui', professionalName: 'Rui Psicólogo', status: 'agendado', start: new Date(2026, 9, 5, 9) },
  ]);
});

it('mostra os diagnósticos, a equipe com os dias e quem atualizou; o terapeuta não edita', async () => {
  render(<AbaDoDiagnostico paciente={THEO} podeEditar={false} autorNome="Rui" onSalvo={jest.fn()} />);

  const cartoes = within(screen.getByRole('list', { name: 'Diagnósticos' })).getAllByRole('listitem');
  expect(cartoes[0]).toHaveTextContent('TEA · nível 1 de suporte');
  expect(cartoes[0]).toHaveTextContent('Confirmado');
  expect(cartoes[0]).toHaveTextContent('CID F84.0');
  expect(cartoes[1]).toHaveTextContent('Em investigação');
  expect(cartoes[1]).toHaveTextContent('Sem CID');

  const equipe = await screen.findByRole('list', { name: 'Equipe' });
  expect(within(equipe).getAllByRole('listitem')[0]).toHaveTextContent('Fonoaudiologia · Paula Fonoaudiólogater e qui');
  expect(getSessoesDaEquipe).toHaveBeenCalledWith('theo');
  expect(screen.getByText('Atualizado em 08/10/2026 por Rafa Recepção')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Editar diagnóstico' })).not.toBeInTheDocument();
});

it('a gestão edita: muda, tira, adiciona e salva', async () => {
  const onSalvo = jest.fn();
  (salvarDiagnostico as jest.Mock).mockImplementation(async (_id, lista) => lista);
  render(<AbaDoDiagnostico paciente={THEO} podeEditar autorNome="Rafa Recepção" onSalvo={onSalvo} />);

  fireEvent.click(screen.getByRole('button', { name: 'Editar diagnóstico' }));
  const janela = await screen.findByRole('dialog', { name: 'Diagnóstico de Theo Martins' });
  // Confirma o TDAH e tira o TEA
  fireEvent.click(within(janela).getAllByRole('radio', { name: 'Confirmado' })[1]);
  fireEvent.click(within(janela).getByRole('button', { name: 'Tirar o diagnóstico 1' }));
  // Um novo, em investigação
  fireEvent.click(within(janela).getByRole('button', { name: 'Adicionar diagnóstico' }));
  const nomes = within(janela).getAllByRole('textbox', { name: 'Diagnóstico' });
  fireEvent.change(nomes[1], { target: { value: 'Atraso de fala' } });
  fireEvent.click(within(janela).getAllByRole('radio', { name: 'Em investigação' })[1]);
  fireEvent.click(within(janela).getByRole('button', { name: 'Salvar diagnóstico' }));

  await waitFor(() =>
    expect(salvarDiagnostico).toHaveBeenCalledWith('theo', [
      { nome: 'TDAH', cid: '', situacao: 'confirmado' },
      { nome: 'Atraso de fala', cid: '', situacao: 'investigacao' },
    ], 'Rafa Recepção')
  );
  expect(onSalvo).toHaveBeenCalledWith(expect.objectContaining({ diagnosticoAtualizadoPor: 'Rafa Recepção' }));
});

it('sem diagnóstico: avisa, e a gestão preenche pelo mesmo botão', async () => {
  render(<AbaDoDiagnostico paciente={{ id: 'bia', fullName: 'Bia Lima' }} podeEditar autorNome="Ana" onSalvo={jest.fn()} />);

  expect(screen.getByText('Nenhum diagnóstico preenchido ainda.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Preencher diagnóstico' }));
  const janela = await screen.findByRole('dialog', { name: 'Diagnóstico de Bia Lima' });
  expect(within(janela).getAllByRole('textbox', { name: 'Diagnóstico' })).toHaveLength(1);
});

it('não salva sem nenhum diagnóstico escrito', async () => {
  render(<AbaDoDiagnostico paciente={{ id: 'bia', fullName: 'Bia Lima' }} podeEditar autorNome="Ana" onSalvo={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: 'Preencher diagnóstico' }));
  const janela = await screen.findByRole('dialog', { name: 'Diagnóstico de Bia Lima' });
  fireEvent.click(within(janela).getByRole('button', { name: 'Salvar diagnóstico' }));

  expect(await within(janela).findByText('Escreva pelo menos um diagnóstico.')).toBeInTheDocument();
  expect(salvarDiagnostico).not.toHaveBeenCalled();
});
