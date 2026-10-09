// Tela de exemplo: a tela inicial com o cabeçalho (menu, Instalar app, sino e iniciais). O menu lateral
// abre quando o alvo é ele ("menu") ou um item dele ("menu:Prontuários"); o das iniciais, quando o alvo
// é Configurações ou Sair. Com o papel de quem lê, o menu mostra só os itens dele (lib/permissoes, como
// o menu de verdade) e a tela inicial é a daquele papel.
import { Bell, Download, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { podeAcessar } from "@/lib/permissoes";
import type { Visao } from "@/lib/ajuda";
import { Aceso, Botao, Caixa, Janela, Linha } from "./base";

// Os itens do menu do site, com o endereço de cada um (o mesmo de components/app-sidebar)
const MENU: [string, string][] = [
  ["Dashboard", "/"], ["Agendamentos", "/agendamentos"], ["Mapeamento de Salas", "/mapeamento-salas"], ["Pacientes", "/pacientes"],
  ["Prontuários", "/prontuario"], ["Evoluções", "/evolucoes"], ["Profissionais", "/profissionais"], ["Especialidades", "/especialidades"],
  ["Financeiro", "/financeiro"], ["Aprovação de Acesso", "/admin/usuarios"], ["Comercial", "/comercial"],
  ["Gerenciar Usuários", "/admin/gerenciar-usuarios"], ["Avisos", "/comunicacao"], ["Mensagens", "/mensagens"],
];
export const ITENS_DO_MENU = MENU.map(([item]) => item);

// O menu inteiro não cabe na tela de exemplo: mostra 8 itens do papel, com o aceso no meio
const VISIVEIS = 8;
function itensPerto(alvo?: string, papel?: Visao) {
  const doPapel = MENU.filter(([, url]) => !papel || papel === "tudo" || podeAcessar(url, papel)).map(([item]) => item);
  const i = doPapel.findIndex((item) => `menu:${item}` === alvo);
  const inicio = i < 0 ? 0 : Math.max(0, Math.min(i - 3, doPapel.length - VISIVEIS));
  return doPapel.slice(inicio, inicio + VISIVEIS);
}

// Quem aparece na tela de exemplo, conforme o papel de quem lê
const PESSOA: Record<"familia" | "gestao" | "terapeuta", { nome: string; iniciais: string }> = {
  familia: { nome: "Maria", iniciais: "MS" },
  gestao: { nome: "Ana", iniciais: "AA" },
  terapeuta: { nome: "Paula", iniciais: "PF" },
};
export const ALVOS_DO_INICIO = [
  "menu", ...ITENS_DO_MENU.map((i) => `menu:${i}`), "sino", "iniciais", "configuracoes", "sair", "instalar", "instalar-confirmar", "aviso-evolucao", "sessoes",
];

export function TelaInicio({ alvo, papel }: { alvo?: string; papel?: Visao }) {
  const menuAberto = alvo === "menu" || !!alvo?.startsWith("menu:");
  const contaAberta = alvo === "iniciais" || alvo === "configuracoes" || alvo === "sair";
  const quem = papel === "familiar" ? "familia" : papel && papel !== "profissional" ? "gestao" : "terapeuta";
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
          <Aceso nome="iniciais" alvo={alvo} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#37474f]">{PESSOA[quem].iniciais}</Aceso>
        </>
      }
    >
      <span className="text-[14px] font-bold">Olá, {PESSOA[quem].nome}</span>
      {quem === "terapeuta" ? (
        <>
          <Aceso nome="aviso-evolucao" alvo={alvo} className="flex items-center justify-between gap-2 rounded-lg border border-[#f3d27a] bg-[#fff8e1] px-2.5 py-2 text-[10.5px] text-[#6b4a00]">
            <span>1 evolução para escrever, da sessão de hoje</span>
            <b className="whitespace-nowrap">Escrever ›</b>
          </Aceso>
          <Aceso nome="sessoes" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wide text-[#52646d]">Minhas sessões de hoje</span>
            <Linha><span className="h-3 w-[3px] rounded bg-[#1da7ac]" />09:00 · Lucas Souza<span className="ml-auto text-[#52646d]">Fono</span></Linha>
            <Linha><span className="h-3 w-[3px] rounded bg-[#1da7ac]" />10:00 · Bia Lima<span className="ml-auto text-[#52646d]">Fono</span></Linha>
          </Aceso>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#52646d]">{quem === "familia" ? "Próximos Atendimentos" : "Agora e a seguir"}</span>
          <Linha><span className="h-3 w-[3px] rounded bg-[#1da7ac]" />{quem === "familia" ? "Seg, 13/10 · 09:00 · Fono" : "09:00 · Lucas Souza · Fono"}</Linha>
          <Linha><span className="h-3 w-[3px] rounded bg-[#b7133f]" />{quem === "familia" ? "Qua, 15/10 · 10:00 · Psico" : "10:00 · Theo Martins · Psico"}</Linha>
        </div>
      )}

      {menuAberto && (
        <div className="absolute inset-y-0 left-0 z-10 flex w-[58%] flex-col gap-0.5 border-r bg-white p-2 shadow-xl">
          <span className="px-2 pb-1 text-[12px] font-extrabold text-[#127a7e]">Casa Libelle</span>
          {itensPerto(alvo, papel).map((item) => (
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
      {alvo === "instalar-confirmar" && (
        <Caixa titulo="Instalar o Libelle?">
          <span className="text-[10px] text-[#52646d]">O app fica junto com os outros, com o ícone da libélula.</span>
          <div className="flex justify-end gap-1.5">
            <Botao variante="contorno">Cancelar</Botao>
            <Aceso nome="instalar-confirmar" alvo={alvo} className="rounded-md"><Botao>Instalar</Botao></Aceso>
          </div>
        </Caixa>
      )}
    </Janela>
  );
}
