import { PaginaDeEvolucoes } from "@/components/evolucoes/pagina-de-evolucoes";

type Props = {
  searchParams: Promise<{ crianca?: string }>;
};

// /evolucoes?crianca=ID abre já na história da criança (vem da ficha dela)
export default async function EvolucoesPage({ searchParams }: Props) {
  const { crianca } = await searchParams;
  return <PaginaDeEvolucoes criancaInicial={crianca} />;
}
