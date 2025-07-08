// /components/tables/patient-table.tsx
'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Patient } from "@/services/patientService"; // Importamos nosso tipo

// Função para formatar a data de nascimento
const formatBirthDate = (birthDate: { seconds: number }) => {
  if (!birthDate?.seconds) return 'N/A';
  const date = new Date(birthDate.seconds * 1000);
  return date.toLocaleDateString('pt-BR');
};

interface PatientTableProps {
  patients: Patient[];
}

export function PatientTable({ patients }: PatientTableProps) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome Completo</TableHead>
              <TableHead>Data de Nascimento</TableHead>
              <TableHead>Responsáveis</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length > 0 ? (
              patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">{patient.fullName}</TableCell>
                  <TableCell>{formatBirthDate(patient.birthDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{patient.responsibleUserIds?.length || 0} resp.</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Botão para futuras ações como editar/excluir */}
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Nenhum paciente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}