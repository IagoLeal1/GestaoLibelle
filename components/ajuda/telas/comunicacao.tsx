// Telas de exemplo da comunicação: Avisos (os importantes com "Estou ciente", o Novo aviso e quem leu) e
// Mensagens (as conversas, a busca, escrever e enviar, e o Novo grupo).
import { Search, Send } from "lucide-react";
import { Aceso, Botao, Caixa, Campo, Chave, Janela, Linha, Titulo } from "./base";

export const ALVOS_DE_AVISOS = ["importantes", "ciente", "novo", "para-quem", "texto", "enviar", "leitura", "quem-leu"];

export function TelaAvisos({ alvo }: { alvo?: string }) {
  const escrevendo = alvo === "para-quem" || alvo === "texto" || alvo === "enviar";
  const gestao = escrevendo || alvo === "novo" || alvo === "leitura" || alvo === "quem-leu";
  return (
    <Janela>
      <div className="flex items-center">
        <Titulo>Avisos</Titulo>
        {gestao && <Aceso nome="novo" alvo={alvo} className="ml-auto rounded-md"><Botao>+ Novo aviso</Botao></Aceso>}
      </div>
      {gestao ? (
        <>
          <Aceso nome="leitura" alvo={alvo} className="rounded-lg">
            <Linha><span className="flex flex-1 flex-col"><b>Feriado de 12/10</b><span className="text-[#52646d]">Para: Famílias</span></span><span className="font-semibold text-[#127a7e]">Leitura 18/32</span></Linha>
          </Aceso>
          <Linha><span className="flex flex-1 flex-col"><b>Reunião de equipe</b><span className="text-[#52646d]">Para: Equipe</span></span><span className="font-semibold text-[#127a7e]">Leitura 9/12</span></Linha>
          {alvo === "quem-leu" && (
            <Aceso nome="quem-leu" alvo={alvo} className="grid grid-cols-2 gap-1.5 rounded-lg text-[9.5px]">
              <span className="rounded-md bg-[#e6f4ec] p-1.5 text-[#1f6b45]"><b>Já leram (18)</b><br />Maria, João…</span>
              <span className="rounded-md bg-[#fff3cf] p-1.5 text-[#6b4a00]"><b>Ainda não leram (14)</b><br />Renata, Carla…</span>
            </Aceso>
          )}
        </>
      ) : (
        <>
          <Aceso nome="importantes" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#9b3a1c]">Precisa da sua atenção</span>
            <div className="flex flex-col gap-1.5 rounded-lg border border-[#f3d27a] bg-[#fff8e1] p-2 text-[10.5px]">
              <b>Feriado de 12/10: a clínica não abre</b>
              <Aceso nome="ciente" alvo={alvo} className="self-end rounded-md"><Botao>Estou ciente</Botao></Aceso>
            </div>
          </Aceso>
          <Linha><span className="flex-1">Reunião de pais no sábado</span><span className="text-[#52646d]">ontem</span></Linha>
        </>
      )}
      {escrevendo && (
        <Caixa titulo="Novo aviso">
          <Aceso nome="para-quem" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="Para quem" valor="Famílias ▾" /></Aceso>
          <Aceso nome="texto" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg p-0.5">
            <Campo rotulo="Título" valor="Feriado de 12/10" />
            <span className="h-8 rounded-md border border-[#cfd9de] p-1.5 text-[10px] text-[#52646d]">A clínica não abre na segunda…</span>
          </Aceso>
          <Aceso nome="enviar" alvo={alvo} className="flex items-center justify-between gap-2 rounded-md">
            <span className="flex items-center gap-1.5 text-[10px]"><Chave ligada /> Importante</span>
            <Botao>Enviar para 32 pessoas</Botao>
          </Aceso>
        </Caixa>
      )}
    </Janela>
  );
}

export const ALVOS_DE_MENSAGENS = ["lista", "busca", "conversa", "escrever", "enviar", "novo-grupo", "crianca", "criar"];

export function TelaMensagens({ alvo }: { alvo?: string }) {
  const grupo = alvo === "crianca" || alvo === "criar";
  return (
    <Janela>
      <div className="flex items-center">
        <Titulo>Mensagens</Titulo>
        <Aceso nome="novo-grupo" alvo={alvo} className="ml-auto rounded-md"><Botao>+ Novo grupo</Botao></Aceso>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-1.5">
        <Aceso nome="lista" alvo={alvo} className="flex flex-col gap-1.5 rounded-lg">
          <Aceso nome="busca" alvo={alvo} className="flex h-6 items-center gap-1 rounded-md border border-[#cfd9de] bg-white px-1.5 text-[9px] text-[#52646d]">
            <Search aria-hidden className="h-3 w-3" /> Buscar pelo nome da criança
          </Aceso>
          <Aceso nome="conversa" alvo={alvo} className="rounded-lg">
            <Linha className="min-h-7 py-1"><b className="flex-1 truncate">Maria Souza</b><span className="rounded-full bg-[#127a7e] px-1.5 text-[8.5px] font-bold text-white">2</span></Linha>
          </Aceso>
          <Linha className="min-h-7 py-1"><span className="flex-1 truncate">João Lima</span></Linha>
        </Aceso>
        <div className="flex min-h-0 flex-col gap-1 rounded-lg border border-[#dde5e9] bg-white p-1.5">
          <span className="self-start rounded-lg bg-[#f3f6f8] px-2 py-1 text-[9.5px]">O Lucas vai amanhã?</span>
          <span className="self-end rounded-lg bg-[#e3f4f4] px-2 py-1 text-[9.5px]">Vai sim, às 9h.</span>
          <div className="mt-auto flex items-center gap-1">
            <Aceso nome="escrever" alvo={alvo} className="flex h-6 flex-1 items-center rounded-full border border-[#cfd9de] px-2 text-[9px] text-[#8a9aa3]">Escreva uma mensagem</Aceso>
            <Aceso nome="enviar" alvo={alvo} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#127a7e] text-white"><Send aria-hidden className="h-3 w-3" /></Aceso>
          </div>
        </div>
      </div>
      {grupo && (
        <Caixa titulo="Novo grupo">
          <Aceso nome="crianca" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="Criança" valor="Theo Martins ▾" /></Aceso>
          <span className="text-[10px] text-[#52646d]">Renata Martins (família) · Rui (Psicologia) · Coordenação</span>
          <Aceso nome="criar" alvo={alvo} className="self-end rounded-md"><Botao>Criar grupo</Botao></Aceso>
        </Caixa>
      )}
    </Janela>
  );
}
