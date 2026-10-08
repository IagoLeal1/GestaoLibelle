// O diagnóstico e a equipe na faixa colorida do topo do prontuário, seguindo o desenho aprovado:
// chips brancos para o diagnóstico confirmado (com o CID), tracejados para o "em investigação", e a
// equipe com a cor de cada terapia ("você" na terapia de quem está olhando).
import { corDaTerapia } from "@/lib/coresDasTerapias";
import type { Diagnostico, MembroDaEquipe } from "@/lib/diagnostico";

const TITULO = "text-[11px] font-extrabold uppercase tracking-[0.08em] text-white/85";
const primeiroNome = (nome: string) => nome.split(" ").filter(Boolean)[0] ?? nome;

export function FaixaDoDiagnostico({ diagnosticos, equipe }: { diagnosticos: Diagnostico[]; equipe: MembroDaEquipe[] | null }) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h3 className={TITULO}>Diagnóstico</h3>
        {diagnosticos.length === 0 ? (
          <p className="text-sm leading-snug text-white">Ainda não preenchido. A recepção ou a coordenação preenchem na ficha da criança.</p>
        ) : (
          <ul aria-label="Diagnóstico" className="flex flex-wrap gap-1.5">
            {diagnosticos.map((d, i) =>
              d.situacao === "investigacao" ? (
                <li key={`${d.nome}-${i}`} className="max-w-full rounded-full border-[1.5px] border-dashed border-white/85 px-2.5 py-1 text-[13px] font-bold [overflow-wrap:anywhere]">
                  {d.nome} · em investigação
                </li>
              ) : (
                <li key={`${d.nome}-${i}`} className="flex max-w-full items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[13px] font-bold text-[#1c2b33] [overflow-wrap:anywhere]">
                  {d.nome}
                  {d.cid && <span className="text-xs font-semibold text-[#52646d]">{d.cid}</span>}
                </li>
              )
            )}
          </ul>
        )}
      </div>

      {equipe && equipe.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <h3 className={TITULO}>Equipe</h3>
          <ul aria-label="Equipe" className="flex flex-wrap gap-1.5">
            {equipe.map((m) => (
              <li key={`${m.terapia}-${m.professionalId}`} title={m.profissional} className="flex max-w-full items-center gap-1.5 rounded-full bg-white/95 py-1 pl-2.5 pr-3 text-[13px] font-semibold text-[#1c2b33]">
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: corDaTerapia(m.terapia) }} />
                {m.terapia} · {m.voce ? "você" : primeiroNome(m.profissional)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
