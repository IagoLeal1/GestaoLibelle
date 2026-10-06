// __tests__/lib/instalarApp.test.ts
// O botão "Instalar app" do cabeçalho: quando aparece, o jeito de instalar em cada celular e o "não mostrar mais".
import {
  comecarAOuvir, conviteAtual, dispensarAviso, foiDispensado, jeitoDeInstalar, usarConvite,
} from '@/lib/instalarApp';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
// O iPad se apresenta como um Mac; o que denuncia é a tela de toque
const IPAD = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A145M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36';
const WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

const aparelho = (userAgent: string, outros: Partial<Parameters<typeof jeitoDeInstalar>[0]> = {}) => ({
  userAgent, maxTouchPoints: 0, abertoComoApp: false, temConvite: false, ...outros,
});

describe('jeitoDeInstalar', () => {
  it('aberto pelo ícone (já instalado): nada a oferecer', () => {
    expect(jeitoDeInstalar(aparelho(IPHONE, { abertoComoApp: true, maxTouchPoints: 5 }))).toBeNull();
    expect(jeitoDeInstalar(aparelho(ANDROID, { abertoComoApp: true, temConvite: true }))).toBeNull();
  });

  it('o navegador ofereceu a instalação: usa a janela do próprio celular', () => {
    expect(jeitoDeInstalar(aparelho(ANDROID, { temConvite: true }))).toBe('convite');
  });

  it('iPhone e iPad: o passo a passo, porque a Apple não deixa o site instalar sozinho', () => {
    expect(jeitoDeInstalar(aparelho(IPHONE, { maxTouchPoints: 5 }))).toBe('iphone');
    expect(jeitoDeInstalar(aparelho(IPAD, { maxTouchPoints: 5 }))).toBe('iphone');
  });

  it('Android sem a oferta do navegador: o passo a passo pelo menu', () => {
    expect(jeitoDeInstalar(aparelho(ANDROID, { maxTouchPoints: 5 }))).toBe('android');
  });

  it('computador: nada a oferecer', () => {
    expect(jeitoDeInstalar(aparelho(IPAD))).toBeNull(); // Mac de verdade, sem tela de toque
    expect(jeitoDeInstalar(aparelho(WINDOWS))).toBeNull();
  });
});

describe('não mostrar mais', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('o × fica lembrado neste aparelho', () => {
    expect(foiDispensado()).toBe(false);
    dispensarAviso();
    expect(foiDispensado()).toBe(true);
  });

  it('navegador que bloqueia o armazenamento: o aviso aparece e o × não quebra a tela', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado'); });
    expect(foiDispensado()).toBe(false);
    expect(() => dispensarAviso()).not.toThrow();
  });
});

describe('a oferta de instalação do navegador', () => {
  const oferta = (outcome: 'accepted' | 'dismissed' = 'accepted') => {
    const evento = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: jest.Mock; userChoice: Promise<{ outcome: string }>;
    };
    evento.prompt = jest.fn().mockResolvedValue(undefined);
    evento.userChoice = Promise.resolve({ outcome });
    return evento;
  };

  beforeAll(() => comecarAOuvir());
  beforeEach(() => localStorage.clear());

  it('guarda a oferta e segura a faixa automática do navegador', () => {
    const evento = oferta();
    window.dispatchEvent(evento);
    expect(conviteAtual()).toBe(evento);
    expect(evento.defaultPrevented).toBe(true);
  });

  it('usar a oferta abre a janela de instalar uma vez só', async () => {
    const evento = oferta('dismissed');
    window.dispatchEvent(evento);

    await expect(usarConvite()).resolves.toBe('dismissed');
    expect(evento.prompt).toHaveBeenCalledTimes(1);
    expect(conviteAtual()).toBeNull();
    await expect(usarConvite()).resolves.toBeNull();
  });

  it('instalou: a oferta some e o aviso não volta neste aparelho', () => {
    window.dispatchEvent(oferta());
    window.dispatchEvent(new Event('appinstalled'));
    expect(conviteAtual()).toBeNull();
    expect(foiDispensado()).toBe(true);
  });
});
