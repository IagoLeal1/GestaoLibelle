"use client"

// O Chrome oferece a instalação uma vez por visita, às vezes ainda no login, antes de o cabeçalho existir.
// A escuta começa quando o site carrega e guarda a oferta para o botão "Instalar app" (lib/instalarApp).
import { comecarAOuvir } from "@/lib/instalarApp";

comecarAOuvir();

export function OuvirInstalacao() {
  return null;
}
