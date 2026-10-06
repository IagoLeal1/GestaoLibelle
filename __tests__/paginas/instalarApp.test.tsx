// __tests__/paginas/instalarApp.test.tsx
// O botão "Instalar app" do cabeçalho, no celular: a janela do navegador no Android, o passo a passo no
// iPhone, o × que dispensa e o sumiço quando o site já abre pelo ícone.
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { BotaoInstalarApp } from '@/components/instalar-app';
import { comecarAOuvir } from '@/lib/instalarApp';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A145M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const USER_AGENT_ORIGINAL = navigator.userAgent;

function noAparelho(userAgent: string, { abertoComoApp = false } = {}) {
  Object.defineProperty(window.navigator, 'userAgent', { value: userAgent, configurable: true });
  window.matchMedia = jest.fn().mockReturnValue({ matches: abertoComoApp }) as unknown as typeof window.matchMedia;
}

function ofertaDoNavegador() {
  const evento = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
    prompt: jest.Mock; userChoice: Promise<{ outcome: string }>;
  };
  evento.prompt = jest.fn().mockResolvedValue(undefined);
  evento.userChoice = Promise.resolve({ outcome: 'dismissed' });
  act(() => {
    window.dispatchEvent(evento);
  });
  return evento;
}

beforeAll(() => comecarAOuvir());
beforeEach(() => localStorage.clear());
afterAll(() => {
  Object.defineProperty(window.navigator, 'userAgent', { value: USER_AGENT_ORIGINAL, configurable: true });
});

it('iPhone: o botão abre o passo a passo do Safari', () => {
  noAparelho(IPHONE);
  render(<BotaoInstalarApp />);

  fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));

  expect(screen.getByRole('dialog', { name: 'Instale o Libelle no iPhone' })).toBeInTheDocument();
  expect(screen.getByText('Adicionar à Tela de Início')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Entendi' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  // "Entendi" só fecha: quem ainda não instalou continua vendo o botão
  expect(screen.getByRole('button', { name: 'Instalar app' })).toBeInTheDocument();
});

it('Android com a oferta do navegador: o botão abre a janela de instalar do celular', async () => {
  noAparelho(ANDROID);
  render(<BotaoInstalarApp />);
  const evento = ofertaDoNavegador();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));
  });

  expect(evento.prompt).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('Android sem a oferta do navegador: o passo a passo pelo menu de três pontinhos', () => {
  noAparelho(ANDROID);
  render(<BotaoInstalarApp />);

  fireEvent.click(screen.getByRole('button', { name: 'Instalar app' }));

  expect(screen.getByRole('dialog', { name: 'Instale o Libelle no celular' })).toBeInTheDocument();
  expect(screen.getByText('três pontinhos')).toBeInTheDocument();
});

it('o × some com o botão e ele não volta neste aparelho', () => {
  noAparelho(IPHONE);
  const { unmount } = render(<BotaoInstalarApp />);

  fireEvent.click(screen.getByRole('button', { name: 'Não mostrar mais' }));
  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument();

  unmount();
  render(<BotaoInstalarApp />);
  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument();
});

it('aberto pelo ícone (já instalado): não aparece', () => {
  noAparelho(IPHONE, { abertoComoApp: true });
  render(<BotaoInstalarApp />);

  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument();
});

it('no computador: não aparece', () => {
  noAparelho(WINDOWS);
  render(<BotaoInstalarApp />);

  expect(screen.queryByRole('button', { name: 'Instalar app' })).not.toBeInTheDocument();
});
