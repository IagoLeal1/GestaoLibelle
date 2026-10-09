// Tela de exemplo: a Central de Evoluções da coordenação (o período, os números que filtram, a busca e
// os filtros, a lista com o selo de situação, a leitura com Anterior/Próxima e os cartões dos terapeutas).
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aceso, Botao, Janela, Linha, Titulo } from "./base";

export const ALVOS_DA_CENTRAL = ["periodo", "numeros", "nao-bate", "filtros", "sessao", "proxima", "aviso", "mais", "terapeuta"];

const NUMEROS = [
  { n: 12, rotulo: "Escritas", cor: "bg-[#e3f4f4] text-[#0f6b6f]" },
  { n: 3, rotulo: "Pendentes", cor: "bg-[#fff3cf] text-[#7a5600]" },
  { n: 1, rotulo: "Não bate", cor: "bg-red-50 text-red-700", nome: "nao-bate" },
  { n: 0, rotulo: "Não aconteceram", cor: "bg-[#eceff1] text-[#37474f]" },
];

export function TelaCentral({ alvo }: { alvo?: string }) {
  const lendo = alvo === "sessao" || alvo === "proxima" || alvo === "aviso";
  return (
    <Janela>
      <div className="flex flex-wrap items-center gap-1.5">
        <Titulo>Evoluções</Titulo>
        <Aceso nome="periodo" alvo={alvo} className="ml-auto flex gap-0.5 rounded-full bg-[#e2e9ed] p-0.5 text-[9.5px]">
          {["Hoje", "Ontem", "7 dias", "14 dias"].map((p, i) => (
            <span key={p} className={cn("rounded-full px-1.5 py-0.5", i === 2 ? "bg-[#127a7e] font-bold text-white" : "text-[#52646d]")}>{p}</span>
          ))}
        </Aceso>
      </div>
      <Aceso nome="numeros" alvo={alvo} className="grid grid-cols-4 gap-1 rounded-lg">
        {NUMEROS.map((x) => {
          const quadro = <div className={cn("flex flex-col rounded-md p-1.5", x.cor)}><b className="text-[13px] leading-none">{x.n}</b><span className="text-[8.5px] font-semibold">{x.rotulo}</span></div>;
          return x.nome ? <Aceso key={x.rotulo} nome={x.nome} alvo={alvo} className="rounded-md">{quadro}</Aceso> : <div key={x.rotulo}>{quadro}</div>;
        })}
      </Aceso>
      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <div className="flex min-h-0 flex-col gap-1.5">
          <Aceso nome="filtros" alvo={alvo} className="flex h-6 items-center gap-1 rounded-md border border-[#cfd9de] bg-white px-1.5 text-[9.5px] text-[#52646d]">
            <Search aria-hidden className="h-3 w-3" /> Buscar criança · Terapeuta ▾
          </Aceso>
          <Aceso nome="sessao" alvo={alvo} className="rounded-lg">
            <Linha className="min-h-7 py-1"><span className="flex-1 truncate">09:00 Lucas</span><span className="rounded-full bg-red-50 px-1 text-[8.5px] font-bold text-red-700">Não bate</span></Linha>
          </Aceso>
          <Linha className="min-h-7 py-1"><span className="flex-1 truncate">10:00 Bia</span><span className="rounded-full bg-green-100 px-1 text-[8.5px] font-bold text-green-800">Escrita</span></Linha>
          <Aceso nome="mais" alvo={alvo} className="self-center rounded-md"><Botao variante="contorno">Mostrar mais</Botao></Aceso>
        </div>
        {lendo ? (
          <div className="flex min-h-0 flex-col gap-1.5 rounded-lg border border-[#dde5e9] bg-white p-2">
            <b className="text-[10.5px]">Lucas Souza · 09:00</b>
            <Aceso nome="aviso" alvo={alvo} className="rounded-md border border-amber-200 bg-amber-50 p-1.5 text-[9px] text-amber-900">A recepção marcou falta nesta sessão.</Aceso>
            <p className="text-[9.5px] leading-snug text-[#37474f]">Trabalhamos o fonema /r/ com espelho…</p>
            <Aceso nome="proxima" alvo={alvo} className="mt-auto flex justify-between rounded-md text-[9.5px] font-semibold text-[#127a7e]"><span>‹ Anterior</span><span>Próxima ›</span></Aceso>
          </div>
        ) : (
          <Aceso nome="terapeuta" alvo={alvo} className="flex flex-col gap-1 self-start rounded-lg border border-[#dde5e9] bg-white p-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1da7ac] text-[8px] text-white">PF</span>Paula · Fono</span>
            <span className="flex h-1.5 overflow-hidden rounded-full bg-[#eef3f6]"><span className="w-3/4 bg-[#1da7ac]" /><span className="w-1/4 bg-[#e68b00]" /></span>
            <span className="text-[9px] font-semibold text-[#7a5600]">2 pendentes</span>
          </Aceso>
        )}
      </div>
    </Janela>
  );
}
