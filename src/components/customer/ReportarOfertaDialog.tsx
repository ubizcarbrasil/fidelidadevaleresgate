import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

const MOTIVOS = [
  { value: "preco_diferente", label: "Preço diferente do informado" },
  { value: "oferta_indisponivel", label: "Oferta indisponível" },
  { value: "link_com_erro", label: "Link com erro" },
  { value: "produto_diferente", label: "Produto diferente" },
  { value: "outro", label: "Outro problema" },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  userId?: string | null;
}

export default function ReportarOfertaDialog({ open, onOpenChange, dealId, userId }: Props) {
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async () => {
    if (!motivo) {
      toast.error("Selecione um motivo");
      return;
    }

    setEnviando(true);
    try {
      const { error } = await supabase.from("offer_reports").insert({
        offer_id: dealId,
        user_id: userId || null,
        reason: motivo,
        note: observacao || null,
        status: "pending",
      } as any);

      if (error) throw error;

      toast.success("Obrigado pelo aviso! Vamos verificar.");
      setMotivo("");
      setObservacao("");
      onOpenChange(false);
    } catch (err: any) {
      console.error("Erro ao reportar:", err);
      toast.error("Erro ao enviar. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reportar problema
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Motivo</label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Observação <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <Textarea
              placeholder="Descreva o problema..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <Button
            onClick={handleEnviar}
            disabled={enviando || !motivo}
            className="w-full"
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
