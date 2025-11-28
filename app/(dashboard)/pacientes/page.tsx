"use client"

import { useState, useEffect, useCallback } from "react";
import Link from 'next/link';
import { PlusCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PatientClientPage } from '@/components/pages/patient-client-page';
import { Patient, getPatients } from "@/services/patientService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Exportação
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState("todos");

  // Função de busca de dados (passada para o filho também, para atualizar após edições)
  const fetchData = useCallback(async () => {
    setLoading(true);
    const patientsFromDB = await getPatients();
    setPacientes(patientsFromDB);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lógica de Exportação (Movida para cá)
  const handleExportExcel = () => {
    const pacientesParaExportar = pacientes.filter(p => {
        if (exportFilter === "todos") return true;
        return p.status === exportFilter;
    });

    if (pacientesParaExportar.length === 0) {
        alert("Nenhum paciente encontrado para este filtro.");
        return;
    }

    const headers = ["Nome Completo", "Convenio", "Status"];
    const rows = pacientesParaExportar.map(p => [
        `"${p.fullName}"`, 
        `"${p.convenio || "Não informado"}"`,
        p.status === "ativo" ? "Ativo" : p.status === "inativo" ? "Inativo" : "Suspenso"
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pacientes_${exportFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO UNIFICADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary-dark-blue">
            Pacientes
          </h2>
          <p className="text-muted-foreground">
            Gerencie o cadastro de pacientes da clínica
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
           {/* Botão Exportar Verde */}
           <Button 
            className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
            onClick={() => setExportModalOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>

          {/* Botão Novo Paciente */}
          <Link href="/pacientes/novo" className="flex-1 sm:flex-none">
            <Button className="w-full">
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* Componente Filho (Recebe os dados via props) */}
      <PatientClientPage 
        data={pacientes} 
        isLoading={loading} 
        onRefresh={fetchData} // Passamos a função para atualizar a lista se necessário
        setPacientes={setPacientes} // Passamos o setter para atualizações otimistas (status)
      />

      {/* Modal de Exportação */}
      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar Pacientes</DialogTitle>
            <DialogDescription>
              Selecione o filtro de status para gerar o arquivo Excel (CSV).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="export-filter">Filtrar por Status</Label>
              <Select value={exportFilter} onValueChange={setExportFilter}>
                <SelectTrigger id="export-filter">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativo">Somente Ativos</SelectItem>
                  <SelectItem value="inativo">Somente Inativos</SelectItem>
                  <SelectItem value="suspenso">Somente Suspensos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 text-white">
                <Download className="mr-2 h-4 w-4" /> Baixar Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}