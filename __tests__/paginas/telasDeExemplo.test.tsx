// __tests__/paginas/telasDeExemplo.test.tsx
// As telas de exemplo da Ajuda: todo passo que mostra uma tela aponta para uma tela e um lugar que
// existem, e cada lugar acende sozinho (um por vez). A tela é só desenho: o leitor de tela pula.
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { GUIAS } from '@/lib/ajuda';
import { TELAS, TelaDeExemplo } from '@/components/ajuda/telas';

const telasDosGuias = GUIAS.flatMap((g) => g.passos.flatMap((p, i) => (p.tela ? [{ guia: g.id, passo: i + 1, tela: p.tela }] : [])));

it('todo passo com tela aponta para uma tela e um lugar que existem', () => {
  const errados = telasDosGuias
    .filter(({ tela }) => !TELAS[tela.id] || (tela.alvo !== undefined && !TELAS[tela.id].alvos.includes(tela.alvo)))
    .map(({ guia, passo, tela }) => `${guia} (passo ${passo}): ${tela.id}/${tela.alvo}`);

  expect(errados).toEqual([]);
});

it('a etapa 1 já mostra a tela de exemplo em mais de 20 guias', () => {
  expect(new Set(telasDosGuias.map((t) => t.guia)).size).toBeGreaterThanOrEqual(20);
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
