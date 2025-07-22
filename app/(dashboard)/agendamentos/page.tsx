import { AgendamentosClientPage } from "@/components/pages/agendamentos-client-page";

export default function AgendamentosPage() {
  // A página do servidor agora apenas renderiza o componente de cliente.
  // O título e os botões serão gerenciados dentro do componente de cliente
  // para que ele possa controlar o estado do modal de relatório.
  return (
    <AgendamentosClientPage />
  );
}