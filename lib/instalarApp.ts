// lib/instalarApp.ts
// O botão "Instalar app" do cabeçalho (components/instalar-app.tsx): põe o site na tela do celular
// como aplicativo (app/manifest.ts).
// - Android: o Chrome oferece a instalação (evento beforeinstallprompt) e o botão abre a janela dele.
// - iPhone: a Apple não deixa o site instalar sozinho, e o botão mostra o passo a passo.
// Nada disso usa o banco: o "não mostrar mais" fica guardado só no próprio aparelho.

/** "convite": a janela de instalar do navegador; "iphone" e "android": o passo a passo. */
export type JeitoDeInstalar = "convite" | "iphone" | "android" | null;

export interface Aparelho {
  userAgent: string;
  maxTouchPoints: number;
  /** Aberto pelo ícone da tela de início: já está instalado. */
  abertoComoApp: boolean;
  /** O navegador ofereceu a instalação (beforeinstallprompt). */
  temConvite: boolean;
}

export function jeitoDeInstalar({ userAgent, maxTouchPoints, abertoComoApp, temConvite }: Aparelho): JeitoDeInstalar {
  if (abertoComoApp) return null;
  if (temConvite) return "convite";
  // O iPad se apresenta como um Mac: o que o separa do computador é a tela de toque
  if (/iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)) return "iphone";
  if (/Android/i.test(userAgent)) return "android";
  return null;
}

export function abertoComoApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// O × e a instalação ficam lembrados neste aparelho. Navegador que bloqueia o armazenamento: o aviso
// volta na próxima visita, e a tela não quebra.
const CHAVE = "libelle:instalar-app:dispensado";

export function foiDispensado(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

export function dispensarAviso() {
  try {
    localStorage.setItem(CHAVE, "1");
  } catch {
    // sem armazenamento: o aviso some só até recarregar
  }
}

// A oferta de instalação chega uma vez, às vezes antes de a tela montar: fica guardada aqui até o toque
type ConviteDeInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let convite: ConviteDeInstalar | null = null;
let ouvindo = false;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((ouvinte) => ouvinte());

export function comecarAOuvir() {
  if (typeof window === "undefined" || ouvindo) return;
  ouvindo = true;
  window.addEventListener("beforeinstallprompt", (evento) => {
    // Segura a faixa automática do Chrome: quem oferece é o botão do cabeçalho
    evento.preventDefault();
    convite = evento as ConviteDeInstalar;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    convite = null;
    dispensarAviso();
    avisar();
  });
}

export function assinarConvite(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export const conviteAtual = () => convite;

/** Abre a janela de instalar do navegador. Cada oferta só abre uma vez. */
export async function usarConvite(): Promise<"accepted" | "dismissed" | null> {
  const atual = convite;
  if (!atual) return null;
  convite = null;
  avisar();
  await atual.prompt();
  return (await atual.userChoice).outcome;
}
