// components/features/RenewalNotificationButton.tsx
"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";
import Link from "next/link";
import { getRenewableAppointmentsByPatient } from "@/services/appointmentService";

export function RenewalNotificationButton() {
  const [renewalCount, setRenewalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      setLoading(true);
      const renewableBlocks = await getRenewableAppointmentsByPatient();
      setRenewalCount(renewableBlocks.length);
      setLoading(false);
    };
    fetchCount();
  }, []);

  if (loading || renewalCount === 0) {
    return null; // Não mostra nada se estiver carregando ou se não houver renovações
  }

  return (
    <Button asChild variant="outline" className="relative bg-yellow-50 border-yellow-400 text-yellow-800 hover:bg-yellow-100 hover:text-yellow-900">
      <Link href="/agendamentos/renovacoes">
        <BellRing className="mr-2 h-4 w-4" />
        Renovações Pendentes
        {renewalCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
            {renewalCount}
          </span>
        )}
      </Link>
    </Button>
  );
}