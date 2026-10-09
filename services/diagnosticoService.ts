// O diagnóstico na ficha da criança (lib/diagnostico). Quem grava é quem já edita a ficha (admin,
// coordenação e recepção): as regras de patients não mudam. A equipe vem da agenda da criança.
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { esquecer } from "@/lib/memoria";
import { janelaDaEquipe, limparDiagnosticos, type Diagnostico, type SessaoDaEquipe } from "@/lib/diagnostico";
import { getAppointmentsForReport } from "@/services/appointmentService";

/** Grava a lista limpa, com quem atualizou e quando; devolve o que foi gravado. */
export async function salvarDiagnostico(patientId: string, lista: Partial<Diagnostico>[], autorNome: string) {
  const diagnosticos = limparDiagnosticos(lista);
  await updateDoc(doc(db, "patients", patientId), {
    diagnosticos,
    diagnosticoAtualizadoEm: serverTimestamp(),
    diagnosticoAtualizadoPor: autorNome,
  });
  esquecer("patients:");
  return diagnosticos;
}

/** As sessões da criança de 30 dias atrás até 30 dias à frente (uma busca só, pelo índice da agenda). */
export async function getSessoesDaEquipe(patientId: string, agora = new Date()): Promise<SessaoDaEquipe[]> {
  const { de, ate } = janelaDaEquipe(agora);
  const sessoes = await getAppointmentsForReport({ patientId, startDate: de, endDate: ate });
  return sessoes.map((s) => ({
    tipo: s.tipo,
    professionalId: s.professionalId,
    professionalName: s.professionalName,
    status: s.status,
    start: s.start.toDate(),
  }));
}
