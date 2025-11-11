"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
// Importa addMonths
import { format, startOfDay, endOfDay, addMonths } from "date-fns";
import { getAppointmentsForReport, Appointment } from "@/services/appointmentService";
// Importa a função correta
import { getTransactionsForReport, Transaction } from "@/services/financialService";
import { Loader2 } from "lucide-react";

// Funções de exportação (pode mover para /lib/utils se preferir)
const downloadCSV = (content: string, fileName: string) => {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- LÓGICA DE AGRUPAMENTO INTELIGENTE ---

// Nomes "Base" das terapias.
// A ORDEM É IMPORTANTE: Coloque nomes mais longos e específicos PRIMEIRO.
const THERAPY_BASE_NAMES = [
  // Fisioterapia (Regra 2)
  "Fisioterapia Respiratória",
  "Fisioterapia Motora",
  // Psicologia (Regra 1)
  "Psicologia ABA", // Será pego por "Psicologia" se "Psicologia" vier primeiro
  // Outros
  "Supervisão Terapia ABA",
  "Acompanhante Terapêutico Casa",
  "Acompanhante Terapêutico c/ Terapeuta",
  "Psicomotricidade",
  "Psicopedagogia",
  "Musicoterapia",
  // Nomes "base" de uma palavra (greedy) vêm por último
  "Psicologia",
  "Fonoaudiologia",
  "Terapia Ocupacional",
  "Fisioterapia", // Pega "Fisioterapia" simples
];

/**
 * Normaliza o nome de uma terapia para agrupar variações (pacote, convênio)
 * sob um nome "base".
 */
const getNormalizedTherapyName = (rawName: string | undefined): string => {
  if (!rawName) {
    return "Não especificada";
  }

  // Encontra o nome base correspondente
  for (const baseName of THERAPY_BASE_NAMES) {
    if (rawName.startsWith(baseName)) {
      return baseName;
    }
  }

  // Se nenhum nome base for encontrado, retorna o nome original
  return rawName;
};
// --- FIM DA LÓGICA DE AGRUPAMENTO ---

// Tipo para os dados agrupados
type ApuracaoPaciente = {
  nome: string;
  convenio: string;
  faturamento: number;
  repasse: number;
};
type ApuracaoTerapia = {
  nome: string;
  faturamento: number;
  repasse: number;
};

interface ApuracaoResultadosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = "paciente" | "terapia";

export function ApuracaoResultadosModal({
  isOpen,
  onClose,
}: ApuracaoResultadosModalProps) {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportType, setReportType] = useState<ReportType>("paciente");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    toast.info("Gerando seu relatório... Isso pode levar um momento.");

    try {
      // Período de FATURAMENTO (ex: 01/10 a 31/10)
      const start = startOfDay(new Date(startDate + "T00:00:00"));
      const end = endOfDay(new Date(endDate + "T23:59:59"));

      // Período de REPASSE (ex: 01/12 a 31/12)
      // Busca os repasses 2 meses após o período de faturamento
      const repasseSearchStart = startOfDay(addMonths(start, 2));
      const repasseSearchEnd = endOfDay(addMonths(end, 2));


      // 1. Buscar Agendamentos (do período de faturamento, ex: Outubro)
      const appointments = await getAppointmentsForReport({
        startDate: start,
        endDate: end,
      });

      // 2. Buscar Transações de Despesa (do período de repasse, ex: Dezembro)
      const repasseTransactions = await getTransactionsForReport({
        startDate: repasseSearchStart,
        endDate: repasseSearchEnd,
        type: "despesa",
        // status: "pago", // Removido para pegar 'pendente' ou 'pago'
      });
      
      // 3. Criar um Mapa de Repasses para consulta rápida
      const repasseMap = new Map<string, number>();
      repasseTransactions.forEach((t) => {
        if (
          // Usando o NOME da categoria, como definido em 'appointmentService.ts'
          t.category === "Repasse de Profissional" && 
          t.appointmentId &&
          t.value
        ) {
          repasseMap.set(
            t.appointmentId,
            (repasseMap.get(t.appointmentId) || 0) + t.value
          );
        }
      });
      // --- FIM DA LÓGICA DE BUSCA DE REPASSE ---

      // 4. Filtrar Agendamentos (Regra de Negócio: 'finalizado' e não 'fj_paciente')
      const faturados = appointments.filter(
        (app) =>
          app.status === "finalizado" &&
          app.statusSecundario !== "fj_paciente"
      );

      let csvContent = "";
      let fileName = `Apuracao_Resultados_${reportType}_${startDate}_a_${endDate}.csv`;
      
      let porPaciente: Map<string, ApuracaoPaciente> | null = null;
      let porTerapia: Map<string, ApuracaoTerapia> | null = null;

      // 5. Processar de acordo com o tipo
      if (reportType === "paciente") {
        porPaciente = new Map<string, ApuracaoPaciente>();

        faturados.forEach((app) => {
          // O repasse é buscado do mapa (agora incluindo pendentes)
          const repasseValor = repasseMap.get(app.id) || 0;
          const valorFaturado = app.valorConsulta || 0;

          const entry = porPaciente!.get(app.patientId) || {
            nome: app.patientName,
            convenio: app.convenio || "Particular",
            faturamento: 0,
            repasse: 0,
          };

          entry.faturamento += valorFaturado;
          entry.repasse += repasseValor;

          porPaciente!.set(app.patientId, entry);
        });

        // Gerar CSV Paciente
        const headers = [
          "Paciente",
          "Convênio",
          "Valor Faturado",
          "Repasse",
          "Imposto Estimado (16%)",
          "Total Geral Líquido",
          "Resultado (%)",
        ];
        csvContent = headers.join(";") + "\n";

        porPaciente.forEach((data) => {
          const imposto = data.faturamento * 0.16;
          const liquido = data.faturamento - imposto; // Sua fórmula
          const percentual = data.faturamento > 0 ? liquido / data.faturamento : 0; // Lucratividade (Líquido / Faturado)
          
          const row = [
            `"${data.nome}"`,
            `"${data.convenio}"`,
            data.faturamento.toFixed(2).replace(".", ","),
            data.repasse.toFixed(2).replace(".", ","),
            imposto.toFixed(2).replace(".", ","),
            liquido.toFixed(2).replace(".", ","),
            (percentual * 100).toFixed(2).replace(".", ",") + "%",
          ];
          csvContent += row.join(";") + "\n";
        });
      } 
      else if (reportType === "terapia") {
        porTerapia = new Map<string, ApuracaoTerapia>();

        faturados.forEach((app) => {
          // --- APLICA A NOVA LÓGICA DE NORMALIZAÇÃO ---
          const terapiaNome = getNormalizedTherapyName(app.tipo);
          // --- FIM DA APLICAÇÃO ---

          const repasseValor = repasseMap.get(app.id) || 0;
          const valorFaturado = app.valorConsulta || 0;

          const entry = porTerapia!.get(terapiaNome) || {
            nome: terapiaNome,
            faturamento: 0,
            repasse: 0,
          };

          entry.faturamento += valorFaturado;
          entry.repasse += repasseValor;

          porTerapia!.set(terapiaNome, entry);
        });

        // Gerar CSV Terapia
        const headers = [
          "Terapia",
          "Valor Faturado",
          "Repasse",
          "Imposto (16%)",
          "Total Geral Líquido",
          "Resultado (%)",
        ];
        csvContent = headers.join(";") + "\n";

        porTerapia.forEach((data) => {
          const imposto = data.faturamento * 0.16;
          const liquido = data.faturamento - imposto; // Sua fórmula
          const percentual = data.faturamento > 0 ? liquido / data.faturamento : 0; // Lucratividade (Líquido / Faturado)
          
          const row = [
            `"${data.nome}"`,
            data.faturamento.toFixed(2).replace(".", ","),
            data.repasse.toFixed(2).replace(".", ","),
            imposto.toFixed(2).replace(".", ","),
            liquido.toFixed(2).replace(".", ","),
            (percentual * 100).toFixed(2).replace(".", ",") + "%",
          ];
          csvContent += row.join(";") + "\n";
        });
      }

      if (csvContent === "" || (reportType === "paciente" && porPaciente?.size === 0) || (reportType === "terapia" && porTerapia?.size === 0)) {
        toast.info("Nenhum dado de faturamento encontrado para os filtros selecionados.");
      } else {
        downloadCSV(csvContent, fileName);
        toast.success("Relatório gerado com sucesso!");
        onClose();
      }
      
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast.error("Falha ao gerar relatório. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Apuração de Resultados</DialogTitle>
          <DialogDescription>
            Selecione o período e o tipo de apuração para gerar o relatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Apuração</Label>
            <RadioGroup
              value={reportType}
              onValueChange={(value: ReportType) => setReportType(value)}
              className="flex gap-4"
              disabled={isLoading}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paciente" id="r-paciente" />
                <Label htmlFor="r-paciente">Por Paciente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="terapia" id="r-terapia" />
                <Label htmlFor="r-terapia">Por Terapia</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleGenerateReport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Relatório"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}