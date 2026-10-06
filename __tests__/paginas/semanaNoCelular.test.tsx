// __tests__/paginas/semanaNoCelular.test.tsx
// As grades no celular: os botões com os dias da semana e a lista do dia escolhido.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { SemanaNoCelular } from '@/components/agenda/semana-no-celular';

const SEMANA = Array.from({ length: 7 }, (_, i) => new Date(2026, 9, 5 + i));
const HORARIOS = ['07:20', '08:10', '09:00'];
const SESSOES: Record<number, { id: string; hora: string; titulo: string; detalhe: string }[]> = {
  5: [{ id: 'bia', hora: '08:10', titulo: 'Bia Lima', detalhe: 'Fonoaudiologia · Sala Azul' }],
  6: [{ id: 'lucas', hora: '09:00', titulo: 'Lucas Souza', detalhe: 'Fonoaudiologia · Sala Verde' }],
};
const itensDoDia = (dia: Date) => SESSOES[dia.getDate()] ?? [];

afterEach(() => jest.useRealTimers());

it('abre no dia de hoje e troca de dia pelos botões', () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 5, 10, 0) });
  render(<SemanaNoCelular dias={SEMANA} horarios={HORARIOS} itensDoDia={itensDoDia} />);

  expect(screen.getByText('Segunda, 05/10 · 1 sessão')).toBeInTheDocument();
  expect(screen.getByText('Bia Lima')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /ter.*06/ }));

  expect(screen.getByText('Terça, 06/10 · 1 sessão')).toBeInTheDocument();
  expect(screen.getByText('Lucas Souza')).toBeInTheDocument();
  expect(screen.queryByText('Bia Lima')).not.toBeInTheDocument();
});

it('os botões dos dias mostram o nome curto, que cabe no celular', () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 5, 10, 0) });
  render(<SemanaNoCelular dias={SEMANA} horarios={HORARIOS} itensDoDia={itensDoDia} />);

  const dias = screen.getAllByRole('button', { pressed: undefined }).filter((b) => b.closest('[aria-label="Dia da semana"]'));
  expect(dias.map((b) => b.textContent)).toEqual(['seg05', 'ter06', 'qua07', 'qui08', 'sex09', 'sáb10', 'dom11']);
});

it('dia sem sessões avisa', () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 7, 10, 0) });
  render(<SemanaNoCelular dias={SEMANA} horarios={HORARIOS} itensDoDia={itensDoDia} />);

  expect(screen.getByText('Nenhuma sessão neste dia.')).toBeInTheDocument();
});

it('quem agenda vê os horários livres e agenda por eles', () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 5, 10, 0) });
  const aoAgendar = jest.fn();
  render(<SemanaNoCelular dias={SEMANA} horarios={HORARIOS} itensDoDia={itensDoDia} aoAgendar={aoAgendar} />);

  const lista = screen.getByRole('list', { name: 'Horários do dia' });
  expect(within(lista).getAllByText('Livre')).toHaveLength(2);

  fireEvent.click(screen.getByRole('button', { name: 'Agendar às 07:20' }));

  expect(aoAgendar).toHaveBeenCalledWith(SEMANA[0], '07:20');
});

it('quem só consulta não vê horário livre nem botão de agendar', () => {
  jest.useFakeTimers({ now: new Date(2026, 9, 5, 10, 0) });
  render(<SemanaNoCelular dias={SEMANA} horarios={HORARIOS} itensDoDia={itensDoDia} />);

  expect(screen.queryByText('Livre')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Agendar/ })).not.toBeInTheDocument();
});
