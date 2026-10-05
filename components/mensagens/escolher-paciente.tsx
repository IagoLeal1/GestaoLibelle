"use client"
// components/mensagens/escolher-paciente.tsx
// Busca e escolha de um paciente ativo (para criar o grupo ou ligar um grupo antigo).
// Avisa quais crianças já têm grupo e entrega o id dele junto com a escolha.
import { useEffect, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { getPatients, Patient } from "@/services/patientService"
import { isLegacyGroup } from "@/services/chatService"
import { useConversas } from "@/hooks/use-conversas"
import { getIniciais } from "@/lib/formatters"

export function EscolherPaciente({ onEscolher }: { onEscolher: (paciente: Patient, grupoExistente?: string) => void }) {
  const [pacientes, setPacientes] = useState<Patient[] | null>(null)
  const [busca, setBusca] = useState("")
  // Só a coordenação escolhe paciente, e ela recebe todas as conversas
  const { grupos } = useConversas()
  const grupoDoPaciente = new Map(grupos.filter(g => !isLegacyGroup(g)).map(g => [g.pacienteId, g.id]))

  useEffect(() => {
    getPatients("ativo").then(setPacientes)
  }, [])

  const visiveis = (pacientes ?? []).filter(p => p.fullName.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          autoFocus
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome da criança"
          className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-base outline-none focus:border-[#1da7ac] md:text-sm"
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-md border">
        {pacientes === null ? (
          <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
        ) : visiveis.length === 0 ? (
          <p className="p-3 text-center text-sm text-slate-500">Nenhum paciente ativo encontrado.</p>
        ) : (
          visiveis.map(paciente => (
            <button
              key={paciente.id}
              type="button"
              onClick={() => onEscolher(paciente, grupoDoPaciente.get(paciente.id))}
              className="flex w-full items-center gap-3 border-b px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#16375b] text-xs font-semibold text-white">
                {getIniciais(paciente.fullName)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{paciente.fullName}</span>
              {grupoDoPaciente.has(paciente.id) && (
                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">Já tem grupo</span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
