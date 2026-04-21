import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, RefreshCw, Pencil } from "lucide-react";
import { useCriarNotaLead, useNotasLead } from "../hooks/hook_detalhes_lead";
import type { NotaLeadRow } from "../types/tipos_nota_lead";

interface BlocoHistoricoLeadProps {
  leadId: string;
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ItemHistorico({ nota }: { nota: NotaLeadRow }) {
  const Icon =
    nota.note_type === "status_change"
      ? RefreshCw
      : nota.note_type === "field_change"
        ? Pencil
        : MessageCircle;

  return (
    <div className="flex gap-3 py-3 border-b border-border/50 last:border-0">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm break-words whitespace-pre-wrap">{nota.content}</p>
        <p className="text-xs text-muted-foreground">
          {nota.author_name ?? "Sistema"} · {formatarData(nota.created_at)}
        </p>
      </div>
    </div>
  );
}

export default function BlocoHistoricoLead({ leadId }: BlocoHistoricoLeadProps) {
  const [conteudo, setConteudo] = useState("");
  const { data: notas = [], isLoading } = useNotasLead(leadId);
  const mutation = useCriarNotaLead(leadId);

  const handleSalvar = async () => {
    const texto = conteudo.trim();
    if (texto.length < 2) return;
    await mutation.mutateAsync(texto);
    setConteudo("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Histórico & notas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Registrar uma nota sobre este lead (ligação, reunião, observação)…"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            rows={3}
            disabled={mutation.isPending}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSalvar}
              disabled={mutation.isPending || conteudo.trim().length < 2}
            >
              {mutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Salvar nota
            </Button>
          </div>
        </div>

        <div className="border-t border-border pt-2">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notas.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma nota ainda. Registre a primeira interação acima.
            </p>
          ) : (
            <div>{notas.map((nota) => <ItemHistorico key={nota.id} nota={nota} />)}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}