import { useState, useMemo } from "react";
import { BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ManualRenderer } from "@/components/manuais/ManualRenderer";
import { gruposManuais } from "@/components/manuais/dados_manuais";
import type { ManualEntry } from "@/components/manuais/tipos_manuais";

interface ManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manualIds: string[];
  titulo?: string;
  descricao?: string;
}

export function ManualModal({
  open,
  onOpenChange,
  manualIds,
  titulo = "Manual",
  descricao = "Guia passo a passo para esta área da plataforma.",
}: ManualModalProps) {
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const manuais = useMemo<ManualEntry[]>(() => {
    const todos = gruposManuais.flatMap((g) => g.manuais);
    return manualIds
      .map((id) => todos.find((m) => m.id === id))
      .filter((m): m is ManualEntry => Boolean(m));
  }, [manualIds]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            {titulo}
          </DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {manuais.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum manual encontrado.
            </p>
          ) : (
            manuais.map((manual) => (
              <ManualRenderer
                key={manual.id}
                manual={manual}
                aberto={abertoId === manual.id}
                onToggle={() =>
                  setAbertoId((prev) => (prev === manual.id ? null : manual.id))
                }
              />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}