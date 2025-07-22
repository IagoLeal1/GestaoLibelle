"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Professional } from "@/services/professionalService";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (professionalId: string, startDate: string, endDate: string) => Promise<void>;
  professionals: Professional[];
}

export function ReportModal({ isOpen, onClose, onGenerate, professionals }: ReportModalProps) {
  const [professionalId, setProfessionalId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleGenerateClick = async () => {
    if (!professionalId || !startDate || !endDate) {
      alert("Por favor, selecione um profissional e o período completo.");
      return;
    }
    setLoading(true);
    await onGenerate(professionalId, startDate, endDate);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerar Relatório de Agendamentos</DialogTitle>
          <DialogDescription>
            Selecione o profissional e o período para exportar os dados em formato CSV (compatível com Excel).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Profissional</Label>
            <Select onValueChange={setProfessionalId} value={professionalId}>
              <SelectTrigger><SelectValue placeholder="Selecione um profissional..." /></SelectTrigger>
              <SelectContent>
                {professionals.map(p => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleGenerateClick} disabled={loading}>
            {loading ? "Gerando..." : "Gerar Relatório"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
