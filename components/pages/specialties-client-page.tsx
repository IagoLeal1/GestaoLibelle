"use client"

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Search, Filter } from "lucide-react"; // Adicionado Filter
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Adicionado Label
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { Specialty, SpecialtyFormData, getSpecialties, createSpecialty, updateSpecialty, deleteSpecialty } from "@/services/specialtyService";
import { SpecialtyModal } from "@/components/modals/specialty-modal";
import { toast } from "sonner";

export function SpecialtiesClientPage() {
  const { firestoreUser } = useAuth();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<{ isOpen: boolean; data?: Specialty | null }>({ isOpen: false, data: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const data = await getSpecialties();
    setSpecialties(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = async (data: SpecialtyFormData) => {
    setIsSubmitting(true);
    const isEditMode = !!modalState.data?.id;
    const result = isEditMode
      ? await updateSpecialty(modalState.data!.id, data)
      : await createSpecialty(data);

    if (result.success) {
      toast.success(`Especialidade ${isEditMode ? 'atualizada' : 'criada'} com sucesso!`);
      setModalState({ isOpen: false, data: null });
      fetchData();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta especialidade?")) {
      const result = await deleteSpecialty(id);
      if (result.success) {
        toast.success("Especialidade excluída com sucesso!");
        fetchData();
      } else {
        toast.error(result.error);
      }
    }
  };

  const filteredSpecialties = specialties.filter((spec) => 
    spec.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (firestoreUser?.profile.role !== 'admin') {
      return <p className="p-4">Você não tem permissão para acessar esta página.</p>
  }
  
  if (loading) return <p className="p-4 text-center">Carregando especialidades...</p>;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">Especialidades e Valores</h2>
            <p className="text-muted-foreground">Gerencie os serviços e valores da clínica.</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, data: null })} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Nova Especialidade
        </Button>
      </div>

      {/* CARD DE FILTROS - IGUAL À PÁGINA DE PACIENTES */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar especialidade</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="search" 
                  placeholder="Nome da especialidade..." 
                  className="pl-8" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Lista de Especialidades ({filteredSpecialties.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSpecialties.length > 0 ? (
                filteredSpecialties.map((spec) => (
                  <TableRow key={spec.id}>
                    <TableCell className="font-medium">{spec.name}</TableCell>
                    <TableCell>{spec.value.toFixed(2).replace('.', ',')}</TableCell>
                    <TableCell className="hidden md:table-cell">{spec.description || "-"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, data: spec })}>Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(spec.id)}>Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhuma especialidade encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <SpecialtyModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, data: null })}
        onSubmit={handleFormSubmit}
        specialty={modalState.data}
        isLoading={isSubmitting}
      />
    </>
  );
}