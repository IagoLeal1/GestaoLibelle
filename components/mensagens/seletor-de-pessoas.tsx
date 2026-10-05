"use client"
// components/mensagens/seletor-de-pessoas.tsx
// Lista de pessoas separada por papel, com busca e caixas de seleção.
import { useState } from "react"
import { Search } from "lucide-react"
import { ChatMember } from "@/services/chatService"
import { agruparPorPapel } from "./papeis"

// Marca ou desmarca uma pessoa (devolve um conjunto novo, como o estado do React pede)
export const alternarPessoa = (selecionados: Set<string>, uid: string) => {
  const novo = new Set(selecionados)
  if (novo.has(uid)) novo.delete(uid)
  else novo.add(uid)
  return novo
}

interface Props {
  pessoas: ChatMember[]
  selecionados: Set<string>
  onAlternar: (uid: string) => void
  sugeridos?: Set<string>
}

export function SeletorDePessoas({ pessoas, selecionados, onAlternar, sugeridos }: Props) {
  const [busca, setBusca] = useState("")
  const visiveis = pessoas.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome"
          className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-base outline-none focus:border-[#1da7ac] md:text-sm"
        />
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-md border p-2">
        {agruparPorPapel(visiveis).map(secao => (
          <div key={secao.titulo}>
            <p className="px-1 pb-1 text-xs font-bold uppercase tracking-wide text-slate-500">{secao.titulo}</p>
            {secao.pessoas.map(pessoa => (
              <label key={pessoa.uid} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={selecionados.has(pessoa.uid)}
                  onChange={() => onAlternar(pessoa.uid)}
                  className="h-4 w-4 accent-[#1da7ac]"
                />
                <span className="text-sm text-slate-900">{pessoa.nome}</span>
                {sugeridos?.has(pessoa.uid) && (
                  <span className="rounded bg-[#1da7ac]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#1da7ac]">sugerido</span>
                )}
              </label>
            ))}
          </div>
        ))}
        {visiveis.length === 0 && <p className="p-3 text-center text-sm text-slate-500">Ninguém encontrado.</p>}
      </div>
    </div>
  )
}
