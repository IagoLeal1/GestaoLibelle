// app/(dashboard)/agendamentos/assistente/page.tsx
// /agendamentos/assistente?aba=para-agendar abre direto na lista da recepção (o número laranja leva para lá)
import { AbaDoAssistente, AssistenteDeEncaixe } from "@/components/assistente/assistente-de-encaixe";

const ABAS: AbaDoAssistente[] = ["procurar", "para-agendar", "recusados"];

export default async function AssistenteAgendamentoPage({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { aba } = await searchParams;
  return <AssistenteDeEncaixe abaInicial={ABAS.includes(aba as AbaDoAssistente) ? (aba as AbaDoAssistente) : "procurar"} />;
}
