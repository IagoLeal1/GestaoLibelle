"use client"

// "Procurar encaixe": a coordenação diz a criança, as terapias e quando a família pode, e vê as opções
// (livres ou com uma troca segura). "Vamos com essa" manda para a recepção; "Não" guarda o motivo.
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebaseConfig";
import { cn } from "@/lib/utils";
import { bloqueiosDoNao, filtrarPorBloqueios, OpcaoDeEncaixe, OPCOES_EM_DESTAQUE } from "@/lib/encaixes";
import { ORDEM_DOS_DIAS, SEMANAS_ANALISADAS } from "@/lib/horariosRecorrentes";
import { getPatients, Patient } from "@/services/patientService";
import { getProfessionals, Professional } from "@/services/professionalService";
import { getSpecialties, Specialty } from "@/services/specialtyService";
import { dizerNao, mandarParaRecepcao } from "@/services/encaixeService";
import { DIA_CURTO, primeiroNome } from "./comum";
import { DizerNao, MandarParaRecepcao } from "./janelas";
import { OpcaoDeEncaixeCartao } from "./opcao-de-encaixe";

const CONVENIOS = ["unimed", "bradesco", "amil", "sulamerica"];

/** As terapias que valem para a criança: as dos convênios dela e, se for particular, as sem convênio no nome. */
export function terapiasDaCrianca(especialidades: Specialty[], convenio?: string) {
  const convenios = (convenio || "particular").split(",").map((c) => c.trim().toLowerCase()).filter(Boolean);
  const particular = convenios.length === 0 || convenios.includes("particular");
  return especialidades.filter((s) => {
    const nome = s.name.toLowerCase();
    const doConvenio = CONVENIOS.find((c) => nome.includes(c));
    return doConvenio ? convenios.some((c) => c !== "particular" && nome.includes(c)) : particular;
  });
}

interface Necessidade { terapia: string; frequencia: number; }

function Cartao({ titulo, detalhe, children }: { titulo: string; detalhe?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border bg-card p-4 sm:p-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-bold">{titulo}</h2>
        {detalhe && <span className="text-xs text-muted-foreground">{detalhe}</span>}
      </div>
      {children}
    </div>
  );
}

export function ProcurarEncaixe({ onMandou }: { onMandou: () => void }) {
  const { firestoreUser } = useAuth();
  const [criancas, setCriancas] = useState<Patient[]>([]);
  const [especialidades, setEspecialidades] = useState<Specialty[]>([]);
  const [profissionais, setProfissionais] = useState<Professional[]>([]);

  const [pacienteId, setPacienteId] = useState("");
  const [necessidades, setNecessidades] = useState<Necessidade[]>([{ terapia: "", frequencia: 1 }]);
  const [dias, setDias] = useState<string[]>([]);
  const [desde, setDesde] = useState("");
  const [ate, setAte] = useState("");
  const [emendar, setEmendar] = useState(true);
  const [preferidos, setPreferidos] = useState<string[]>([]);

  const [buscando, setBuscando] = useState(false);
  const [opcoes, setOpcoes] = useState<OpcaoDeEncaixe[] | null>(null);
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [mandadas, setMandadas] = useState<string[]>([]);
  const [paraMandar, setParaMandar] = useState<OpcaoDeEncaixe | null>(null);
  const [paraRecusar, setParaRecusar] = useState<OpcaoDeEncaixe | null>(null);

  useEffect(() => {
    Promise.all([getPatients("ativo"), getSpecialties(), getProfessionals("ativo")]).then(([p, e, pr]) => {
      setCriancas(p);
      setEspecialidades(e);
      setProfissionais(pr);
    });
  }, []);

  const crianca = criancas.find((c) => c.id === pacienteId);
  const terapias = useMemo(() => (crianca ? terapiasDaCrianca(especialidades, crianca.convenio) : []), [crianca, especialidades]);
  const autor = { uid: firestoreUser?.uid ?? "", nome: firestoreUser?.displayName ?? "" };
  const nome = crianca?.fullName ?? "";

  const escolherCrianca = (id: string) => {
    setPacienteId(id);
    setNecessidades([{ terapia: "", frequencia: 1 }]);
    setOpcoes(null);
  };
  const mudarNecessidade = (i: number, mudanca: Partial<Necessidade>) =>
    setNecessidades((atual) => atual.map((n, j) => (j === i ? { ...n, ...mudanca } : n)));
  const alternarDia = (dia: string) => setDias((atual) => (atual.includes(dia) ? atual.filter((d) => d !== dia) : [...atual, dia]));

  const buscar = async () => {
    if (!pacienteId || necessidades.some((n) => !n.terapia)) {
      toast.error("Escolha a criança e as terapias.");
      return;
    }
    setBuscando(true);
    setOpcoes(null);
    setMostrarTodas(false);
    setMandadas([]);
    try {
      // O servidor só atende quem manda o login (e confere o papel no cadastro)
      const login = await auth.currentUser?.getIdToken();
      const resposta = await fetch("/api/schedule-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${login ?? ""}` },
        body: JSON.stringify({ pacienteId, necessidades, familia: { dias, desde, ate }, emendar, preferidos }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.error || "Não foi possível buscar os horários.");
      setOpcoes(dados.opcoes);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível buscar os horários.");
    } finally {
      setBuscando(false);
    }
  };

  const mandar = async ({ comecaEm, recado }: { comecaEm: string; recado: string }) => {
    if (!paraMandar || !crianca) return;
    try {
      await mandarParaRecepcao({ paciente: { id: crianca.id, nome: crianca.fullName }, opcao: paraMandar, comecaEm, recado, autor });
      setMandadas((atual) => [...atual, paraMandar.chave]);
      setParaMandar(null);
      toast.success("Mandado para a recepção. Ela vê em Para agendar.");
      onMandou();
    } catch {
      toast.error("Não foi possível mandar agora. Tente de novo.");
    }
  };

  const recusar = async ({ motivo, texto }: { motivo: Parameters<typeof dizerNao>[0]["motivo"]; texto: string }) => {
    if (!paraRecusar || !crianca) return;
    try {
      await dizerNao({ paciente: { id: crianca.id, nome: crianca.fullName }, opcao: paraRecusar, motivo, texto, autor });
      const bloqueios = bloqueiosDoNao(motivo, paraRecusar, crianca.id);
      setOpcoes((atual) => (atual ? filtrarPorBloqueios(atual, bloqueios, crianca.id) : atual));
      setParaRecusar(null);
      toast.success("Guardado em Recusados.");
    } catch {
      toast.error("Não foi possível salvar agora. Tente de novo.");
    }
  };

  const visiveis = opcoes ? (mostrarTodas ? opcoes : opcoes.slice(0, OPCOES_EM_DESTAQUE)) : [];

  return (
    <div className="flex flex-wrap items-start gap-5">
      <section aria-label="O pedido" className="flex min-w-0 flex-[1_1_340px] flex-col gap-3.5">
        <Cartao titulo="1. Criança">
          <Label htmlFor="crianca" className="text-[13px] font-normal text-muted-foreground">Quem precisa de horário</Label>
          <Select value={pacienteId} onValueChange={escolherCrianca}>
            <SelectTrigger id="crianca" className="h-11"><SelectValue placeholder="Escolha a criança" /></SelectTrigger>
            <SelectContent>{criancas.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}</SelectContent>
          </Select>
        </Cartao>

        <Cartao titulo="2. Terapias" detalhe="definidas pela coordenação">
          {necessidades.map((n, i) => (
            <div key={i} className="flex items-end gap-2 rounded-xl bg-[#f3f6f8] p-2.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label htmlFor={`terapia-${i}`} className="text-[13px] font-normal text-muted-foreground">Terapia</Label>
                <Select value={n.terapia} onValueChange={(terapia) => mudarNecessidade(i, { terapia })} disabled={!crianca}>
                  <SelectTrigger id={`terapia-${i}`} className="h-11 bg-white">
                    <SelectValue placeholder={crianca ? "Escolha..." : "Escolha a criança antes"} />
                  </SelectTrigger>
                  <SelectContent>{terapias.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex w-24 flex-col gap-1">
                <Label htmlFor={`vezes-${i}`} className="text-[13px] font-normal text-muted-foreground">Por semana</Label>
                <Input
                  id={`vezes-${i}`}
                  type="number"
                  min={1}
                  max={5}
                  className="h-11 bg-white text-center"
                  value={n.frequencia}
                  onChange={(e) => mudarNecessidade(i, { frequencia: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                aria-label={`Tirar ${n.terapia || "esta terapia"}`}
                disabled={necessidades.length === 1}
                onClick={() => setNecessidades((atual) => atual.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            className="h-10 border-dashed text-[#127a7e]"
            onClick={() => setNecessidades((atual) => [...atual, { terapia: "", frequencia: 1 }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Adicionar terapia
          </Button>
        </Cartao>

        <Cartao titulo="3. Quando a família pode">
          <div role="group" aria-label="Dias da semana" className="flex flex-wrap gap-1.5">
            {ORDEM_DOS_DIAS.map((dia) => (
              <button
                key={dia}
                type="button"
                aria-pressed={dias.includes(dia)}
                onClick={() => alternarDia(dia)}
                className={cn(
                  "h-11 min-w-[52px] rounded-lg border px-2 text-sm font-semibold text-[#52646d]",
                  dias.includes(dia) && "border-2 border-[#127a7e] bg-[#e3f4f4] font-bold text-[#0d5c5f]"
                )}
              >
                {DIA_CURTO[dia]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Sem nenhum dia marcado, vale qualquer dia.</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <Label htmlFor="desde" className="text-[13px] font-normal text-muted-foreground">A partir de</Label>
              <Input id="desde" type="time" className="h-11" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="ate" className="text-[13px] font-normal text-muted-foreground">Até</Label>
              <Input id="ate" type="time" className="h-11" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </div>
          <label className="flex items-start gap-2.5 text-[15px] leading-snug">
            <input type="checkbox" checked={emendar} onChange={(e) => setEmendar(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[#127a7e]" />
            <span>Emendar as terapias no mesmo dia <span className="text-muted-foreground">(a família vem uma vez só)</span></span>
          </label>
          <div className="flex flex-col gap-1">
            <Label htmlFor="preferidas" className="text-[13px] font-normal text-muted-foreground">Terapeutas de preferência (opcional)</Label>
            <MultiSelectFilter
              id="preferidas"
              options={profissionais.map((p) => ({ value: p.id, label: p.fullName }))}
              selectedValues={preferidos}
              onSelectionChange={setPreferidos}
              placeholder="Qualquer terapeuta"
            />
          </div>
        </Cartao>

        <Button className="h-[52px] bg-[#127a7e] text-base font-bold hover:bg-[#0d5c5f]" disabled={buscando} onClick={buscar}>
          {buscando ? "Procurando..." : "Encontrar encaixes"}
        </Button>
      </section>

      <section aria-label="Encaixes encontrados" aria-live="polite" className="flex min-w-0 flex-[999_1_520px] flex-col gap-3.5">
        {opcoes === null && !buscando && (
          <p className="rounded-2xl border border-dashed bg-card p-5 text-[15px] text-muted-foreground">
            Preencha o pedido e toque em <strong>Encontrar encaixes</strong>. O assistente olha as próximas {SEMANAS_ANALISADAS} semanas da agenda: horários livres e, quando não houver, trocas seguras com outra criança.
          </p>
        )}
        {buscando && <p className="rounded-2xl border bg-card p-5 text-[15px] text-muted-foreground">Olhando a agenda das próximas {SEMANAS_ANALISADAS} semanas...</p>}
        {opcoes && opcoes.length === 0 && (
          <p className="rounded-2xl border border-dashed bg-card p-5 text-[15px] text-muted-foreground">
            Nenhum encaixe com esse pedido. Tente mais dias ou horários da família, ou confira se as terapeutas têm dias e horários de atendimento no cadastro.
          </p>
        )}
        {opcoes && opcoes.length > 0 && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2.5">
              <h2 className="text-lg font-bold">{opcoes.length === 1 ? "1 encaixe" : `${opcoes.length} encaixes`} para {primeiroNome(nome)}</h2>
              <div className="flex flex-wrap gap-3 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[#2e8b57]" />Tudo livre</span>
                <span className="flex items-center gap-1.5"><span aria-hidden className="h-2.5 w-2.5 rounded-sm bg-[#e68b00]" />Com 1 troca</span>
              </div>
            </div>
            {visiveis.map((opcao, i) => (
              <OpcaoDeEncaixeCartao
                key={opcao.chave}
                opcao={opcao}
                numero={i + 1}
                crianca={nome}
                comPreferencia={preferidos.length > 0}
                mandada={mandadas.includes(opcao.chave)}
                onSim={() => setParaMandar(opcao)}
                onNao={() => setParaRecusar(opcao)}
              />
            ))}
            {!mostrarTodas && opcoes.length > OPCOES_EM_DESTAQUE && (
              <Button variant="outline" className="h-11 text-[15px] text-[#127a7e]" onClick={() => setMostrarTodas(true)}>
                Mostrar mais {opcoes.length - OPCOES_EM_DESTAQUE} {opcoes.length - OPCOES_EM_DESTAQUE === 1 ? "opção" : "opções"}
              </Button>
            )}
          </>
        )}
      </section>

      <MandarParaRecepcao crianca={nome} opcao={paraMandar} onFechar={() => setParaMandar(null)} onMandar={mandar} />
      <DizerNao crianca={nome} opcao={paraRecusar} onFechar={() => setParaRecusar(null)} onSalvar={recusar} />
    </div>
  );
}
