import { AgendamentosClientPage } from "@/components/pages/agendamentos-client-page";

// ?data=aaaa-mm-dd abre a agenda naquele dia (o assistente manda a recepção para o dia da troca)
export default async function AgendamentosPage({ searchParams }: { searchParams: Promise<{ data?: string }> }) {
  const { data } = await searchParams;
  return <AgendamentosClientPage dataInicial={data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : undefined} />;
}
