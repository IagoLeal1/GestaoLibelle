import { db } from "@/lib/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  writeBatch, 
  Timestamp, 
  limit 
} from "firebase/firestore";
import { addMonths } from "date-fns";

export const fixExistingRepasseDates = async () => {
  console.log("=== RODANDO CORREÇÃO DE REPASSES (DEBUG ATIVADO) ===");
  
  try {
    const transactionsRef = collection(db, "transactions");
    // Pega repasses pendentes
    const q = query(
      transactionsRef, 
      where("category", "==", "Repasse de Profissional"),
      where("status", "==", "pendente"),
      limit(500) 
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log("Nenhum repasse pendente encontrado.");
      return { success: true, message: "Nenhum repasse pendente." };
    }

    const updates = [];
    let count = 0;
    let ignored = 0;

    console.log(`Analisando ${snapshot.size} transações...`);

    for (const transactionDoc of snapshot.docs) {
      const txData = transactionDoc.data();
      
      if (!txData.appointmentId) {
        ignored++;
        continue;
      }

      const appointmentRef = doc(db, "appointments", txData.appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);

      if (!appointmentSnap.exists()) {
        ignored++;
        continue;
      }

      const appointmentData = appointmentSnap.data();
      // Pega o convênio, converte para minúsculo e remove espaços extras
      const convenioRaw = appointmentData.convenio || "";
      const convenio = convenioRaw.toLowerCase().trim();
      
      // REGRA: É Particular, Vazio ou contém a palavra "pacote"?
      const isParticular = convenio === "" || convenio === "particular";
      const isPacote = convenio.includes("pacote");
      
      const isRegraUmMes = isParticular || isPacote;

      if (isRegraUmMes) {
        // Data correta: Atendimento + 1 Mês
        const dataAtendimento = appointmentData.start.toDate();
        const novaDataVencimento = addMonths(dataAtendimento, 1);

        const dataAtualMovimento = txData.dataMovimento.toDate();
        
        // Verifica se precisa corrigir (compara Mês e Ano)
        const mesmoMes = dataAtualMovimento.getMonth() === novaDataVencimento.getMonth();
        const mesmoAno = dataAtualMovimento.getFullYear() === novaDataVencimento.getFullYear();

        if (!mesmoMes || !mesmoAno) {
            console.log(`CORRIGINDO: ${txData.description}`);
            console.log(`   - Convênio: "${convenioRaw}"`);
            console.log(`   - Data Atend: ${dataAtendimento.toLocaleDateString()}`);
            console.log(`   - Vencimento Atual (Errado): ${dataAtualMovimento.toLocaleDateString()}`);
            console.log(`   - Novo Vencimento (Correto): ${novaDataVencimento.toLocaleDateString()}`);

            updates.push({
                ref: transactionDoc.ref,
                data: { 
                  dataMovimento: Timestamp.fromDate(novaDataVencimento),
                  updatedByScript: true 
                }
            });
            count++;
        }
      }
    }

    if (updates.length > 0) {
        const batch = writeBatch(db);
        updates.forEach(update => batch.update(update.ref, update.data));
        await batch.commit();
        console.log(`✅ Lote finalizado! ${count} corrigidos.`);
        return { success: true, message: `${count} repasses corrigidos (veja o console F12).` };
    } else {
        console.log("ℹ️ Nenhuma correção necessária neste lote.");
        return { success: true, message: "Tudo parece correto. Se ainda vê erro, verifique se o filtro de data está certo." };
    }

  } catch (error) {
    console.error("Erro fatal:", error);
    return { success: false, error: "Erro ao executar script." };
  }
};