// Tela de exemplo: a tela inicial com o cabeçalho (menu, Instalar app, sino e iniciais). O menu lateral
// abre quando o alvo é ele ("menu") ou um item dele ("menu:Prontuários"); o das iniciais, quando o alvo
// é Configurações ou Sair.
import { Bell, Download, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aceso, Janela, Linha } from "./base";

export const ITENS_DO_MENU = ["Dashboard", "Agendamentos", "Pacientes", "Prontuários", "Evoluções", "Gerenciar Usuários", "Avisos", "Mensagens"];
export const ALVOS_DO_INICIO = ["menu", ...ITENS_DO_MENU.map((i) => `menu:${i}`), "sino", "iniciais", "configuracoes", "sair", "instalar", "aviso-evolucao", "sessoes"];

export function TelaInicio({ alvo }: { alvo?: string }) {
  const menuAberto = alvo === "menu" || !!alvo?.startsWith("menu:");
  const contaAberta = alvo === "iniciais" || alvo === "configuracoes" || alvo === "sair";
  return (
    <Janela
      cabecalho={
        <>
          <Aceso nome="menu" alvo={alvo} className="flex h-6 w-6 items-center justify-center rounded-md">
            <Menu aria-hidden className="h-4 w-4 text-[#37474f]" />
          </Aceso>
          <span className="ml-auto" />
          <Aceso nome="instalar" alvo={alvo} className="flex h-6 items-center gap-1 rounded-full border border-[#1da7ac] bg-white px-2 text-[9.5px] font-semibold text-[#127a7e]">
            <Download aria-hidden className="h-3 w-3" /> Instalar app
          </Aceso>
          <Aceso nome="sino" alvo={alvo} className="relative flex h-6 w-6 items-center justify-center rounded-md">
            <Bell aria-hidden className="h-4 w-4 text-[#37474f]" />
            <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </Aceso>
          <Aceso nome="iniciais" alvo={alvo} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#37474f]">PF</Aceso>
        </>
      }
    >
      <span className="text-[14px] font-bold">Olá, Paula</span>
      <Aceso nome="aviso-evolucao" alvo={alvo} className="flex items-center justify-between gap-2 rounded-lg border border-[#f3d27a] bg-[#fff8e1] px-2.5 py-2 text-[10.5px] text-[#6b4a00]">
        <span>1 evolução para escrever, da sessão de hoje</span>
        <b className="whitespace-nowrap">Escrever ›</b>
      </Aceso>
      <Aceso nome="sessoes" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg">
        <span className="text-[10px] font-bold uppercase tracking-wide text-[#52646d]">Minhas sessões de hoje</span>
        <Linha><span className="h-3 w-[3px] rounded bg-[#1da7ac]" />09:00 · Lucas Souza<span className="ml-auto text-[#52646d]">Fono</span></Linha>
        <Linha><span className="h-3 w-[3px] rounded bg-[#1da7ac]" />10:00 · Bia Lima<span className="ml-auto text-[#52646d]">Fono</span></Linha>
      </Aceso>

      {menuAberto && (
        <div className="absolute inset-y-0 left-0 z-10 flex w-[58%] flex-col gap-0.5 border-r bg-white p-2 shadow-xl">
          <span className="px-2 pb-1 text-[12px] font-extrabold text-[#127a7e]">Casa Libelle</span>
          {ITENS_DO_MENU.map((item) => (
            <Aceso key={item} nome={`menu:${item}`} alvo={alvo} className="rounded-md px-2 py-1 text-[10.5px] text-[#37474f]">
              {item}
            </Aceso>
          ))}
        </div>
      )}
      {contaAberta && (
        <div className="absolute right-2 top-1 z-10 flex w-32 flex-col gap-0.5 rounded-lg border bg-white p-1 text-[10.5px] shadow-lg">
          <Aceso nome="configuracoes" alvo={alvo} className="rounded-md px-2 py-1">Configurações</Aceso>
          <Aceso nome="sair" alvo={alvo} className={cn("rounded-md px-2 py-1 text-red-700")}>Sair</Aceso>
        </div>
      )}
    </Janela>
  );
}
