"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, MessageSquareText, Trash2 } from "lucide-react"
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore"
import { useAuth } from "@/context/AuthContext"
import {
  addPatientObservation,
  deleteLegacyPatientObservation,
  deletePatientObservation,
  getPatientObservations,
  PatientObservation,
} from "@/services/patientService"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface PatientObservationsProps {
  patientId: string;
  legacyObservation?: string;
}

const PERFIS: Record<string, string> = {
  admin: "Administrador",
  coordenador: "Coordenador",
  funcionario: "Funcionário",
  profissional: "Profissional",
  familiar: "Familiar",
};

const formatDateTime = (observation: PatientObservation) => {
  if (!observation.criadoEm?.toDate) return "Salvando horário...";

  return observation.criadoEm.toDate().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
};

export function PatientObservations({ patientId, legacyObservation }: PatientObservationsProps) {
  const { firestoreUser } = useAuth();
  const [texto, setTexto] = useState("");
  const [legacyText, setLegacyText] = useState(legacyObservation || "");
  const [observations, setObservations] = useState<PatientObservation[]>([]);
  const [lastDocument, setLastDocument] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadObservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const page = await getPatientObservations(patientId);
      setObservations(page.observations);
      setLastDocument(page.lastDocument);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error("Erro ao carregar observações do paciente:", err);
      setError("Não foi possível carregar as observações.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

  useEffect(() => {
    setLegacyText(legacyObservation || "");
  }, [legacyObservation, patientId]);

  const handleSave = async () => {
    if (!texto.trim() || !firestoreUser) return;

    setSaving(true);
    setError(null);

    try {
      const newObservation = await addPatientObservation(patientId, texto, {
        uid: firestoreUser.uid,
        displayName: firestoreUser.displayName || "Usuário",
        role: firestoreUser.profile?.role,
      });
      setObservations((current) => [newObservation, ...current]);
      setTexto("");
    } catch (err) {
      console.error("Erro ao salvar observação do paciente:", err);
      setError("Não foi possível salvar a observação.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastDocument || loadingMore) return;

    setLoadingMore(true);
    setError(null);

    try {
      const page = await getPatientObservations(patientId, lastDocument);
      setObservations((current) => [...current, ...page.observations]);
      setLastDocument(page.lastDocument);
      setHasMore(page.hasMore);
    } catch (err) {
      console.error("Erro ao carregar mais observações:", err);
      setError("Não foi possível carregar mais observações.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (observation: PatientObservation) => {
    const confirmed = window.confirm("Tem certeza que deseja excluir esta observação? Esta ação não poderá ser desfeita.");
    if (!confirmed) return;

    setDeletingId(observation.id);
    setError(null);

    try {
      await deletePatientObservation(patientId, observation.id);
      setObservations((current) => current.filter((item) => item.id !== observation.id));
    } catch (err) {
      console.error("Erro ao excluir observação do paciente:", err);
      setError("Não foi possível excluir a observação.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteLegacy = async () => {
    const confirmed = window.confirm("Tem certeza que deseja excluir este registro anterior? Esta ação não poderá ser desfeita.");
    if (!confirmed) return;

    setDeletingId("legacy");
    setError(null);

    try {
      await deleteLegacyPatientObservation(patientId);
      setLegacyText("");
    } catch (err) {
      console.error("Erro ao excluir observação legada do paciente:", err);
      setError("Não foi possível excluir o registro anterior.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          value={texto}
          onChange={(event) => setTexto(event.target.value)}
          placeholder="Escreva uma nova observação sobre o paciente..."
          rows={3}
          maxLength={2000}
          disabled={!firestoreUser || saving}
        />
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">{texto.length}/2000 caracteres</span>
          <Button type="button" onClick={handleSave} disabled={!texto.trim() || !firestoreUser || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar observação
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-3 border-t pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando observações...
          </div>
        ) : (
          <>
            {observations.map((observation) => {
              const canDelete = firestoreUser && (
                observation.autorId === firestoreUser.uid ||
                firestoreUser.profile?.role === "admin" ||
                firestoreUser.profile?.role === "coordenador"
              );

              return (
              <article key={observation.id} className="rounded-lg border bg-muted/30 p-4">
                <div className="mb-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium text-foreground">
                    {observation.autorNome}
                    {observation.autorPerfil && ` • ${PERFIS[observation.autorPerfil] || observation.autorPerfil}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <time>{formatDateTime(observation)}</time>
                    {canDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(observation)}
                        disabled={deletingId === observation.id}
                        aria-label="Excluir observação"
                        title="Excluir observação"
                      >
                        {deletingId === observation.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{observation.texto}</p>
              </article>
              );
            })}

            {legacyText.trim() && (
              <article className="rounded-lg border border-dashed bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Registro anterior • sem data e autoria</span>
                  {firestoreUser && ["admin", "coordenador", "funcionario"].includes(firestoreUser.profile?.role) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={handleDeleteLegacy}
                      disabled={deletingId === "legacy"}
                      aria-label="Excluir registro anterior"
                      title="Excluir registro anterior"
                    >
                      {deletingId === "legacy"
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-words text-sm">{legacyText}</p>
              </article>
            )}

            {observations.length === 0 && !legacyText.trim() && (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <MessageSquareText className="mb-2 h-8 w-8" />
                <p className="text-sm">Nenhuma observação registrada.</p>
              </div>
            )}

            {hasMore && (
              <div className="flex justify-center">
                <Button type="button" variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
