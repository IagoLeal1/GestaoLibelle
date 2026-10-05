// __tests__/paginas/planoEvolutivo.test.tsx
// O plano evolutivo novo já vem com a data de elaboração preenchida. A data vinha em UTC: a partir
// das 21h de Brasília, aparecia a data de amanhã.
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import NovoPlanoEvolutivo from '@/app/(dashboard)/plano-evolutivo/novo/page';

// As caixas de seleção da tela medem o próprio tamanho, coisa que o navegador de teste não faz
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
afterEach(() => jest.useRealTimers());

it('à noite, a data de elaboração vem com o dia de hoje, não o de amanhã', () => {
  // 22h30 no relógio do aparelho (em Brasília, já é o dia seguinte em UTC)
  jest.useFakeTimers({ now: new Date(2026, 9, 1, 22, 30), advanceTimers: true });

  render(<NovoPlanoEvolutivo />);

  expect(screen.getByLabelText(/Data de Elaboração/)).toHaveValue('2026-10-01');
});
