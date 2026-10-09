// Tela de exemplo: a tela inicial da família (Próximos Atendimentos e Acesso Rápido).
import { MessageCircle } from "lucide-react";
import { Aceso, Janela, Linha, Titulo } from "./base";

export const ALVOS_DO_PAINEL_DA_FAMILIA = ["proximos", "atendimento", "falar"];

export function TelaPainelDaFamilia({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Olá, Maria</Titulo>
      <Aceso nome="proximos" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg">
        <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Próximos Atendimentos</span>
        <Aceso nome="atendimento" alvo={alvo} className="rounded-lg">
          <Linha>
            <span className="flex flex-col"><b>Seg, 13/10 · 09:00</b><span className="text-[#52646d]">Lucas · Fonoaudiologia · Sala Azul</span></span>
          </Linha>
        </Aceso>
        <Linha>
          <span className="flex flex-col"><b>Qua, 15/10 · 10:00</b><span className="text-[#52646d]">Lucas · Psicologia</span></span>
        </Linha>
      </Aceso>
      <span className="mt-1 text-[10px] font-extrabold uppercase tracking-wide text-[#52646d]">Acesso Rápido</span>
      <div className="grid grid-cols-2 gap-1.5">
        <Aceso nome="falar" alvo={alvo} className="flex items-center gap-1.5 rounded-lg border border-[#dde5e9] bg-white p-2 text-[10.5px] font-semibold">
          <MessageCircle aria-hidden className="h-3.5 w-3.5 text-[#127a7e]" /> Falar com a equipe
        </Aceso>
        <span className="flex items-center rounded-lg border border-[#dde5e9] bg-white p-2 text-[10.5px] font-semibold">Avisos</span>
      </div>
    </Janela>
  );
}
