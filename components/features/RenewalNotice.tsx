"use client"

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Appointment, 
  getRenewableAppointments,
  renewAppointmentBlock,
  dismissRenewal 
} from "@/services/appointmentService";
import { AlertCircle, RefreshCw, XCircle, CheckCircle } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";

interface RenewalNoticeProps {
  onActionCompleted: () => void;
}

export function RenewalNotice({ onActionCompleted }: RenewalNoticeProps) {
  const [renewable, setRenewable] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isRenewingId, setIsRenewingId] = useState<string | null>(null);
  const [sessionsCount, setSessionsCount] = useState<number>(4);

  useEffect(() => {
    const fetchRenewableAppointments = async () => {
      setLoading(true);
      const data = await getRenewableAppointments();
      setRenewable(data);
      setLoading(false);
    };
    fetchRenewableAppointments();
  }, []);

  const handleStartRenewal = (appointmentId: string) => {
    setIsRenewingId(appointmentId);
    setSessionsCount(4);
  };
  
  const handleCancelRenewal = () => {
    setIsRenewingId(null);
  };

  const handleConfirmRenewal = async (appointment: Appointment) => {
    const result = await renewAppointmentBlock(appointment, sessionsCount);
    if (result.success) {
      toast.success(`Bloco de ${appointment.patientName} renovado com mais ${sessionsCount} sessões!`);
      onActionCompleted();
      setIsRenewingId(null);
      setRenewable(prev => prev.filter(a => a.id !== appointment.id));
    } else {
      toast.error(result.error || "Ocorreu um erro ao renovar.");
    }
  };

  const handleDismiss = async (appointment: Appointment) => {
    const result = await dismissRenewal(appointment.id);
    if (result.success) {
      toast.info(`Aviso de renovação para ${appointment.patientName} dispensado.`);
      setRenewable(prev => prev.filter(a => a.id !== appointment.id));
    } else {
      toast.error(result.error);
    }
  };

  if (loading || renewable.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      {renewable.map(appointment => (
        <Alert key={appointment.id} variant="default" className="border-yellow-400 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-700" />
          <AlertTitle className="font-semibold text-yellow-800">Aviso de Renovação</AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-yellow-900">
                Este é o último agendamento do bloco de <strong>{appointment.patientName}</strong> (em {format(appointment.start.toDate(), "dd/MM/yyyy", { locale: ptBR })}).
              </span>
              
              {isRenewingId !== appointment.id ? (
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => handleDismiss(appointment)}>
                    <XCircle className="mr-2 h-4 w-4" /> Não, dispensar
                  </Button>
                  <Button size="sm" className="text-xs" onClick={() => handleStartRenewal(appointment.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Sim, renovar
                  </Button>
                </div>
              ) : (
                <div className="flex w-full sm:w-auto items-center gap-2 flex-shrink-0 bg-yellow-100 p-2 rounded-md">
                    <Label htmlFor="sessions" className="text-xs font-medium text-yellow-900">Sessões:</Label>
                    <Input 
                      id="sessions"
                      type="number"
                      className="h-8 w-16 text-center"
                      value={sessionsCount}
                      onChange={(e) => setSessionsCount(Number(e.target.value))}
                      min={1}
                    />
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={handleCancelRenewal}>
                        <XCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700" onClick={() => handleConfirmRenewal(appointment)}>
                      <CheckCircle className="mr-2 h-4 w-4" /> Confirmar
                    </Button>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}