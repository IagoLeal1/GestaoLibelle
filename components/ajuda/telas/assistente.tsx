// Telas de exemplo do assistente de agendamento: o pedido da coordenação, as opções (livre e com
// troca), as janelas de "Vamos com essa" e de "Não", a lista "Para agendar" da recepção, o aviso de
// excluir e os "Recusados".
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aceso, Botao, Caixa, Campo, Janela, Linha, Titulo } from "./base";

function Abas({ ativa }: { ativa: "procurar" | "para-agendar" | "recusados" }) {
  const aba = (id: typeof ativa, texto: React.ReactNode) => (
    <span className={cn("flex items-center gap-1 px-1.5 pb-1 text-[10.5px] font-semibold text-[#52646d]", ativa === id && "border-b-2 border-[#127a7e] font-bold text-[#127a7e]")}>{texto}</span>
  );
  return (
    <div className="flex gap-1 border-b border-[#d5dfe4]">
      {aba("procurar", "Procurar encaixe")}
      {aba("para-agendar", <>Para agendar <span className="rounded-full bg-[#e68b00] px-1.5 text-[9px] font-bold text-white">2</span></>)}
      {aba("recusados", "Recusados")}
    </div>
  );
}

const Selo = ({ troca, children }: { troca?: boolean; children: React.ReactNode }) => (
  <span className={cn("rounded-full px-1.5 py-px text-[9px] font-bold", troca ? "bg-[#fff0d6] text-[#7a4600]" : "bg-[#e6f4ec] text-[#1f6b45]")}>{children}</span>
);

const Dia = ({ dia, children }: { dia: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-0.5 rounded-md bg-[#f3f6f8] px-1.5 py-1 text-[9.5px]"><b>{dia}</b>{children}</div>
);

export const ALVOS_DO_PEDIDO = ["crianca", "terapias", "dias", "emendar", "encontrar"];

export function TelaAssistentePedido({ alvo }: { alvo?: string }) {
  const terapia = (nome: string, vezes: string) => (
    <div className="flex items-center justify-between rounded-md bg-[#f3f6f8] px-2 py-1 text-[10px]"><span>{nome} ▾</span><b>{vezes}</b></div>
  );
  return (
    <Janela className="gap-1.5">
      <Abas ativa="procurar" />
      <Aceso nome="crianca" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="1. Criança" valor="Theo Martins ▾" /></Aceso>
      <Aceso nome="terapias" alvo={alvo} className="flex flex-col gap-1 rounded-lg p-0.5">
        <span className="text-[10px] font-semibold text-[#37474f]">2. Terapias</span>
        {terapia("Fonoaudiologia", "2x por semana")}
        {terapia("Terapia Ocupacional", "1x por semana")}
      </Aceso>
      <Aceso nome="dias" alvo={alvo} className="flex flex-col gap-1 rounded-lg p-0.5">
        <span className="text-[10px] font-semibold text-[#37474f]">3. Quando a família pode</span>
        <div className="flex items-center gap-1">
          {["Seg", "Ter", "Qua", "Qui", "Sex"].map((d) => (
            <span key={d} className={cn("rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold", d === "Ter" || d === "Qui" ? "border-[#127a7e] bg-[#e3f4f4] text-[#0d5c5f]" : "border-[#cfd9de] bg-white text-[#52646d]")}>{d}</span>
          ))}
          <span className="ml-auto text-[9.5px] text-[#52646d]">das 14:00 às 17:30</span>
        </div>
      </Aceso>
      <Aceso nome="emendar" alvo={alvo} className="flex items-center gap-1.5 rounded-lg p-1 text-[10px]">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-sm bg-[#127a7e] text-white"><Check aria-hidden className="h-2.5 w-2.5" strokeWidth={3} /></span>
        Emendar as terapias no mesmo dia
        <span className="ml-auto truncate text-[#52646d]">Preferência: Ana ▾</span>
      </Aceso>
      <Aceso nome="encontrar" alvo={alvo} className="mt-auto rounded-md"><Botao className="w-full justify-center">Encontrar encaixes</Botao></Aceso>
    </Janela>
  );
}

export const ALVOS_DAS_OPCOES = ["opcao-livre", "troca", "sim", "nao"];

export function TelaAssistenteOpcoes({ alvo }: { alvo?: string }) {
  return (
    <Janela className="gap-1.5">
      <span className="text-[12px] font-bold">2 encaixes para Theo</span>
      <Aceso nome="opcao-livre" alvo={alvo} className="flex flex-col gap-1 rounded-lg border border-[#dde5e9] bg-white p-1.5">
        <div className="flex items-center gap-1.5 text-[9.5px]"><b className="text-[#52646d]">Opção 1</b><Selo>Tudo livre</Selo><span className="ml-auto text-[#52646d]">livre nas 12 semanas</span></div>
        <div className="grid grid-cols-2 gap-1">
          <Dia dia="Terça"><span>14:10 · Fono com Carla</span><span>15:00 · TO com Júlia</span></Dia>
          <Dia dia="Quinta"><span>14:10 · Fono com Carla</span></Dia>
        </div>
      </Aceso>
      <div className="flex flex-col gap-1 rounded-lg border-2 border-[#f0b45c] bg-white p-1.5">
        <div className="flex items-center gap-1.5 text-[9.5px]"><b className="text-[#52646d]">Opção 2</b><Selo troca>Com 1 troca</Selo><span className="rounded-full bg-[#e3f4f4] px-1.5 text-[9px] font-bold text-[#0d5c5f]">com Ana</span></div>
        <Aceso nome="troca" alvo={alvo} className="flex flex-col gap-1 rounded-md border border-[#f3d9ad] bg-[#fffaf0] p-1.5 text-[9.5px]">
          <b className="text-[#5a3a00]">A troca: Lucas muda de horário na mesma terça</b>
          <div className="grid grid-cols-2 gap-1">
            <div className="flex flex-col gap-0.5"><span className="text-[8.5px] font-bold text-[#52646d]">HOJE</span><span className="rounded border border-[#e5d3b3] bg-white px-1">14:10 · Lucas</span><span className="rounded border border-dashed border-[#cfd9de] bg-white px-1 text-[#52646d]">15:00 · livre</span></div>
            <div className="flex flex-col gap-0.5"><span className="text-[8.5px] font-bold text-[#52646d]">COMO FICA</span><span className="rounded border border-[#a8d8d9] bg-[#e3f4f4] px-1"><b>14:10 · Theo</b></span><span className="rounded border border-[#f0b45c] bg-[#fff0d6] px-1"><b>15:00 · Lucas</b></span></div>
          </div>
          <span className="flex items-center gap-1"><Check aria-hidden className="h-3 w-3 text-[#2e8b57]" strokeWidth={3} />A sessão fica emendada com a TO das 15:50</span>
        </Aceso>
        <div className="flex gap-1.5">
          <Aceso nome="sim" alvo={alvo} className="rounded-md"><Botao>✓ Vamos com essa</Botao></Aceso>
          <Aceso nome="nao" alvo={alvo} className="rounded-md"><Botao variante="contorno">Não</Botao></Aceso>
        </div>
      </div>
    </Janela>
  );
}

export const ALVOS_DE_MANDAR = ["comeca", "recado", "mandar"];

export function TelaMandarParaRecepcao({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Assistente de Agendamento</Titulo>
      <Abas ativa="procurar" />
      <Caixa titulo="Mandar para a recepção">
        <span className="text-[9.5px] text-[#52646d]">Theo · Fono com Ana (terça 14:10, quinta 14:10) · mudar Lucas</span>
        <Aceso nome="comeca" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="Começa em" valor="13/10/2026" /></Aceso>
        <Aceso nome="recado" alvo={alvo} className="rounded-lg p-0.5"><Campo rotulo="Recado para a recepção (opcional)" valor="Avisar a família pelo WhatsApp" /></Aceso>
        <div className="flex justify-end gap-1.5">
          <Botao variante="contorno">Cancelar</Botao>
          <Aceso nome="mandar" alvo={alvo} className="rounded-md"><Botao>Mandar para a recepção</Botao></Aceso>
        </div>
      </Caixa>
    </Janela>
  );
}

export const ALVOS_DO_NAO = ["motivos", "salvar"];

export function TelaDizerNao({ alvo }: { alvo?: string }) {
  const motivo = (titulo: string, efeito: string, marcado = false) => (
    <div className={cn("flex items-start gap-1.5 rounded-md border p-1", marcado ? "border-[#127a7e] bg-[#f3fbfb]" : "border-[#dde5e9]")}>
      <span className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border", marcado ? "border-[3px] border-[#127a7e]" : "border-[#9fb3bc]")} />
      <span className="flex flex-col"><b className="text-[9.5px]">{titulo}</b><span className="text-[8.5px] text-[#52646d]">{efeito}</span></span>
    </div>
  );
  return (
    <Janela>
      <Titulo>Assistente de Agendamento</Titulo>
      <Caixa titulo="Por que não essa opção?">
        <Aceso nome="motivos" alvo={alvo} className="flex flex-col gap-1 rounded-lg p-0.5">
          {motivo("A família de Lucas não aceita mudar", "O assistente para de sugerir mexer em Lucas.", true)}
          {motivo("O horário é ruim para a família de Theo", "Esses horários saem das opções de Theo.")}
          {motivo("A terapeuta prefere não", "Essa troca não aparece de novo.")}
        </Aceso>
        <div className="flex justify-end gap-1.5">
          <Botao variante="contorno">Cancelar</Botao>
          <Aceso nome="salvar" alvo={alvo} className="rounded-md"><Botao>Salvar e ver a próxima</Botao></Aceso>
        </div>
      </Caixa>
    </Janela>
  );
}

export const ALVOS_DE_PARA_AGENDAR = ["item", "troca", "agenda", "agendar", "excluir"];

export function TelaParaAgendar({ alvo }: { alvo?: string }) {
  return (
    <Janela className="gap-1.5">
      <Titulo>Assistente de Agendamento</Titulo>
      <Abas ativa="para-agendar" />
      <div className="flex flex-col gap-1.5 rounded-lg border border-[#dde5e9] bg-white p-1.5 text-[9.5px]">
        <Aceso nome="item" alvo={alvo} className="flex flex-col gap-1 rounded-md p-0.5">
          <div className="flex items-center gap-1.5"><b className="text-[11px]">Theo Martins</b><Selo troca>Falta agendar</Selo><span className="ml-auto text-[#52646d]">Escolhido por Carla</span></div>
          <div className="flex gap-1"><span className="rounded bg-[#e3f4f4] px-1 text-[#0d5c5f]"><b>Começa:</b> terça, 13/10</span><span className="truncate rounded bg-[#f3f6f8] px-1"><b>Recado:</b> avisar pelo WhatsApp</span></div>
        </Aceso>
        <div className="flex flex-col gap-1 rounded-md bg-[#f3f6f8] p-1.5">
          <b>O que falta fazer</b>
          <Aceso nome="troca" alvo={alvo} className="rounded px-0.5">1. Confirmar com a família de <b>Lucas</b> a mudança de 14:10 para 15:00 na terça.</Aceso>
          <Aceso nome="agenda" alvo={alvo} className="rounded px-0.5">2. Mudar a sessão de Lucas na agenda. <span className="font-semibold text-[#127a7e] underline">Abrir a agenda de terça, 13/10</span></Aceso>
          <span className="px-0.5">3. Agendar Theo:</span>
          <Linha className="min-h-6 py-0.5 text-[9.5px]"><span><b>Fono</b> com Ana · toda terça 14:10</span><span className="ml-auto flex items-center gap-0.5 font-semibold text-[#1f6b45]"><Check aria-hidden className="h-3 w-3" />Agendada</span></Linha>
          <Linha className="min-h-6 py-0.5 text-[9.5px]"><span><b>Fono</b> com Ana · toda quinta 14:10</span><Aceso nome="agendar" alvo={alvo} className="ml-auto rounded-md"><Botao className="h-5 px-2">Agendar</Botao></Aceso></Linha>
        </div>
        <Aceso nome="excluir" alvo={alvo} className="self-end rounded-md px-1 font-semibold text-red-700">Excluir</Aceso>
      </div>
    </Janela>
  );
}

export const ALVOS_DE_EXCLUIR_ENCAIXE = ["aviso", "excluir"];

export function TelaExcluirEncaixe({ alvo }: { alvo?: string }) {
  return (
    <Janela>
      <Titulo>Assistente de Agendamento</Titulo>
      <Abas ativa="para-agendar" />
      <Caixa titulo="Excluir este encaixe?">
        <span className="text-[9.5px] text-[#52646d]">Theo · Fono com Ana (terça 14:10, quinta 14:10) · mudar Lucas</span>
        <Aceso nome="aviso" alvo={alvo} className="rounded-md border border-[#f0c987] bg-[#fff4e0] p-1.5 text-[9.5px] text-[#5a3a00]">
          O assistente pode <b>sugerir esse encaixe de novo</b> até a recepção agendar. Para ele parar de sugerir, use o botão <b>Não</b>.
        </Aceso>
        <div className="flex justify-end gap-1.5">
          <Botao variante="contorno">Cancelar</Botao>
          <Aceso nome="excluir" alvo={alvo} className="rounded-md"><Botao className="bg-[#b3261e]">Excluir</Botao></Aceso>
        </div>
      </Caixa>
    </Janela>
  );
}

export const ALVOS_DOS_RECUSADOS = ["desfazer"];

export function TelaRecusados({ alvo }: { alvo?: string }) {
  return (
    <Janela className="gap-1.5">
      <Titulo>Assistente de Agendamento</Titulo>
      <Abas ativa="recusados" />
      <div className="flex flex-col gap-1 rounded-lg border border-[#dde5e9] bg-white p-2 text-[9.5px]">
        <div className="flex items-center"><b className="text-[11px]">Theo Martins</b><span className="ml-auto text-[#52646d]">Recusado por Carla · hoje</span></div>
        <span className="text-[#52646d]">Fono com Ana (terça 14:10) · mudar Lucas</span>
        <span><b>Motivo:</b> A família de Lucas não aceita mudar</span>
        <Aceso nome="desfazer" alvo={alvo} className="self-start rounded-md"><Botao variante="contorno">Desfazer</Botao></Aceso>
      </div>
    </Janela>
  );
}
