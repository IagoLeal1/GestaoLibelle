// __tests__/paginas/telasDeExemplo.test.tsx
// As telas de exemplo da Ajuda: todo passo que mostra uma tela aponta para uma tela e um lugar que
// existem, e cada lugar acende sozinho (um por vez). A tela é só desenho: o leitor de tela pula.
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { GUIAS, temTelas } from '@/lib/ajuda';
import { TELAS, TelaDeExemplo } from '@/components/ajuda/telas';

const telasDosGuias = GUIAS.flatMap((g) => g.passos.flatMap((p, i) => (p.tela ? [{ guia: g.id, passo: i + 1, tela: p.tela }] : [])));

it('todo passo com tela aponta para uma tela e um lugar que existem', () => {
  const errados = telasDosGuias
    .filter(({ tela }) => !TELAS[tela.id] || (tela.alvo !== undefined && !TELAS[tela.id].alvos.includes(tela.alvo)))
    .map(({ guia, passo, tela }) => `${guia} (passo ${passo}): ${tela.id}/${tela.alvo}`);

  expect(errados).toEqual([]);
});

it('todos os guias mostram a tela de exemplo', () => {
  expect(GUIAS.filter((g) => !temTelas(g)).map((g) => g.id)).toEqual([]);
});

it('todas as telas de exemplo são usadas por algum guia', () => {
  const usadas = new Set(telasDosGuias.map((t) => t.tela.id));
  expect(Object.keys(TELAS).filter((id) => !usadas.has(id as keyof typeof TELAS))).toEqual([]);
});

describe.each(Object.entries(TELAS))('a tela %s', (id, { alvos }) => {
  it.each(alvos)('acende só o lugar "%s"', (alvo) => {
    const { container } = render(<TelaDeExemplo tela={{ id: id as keyof typeof TELAS, alvo }} />);

    const acesos = container.querySelectorAll('[data-alvo-aceso]');
    expect([...acesos].map((el) => el.getAttribute('data-alvo-aceso'))).toEqual([alvo]);
  });

  it('sem alvo, nada acende, e o leitor de tela pula o desenho', () => {
    const { container } = render(<TelaDeExemplo tela={{ id: id as keyof typeof TELAS }} />);

    expect(container.querySelectorAll('[data-alvo-aceso]')).toHaveLength(0);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});

it('o menu da tela de exemplo mostra só os itens do papel de quem lê, como o menu de verdade', () => {
  const { container, rerender } = render(<TelaDeExemplo tela={{ id: 'inicio', alvo: 'menu:Mensagens' }} papel="familiar" />);
  expect(container).not.toHaveTextContent('Financeiro');
  expect(container.querySelector('[data-alvo-aceso]')).toHaveTextContent('Mensagens');

  rerender(<TelaDeExemplo tela={{ id: 'inicio', alvo: 'menu:Financeiro' }} papel="tudo" />);
  expect(container.querySelector('[data-alvo-aceso]')).toHaveTextContent('Financeiro');
});

it('a tela inicial de exemplo é a do papel: a família vê os próximos atendimentos, não evolução', () => {
  const { container } = render(<TelaDeExemplo tela={{ id: 'inicio' }} papel="familiar" />);

  expect(container).toHaveTextContent('Próximos Atendimentos');
  expect(container).not.toHaveTextContent('evolução');
});
