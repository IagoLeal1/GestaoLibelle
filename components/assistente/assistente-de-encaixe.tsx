"use client"

// O assistente de agendamento (/agendamentos/assistente): a coordenação procura o encaixe e manda para
// a recepção, que agenda pela aba "Para agendar" (o número laranja). ?aba=para-agendar abre direto nela.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEMANAS_ANALISADAS } from "@/lib/horariosRecorrentes";
import { contarParaAgendar } from "@/services/encaixeService";
import { ParaAgendar, Recusados } from "./para-agendar";
import { ProcurarEncaixe } from "./procurar-encaixe";

export type AbaDoAssistente = "procurar" | "para-agendar" | "recusados";

const aba = "rounded-none border-b-[3px] border-transparent px-3.5 py-2.5 text-[15px] font-semibold text-[#52646d] shadow-none data-[state=active]:border-[#127a7e] data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-[#127a7e] data-[state=active]:shadow-none";

export function AssistenteDeEncaixe({ abaInicial = "procurar" }: { abaInicial?: AbaDoAssistente }) {
  const [abaAtual, setAbaAtual] = useState<AbaDoAssistente>(abaInicial);
  const [faltam, setFaltam] = useState<number | null>(null);

  const contar = useCallback(() => {
    contarParaAgendar().then(setFaltam).catch(() => setFaltam(null));
  }, []);
  useEffect(contar, [contar]);

  const mudarAba = (valor: string) => {
    setAbaAtual(valor as AbaDoAssistente);
    // O endereço acompanha a aba (voltar do Novo Agendamento cai no mesmo lugar)
    window.history.replaceState(null, "", valor === "procurar" ? "/agendamentos/assistente" : `/agendamentos/assistente?aba=${valor}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/agendamentos" className="inline-flex min-h-9 items-center gap-1 self-start text-sm font-semibold text-[#127a7e] hover:underline">
        <ChevronLeft aria-hidden className="h-4 w-4" /> Agendamentos
      </Link>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-bold tracking-tight">Assistente de Agendamento</h2>
        <p className="text-[15px] text-muted-foreground">
          Acha horário para a criança nas próximas {SEMANAS_ANALISADAS} semanas: livre, ou com uma troca segura de outra criança.
        </p>
      </div>

      <Tabs value={abaAtual} onValueChange={mudarAba} className="flex flex-col gap-4">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="procurar" className={aba}>Procurar encaixe</TabsTrigger>
          <TabsTrigger value="para-agendar" className={`${aba} gap-2`}>
            Para agendar
            {!!faltam && (
              <span className="rounded-full bg-[#e68b00] px-2 py-px text-xs font-bold text-white">
                {faltam}<span className="sr-only"> para agendar</span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recusados" className={aba}>Recusados</TabsTrigger>
        </TabsList>
        <TabsContent value="procurar" className="mt-0"><ProcurarEncaixe onMandou={contar} /></TabsContent>
        <TabsContent value="para-agendar" className="mt-0"><ParaAgendar onMudou={contar} /></TabsContent>
        <TabsContent value="recusados" className="mt-0"><Recusados /></TabsContent>
      </Tabs>
    </div>
  );
}
