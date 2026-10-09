// __tests__/paginas/ajuda.test.tsx
// A página de Ajuda: cada papel vê os guias dele, a busca acha pelo que a pessoa quer fazer, o admin
// vê a ajuda como cada papel e o guia aberto leva direto para a tela certa.
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useAuth } from '@/context/AuthContext';
import { PaginaDeAjuda } from '@/components/ajuda/pagina-de-ajuda';
import { GuiaAberto } from '@/components/ajuda/guia-aberto';
import { GUIAS } from '@/lib/ajuda';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));

const comoPapel = (role: string) =>
  (useAuth as jest.Mock).mockReturnValue({ firestoreUser: { uid: 'u1', displayName: 'Teste', profile: { role } } });

describe('a página de Ajuda', () => {
  it('o terapeuta vê os guias dele, começando pelas tarefas do dia a dia', () => {
    comoPapel('profissional');
    render(<PaginaDeAjuda />);

    expect(screen.getByRole('heading', { name: 'Olá, Teste! O que você quer fazer hoje?' })).toBeInTheDocument();
    expect(screen.getByText('terapeuta')).toBeInTheDocument();
    const comeco = screen.getByRole('region', { name: 'Comece por aqui' });
    expect(within(comeco).getByRole('link', { name: /Escrever a evolução de uma sessão/ })).toHaveAttribute('href', '/ajuda/escrever-evolucao');
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Ver a ajuda como')).not.toBeInTheDocument();
  });

  it('a busca acha pelo que a pessoa quer fazer, sem precisar de acento', () => {
    comoPapel('funcionario');
    render(<PaginaDeAjuda />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar nos guias' }), { target: { value: 'renovacao pacote' } });

    const resultados = screen.getByRole('region', { name: 'Resultados da busca' });
    expect(within(resultados).getByRole('link', { name: /Renovar os pacotes que estão acabando/ })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Comece por aqui' })).not.toBeInTheDocument();
  });

  it('busca sem resultado avisa e sugere falar com a equipe', () => {
    comoPapel('funcionario');
    render(<PaginaDeAjuda />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar nos guias' }), { target: { value: 'xyzw' } });

    expect(screen.getByText(/Nenhum guia encontrado/)).toBeInTheDocument();
  });

  it('as sugestões preenchem a busca', () => {
    comoPapel('profissional');
    render(<PaginaDeAjuda />);

    fireEvent.click(screen.getByRole('button', { name: 'escrever evolução' }));

    expect(screen.getByRole('searchbox', { name: 'Buscar nos guias' })).toHaveValue('escrever evolução');
    expect(within(screen.getByRole('region', { name: 'Resultados da busca' })).getAllByRole('link').length).toBeGreaterThan(0);
  });

  it('cada assunto abre a lista dos seus guias, e dá para voltar', () => {
    comoPapel('funcionario');
    render(<PaginaDeAjuda />);

    fireEvent.click(screen.getByRole('button', { name: /^Agenda/ }));

    const agenda = screen.getByRole('region', { name: 'Agenda' });
    expect(within(agenda).getByRole('link', { name: /Marcar uma sessão/ })).toHaveAttribute('href', '/ajuda/marcar-uma-sessao');
    fireEvent.click(screen.getByRole('button', { name: /Todos os assuntos/ }));
    expect(screen.getByRole('region', { name: 'Comece por aqui' })).toBeInTheDocument();
  });

  it('o admin vê tudo e pode ver a ajuda como cada papel', () => {
    comoPapel('admin');
    render(<PaginaDeAjuda />);

    expect(screen.getAllByText('Financeiro').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Escrever a evolução de uma sessão/ }).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText('Ver a ajuda como'), { target: { value: 'familiar' } });

    expect(screen.getByText('família')).toBeInTheDocument();
    expect(screen.queryByText('Financeiro')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Ver os próximos atendimentos/ }).length).toBeGreaterThan(0);
  });
});

describe('um guia aberto', () => {
  it('mostra os passos, a dica, o botão para a tela e o próximo guia', () => {
    comoPapel('profissional');
    render(<GuiaAberto id="escrever-evolucao" />);

    expect(screen.getByRole('heading', { name: 'Escrever a evolução de uma sessão' })).toBeInTheDocument();
    expect(within(screen.getByRole('list', { name: 'Passos' })).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText(/A criança faltou\?/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir para Evoluções' })).toHaveAttribute('href', '/evolucoes');
    expect(screen.getByRole('link', { name: /Próximo guia/ })).toHaveAttribute('href', '/ajuda/sessao-nao-aconteceu');
    expect(screen.getByRole('link', { name: /Voltar para a Ajuda/ })).toHaveAttribute('href', '/ajuda');
  });

  it('o nome do botão aparece em negrito', () => {
    comoPapel('profissional');
    render(<GuiaAberto id="escrever-evolucao" />);

    const passos = screen.getByRole('list', { name: 'Passos' });
    expect(within(passos).getAllByText('Salvar evolução').some((el) => el.tagName === 'STRONG')).toBe(true);
  });

  it('guia de outro papel não abre', () => {
    comoPapel('familiar');
    render(<GuiaAberto id="lancar-movimentacao" />);

    expect(screen.getByText('Este guia não é para o seu perfil.')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Passos' })).not.toBeInTheDocument();
  });

  it('endereço que não existe avisa', () => {
    comoPapel('profissional');
    render(<GuiaAberto id="nao-existe" />);

    expect(screen.getByText('Este guia não existe.')).toBeInTheDocument();
  });

  it('o admin abre qualquer guia', () => {
    comoPapel('admin');
    render(<GuiaAberto id="escrever-evolucao" />);

    expect(screen.getByRole('list', { name: 'Passos' })).toBeInTheDocument();
  });
});

describe('a tela de exemplo do guia', () => {
  const aceso = () => document.querySelector('[data-alvo-aceso]')?.getAttribute('data-alvo-aceso');

  it('começa no passo 1, com o lugar de tocar aceso, e anda com Próximo e Anterior', () => {
    comoPapel('profissional');
    render(<GuiaAberto id="escrever-evolucao" />);

    const andar = screen.getByRole('navigation', { name: 'Andar pelos passos' });
    expect(within(andar).getByText('Passo 1 de 4')).toBeInTheDocument();
    expect(aceso()).toBe('aviso-evolucao');

    fireEvent.click(screen.getByRole('button', { name: /Próximo passo/ }));
    expect(within(andar).getByText('Passo 2 de 4')).toBeInTheDocument();
    expect(aceso()).toBe('item');

    fireEvent.click(screen.getByRole('button', { name: /Anterior/ }));
    expect(aceso()).toBe('aviso-evolucao');
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeDisabled();
  });

  it('tocar num passo da lista mostra a tela dele; no último, o botão leva para a tela do site', () => {
    comoPapel('profissional');
    render(<GuiaAberto id="escrever-evolucao" />);

    const passos = within(screen.getByRole('list', { name: 'Passos' })).getAllByRole('button');
    fireEvent.click(passos[3]);

    expect(passos[3]).toHaveAttribute('aria-current', 'step');
    expect(aceso()).toBe('salvar');
    const andar = screen.getByRole('navigation', { name: 'Andar pelos passos' });
    expect(within(andar).getByRole('link', { name: /Ir para Evoluções/ })).toHaveAttribute('href', '/evolucoes');
  });

  it('um guia novo, ainda sem tela de exemplo, aparece com os passos e as miniaturas', () => {
    comoPapel('admin');
    GUIAS.push({
      id: 'guia-sem-tela', titulo: 'Guia sem tela', assunto: 'comecar', papeis: ['admin'], resumo: 'Para testar.',
      passos: [{ texto: 'Toque em **Salvar**.', mini: { tipo: 'botao', texto: 'Salvar' } }],
    });
    render(<GuiaAberto id="guia-sem-tela" />);
    GUIAS.pop();

    expect(screen.getByRole('list', { name: 'Passos' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Tela de exemplo' })).not.toBeInTheDocument();
  });
});
