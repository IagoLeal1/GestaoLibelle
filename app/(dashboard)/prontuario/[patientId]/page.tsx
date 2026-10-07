import { ProntuarioDaCrianca } from "@/components/prontuario/prontuario-da-crianca";

type Props = {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ terapia?: string }>;
};

// /prontuario/<criança>?terapia=Fonoaudiologia abre o prontuário já na aba daquela terapia
export default async function ProntuarioPage({ params, searchParams }: Props) {
  const [{ patientId }, { terapia }] = await Promise.all([params, searchParams]);
  return <ProntuarioDaCrianca patientId={patientId} terapiaInicial={terapia} />;
}
