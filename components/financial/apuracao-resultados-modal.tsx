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
// 1. ADICIONADO addMonths
import { format, startOfDay, endOfDay, addMonths } from "date-fns";
import { getAppointmentsForReport, Appointment } from "@/services/appointmentService";
// CORREÇÃO: Importar getTransactionsForReport
import { getTransactionsForReport, Transaction } from "@/services/financialService";
import { Loader2 } from "lucide-react";
// (Vou assumir que você tem/quer formatadores, mas vou usar .toFixed() para garantir)

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
      // Adiciona T00:00:00 e T23:59:59 para garantir que a data seja pega corretamente
      const start = startOfDay(new Date(startDate + "T00:00:00"));
      const end = endOfDay(new Date(endDate + "T23:59:59"));

      // --- LÓGICA DO REPASSE DE 2 MESES ---
      // 2. Define o período de *pagamento* do repasse (2 meses à frente)
      const repasseStartDate = addMonths(start, 2);
      const repasseEndDate = addMonths(end, 2);
      // --- FIM DA LÓGICA DO REPASSE ---

      // 1. Buscar Agendamentos (Regime de Competência - Pela data do agendamento)
      const appointments = await getAppointmentsForReport({
        startDate: start,
        endDate: end,
      });

      // 2. Buscar Transações de Despesa (Regime de Caixa - Pela data de pagamento do repasse)
      // 3. ALTERAÇÃO: Busca repasses no período futuro
      const repasseTransactions = await getTransactionsForReport({
        startDate: repasseStartDate, // Usa a data futura
        endDate: repasseEndDate,     // Usa a data futura
        type: "despesa",
        status: "pago", // Assumindo que "repasse passado" significa repasse "pago"
      });
      
      // 3. Criar um Mapa de Repasses para consulta rápida
      // Filtra client-side apenas pela categoria "Repasse de Profissional"
      const repasseMap = new Map<string, number>();
      // 4. ALTERAÇÃO: Usa a variável repasseTransactions
      repasseTransactions.forEach((t) => {
        if (
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
      
      // --- CORREÇÃO DE ESCOPO 1: Declarar os Maps aqui ---
      let porPaciente: Map<string, ApuracaoPaciente> | null = null;
      let porTerapia: Map<string, ApuracaoTerapia> | null = null;

      // 5. Processar de acordo com o tipo
      if (reportType === "paciente") {
        // --- CORREÇÃO DE ESCOPO 2: Atribuir ao invés de declarar ---
        porPaciente = new Map<string, ApuracaoPaciente>();

        faturados.forEach((app) => {
          // O repasse é buscado do mapa (Regime de Caixa)
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
        // --- CORREÇÃO DE ESCOPO 3: Atribuir ao invés de declarar ---
        porTerapia = new Map<string, ApuracaoTerapia>();

        faturados.forEach((app) => {
          const repasseValor = repasseMap.get(app.id) || 0;
          const valorFaturado = app.valorConsulta || 0;
          const terapiaNome = app.tipo || "Não especificada";

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

      // --- CORREÇÃO DE ESCOPO 4: Usar optional chaining (?.) ---
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