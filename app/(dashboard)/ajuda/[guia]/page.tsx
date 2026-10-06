import { GuiaAberto } from "@/components/ajuda/guia-aberto";

type Props = {
  params: Promise<{ guia: string }>;
};

// /ajuda/escrever-evolucao abre um guia passo a passo (lib/guias)
export default async function GuiaPage({ params }: Props) {
  const { guia } = await params;
  return <GuiaAberto id={guia} />;
}
