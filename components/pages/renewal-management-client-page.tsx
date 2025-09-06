// components/pages/renewal-management-client-page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, XCircle, CheckCircle, AlertTriangle } from "lucide-react";

// Serviços e Tipos
import { 
  Appointment, 
  RenewableBlock, 
  getRenewableAppointmentsByPatient, 
  renewAppointmentBlock,
  dismissRenewal 
} from "@/services/appointmentService";

export function RenewalManagementClientPage() {
  const [renewableBlocks, setRenewableBlocks] = useState<RenewableBlock[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<RenewableBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [renewingState, setRenewingState] = useState<Record<string, number>>({}); // { appointmentId: sessionsCount }

  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await getRenewableAppointmentsByPatient();
    setRenewableBlocks(data);
    setFilteredBlocks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const filtered = renewableBlocks.filter(block =>
      block.patientName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBlocks(filtered);
  }, [searchTerm, renewableBlocks]);

  const handleConfirmRenewal = async (appointment: Appointment) => {
    const sessionsCount = renewingState[appointment.id] || 4;
    const result = await renewAppointmentBlock(appointment, sessionsCount);
    if (result.success) {
      toast.success(`Bloco de ${appointment.patientName} renovado com ${sessionsCount} sessões!`);
      fetchData(); // Recarrega tudo
    } else {
      toast.error(result.error || "Erro ao renovar.");
    }
  };

  const handleDismiss = async (appointment: Appointment) => {
    if (window.confirm(`Tem certeza que deseja dispensar este aviso para ${appointment.patientName}?`)) {
      const result = await dismissRenewal(appointment.id);
      if (result.success) {
        toast.info(`Aviso para ${appointment.patientName} dispensado.`);
        fetchData();
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleSessionCountChange = (appointmentId: string, count: number) => {
    setRenewingState(prev => ({ ...prev, [appointmentId]: count }));
  };

  if (loading) {
    return <p className="text-center p-8">Buscando agendamentos para renovar...</p>;
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome do paciente..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {filteredBlocks.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="mt-4 text-lg font-medium">Tudo em ordem!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nenhum bloco de agendamento precisa de renovação no momento.
          </p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full space-y-2">
          {filteredBlocks.map(block => (
            <AccordionItem value={block.patientId} key={block.patientId} className="border rounded-lg px-4 bg-background">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-lg">{block.patientName}</span>
                  <Badge variant="destructive">{block.appointments.length} bloco(s) a vencer</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                {block.appointments.map(app => (
                  <div key={app.id} className="border p-4 rounded-md bg-amber-50 border-amber-200 space-y-3">
                    <div className="flex items-center gap-2">
                       <AlertTriangle className="h-5 w-5 text-amber-600" />
                       <p className="font-medium text-amber-800">
                         Última sessão em: {format(app.start.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                       </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 justify-end">
                       <div className="flex items-center gap-2">
                          <Label htmlFor={`sessions-${app.id}`} className="text-sm font-medium">Renovar com</Label>
                          <Input 
                            id={`sessions-${app.id}`}
                            type="number"
                            className="h-9 w-20 text-center"
                            value={renewingState[app.id] || 4}
                            onChange={(e) => handleSessionCountChange(app.id, Number(e.target.value))}
                            min={1}
                          />
                          <Label htmlFor={`sessions-${app.id}`} className="text-sm font-medium">sessões</Label>
                       </div>
                       <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleDismiss(app)}>
                              <XCircle className="mr-2 h-4 w-4" /> Dispensar
                          </Button>
                           <Button size="sm" onClick={() => handleConfirmRenewal(app)} className="bg-primary-teal hover:bg-primary-teal/90">
                              <RefreshCw className="mr-2 h-4 w-4" /> Renovar Bloco
                          </Button>
                       </div>
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}