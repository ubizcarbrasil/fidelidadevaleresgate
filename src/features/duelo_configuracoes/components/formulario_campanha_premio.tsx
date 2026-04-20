import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { schemaCampanhaPremio } from "../schemas/schema_campanha_premio";
import { STATUS_CAMPANHA, type StatusCampanha } from "../constants/constantes_configuracao_duelo";
import { useAtualizarCampanha, useCriarCampanha } from "../hooks/hook_campanhas_premio";
import type { CampanhaPremio } from "../types/tipos_configuracao_duelo";

interface Props {
  open: boolean;
  onClose: () => void;
  branchId: string;
  brandId: string;
  campanha?: CampanhaPremio | null;
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 16);
}

export default function FormularioCampanhaPremio({ open, onClose, branchId, brandId, campanha }: Props) {
  const isEdit = !!campanha;
  const criar = useCriarCampanha(branchId, brandId);
  const atualizar = useAtualizarCampanha(branchId);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [pointsCost, setPointsCost] = useState<number>(1000);
  const [quantityTotal, setQuantityTotal] = useState<number>(1);
  const [startsAt, setStartsAt] = useState<string>(toLocalInput(new Date().toISOString()));
  const [endsAt, setEndsAt] = useState<string>(toLocalInput(new Date(Date.now() + 30 * 24 * 3600_000).toISOString()));
  const [status, setStatus] = useState<StatusCampanha>("active");

  useEffect(() => {
    if (open && campanha) {
      setName(campanha.name);
      setDescription(campanha.description ?? "");
      setImageUrl(campanha.image_url ?? "");
      setPointsCost(campanha.points_cost);
      setQuantityTotal(campanha.quantity_total);
      setStartsAt(toLocalInput(campanha.starts_at));
      setEndsAt(toLocalInput(campanha.ends_at));
      setStatus(campanha.status);
    } else if (open) {
      setName(""); setDescription(""); setImageUrl("");
      setPointsCost(1000); setQuantityTotal(1); setStatus("active");
      setStartsAt(toLocalInput(new Date().toISOString()));
      setEndsAt(toLocalInput(new Date(Date.now() + 30 * 24 * 3600_000).toISOString()));
    }
  }, [open, campanha]);

  const handleSubmit = () => {
    const payload = {
      name,
      description: description || null,
      image_url: imageUrl || null,
      points_cost: pointsCost,
      quantity_total: quantityTotal,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      status,
    };
    const parsed = schemaCampanhaPremio.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }
    const onSuccess = () => onClose();
    if (isEdit && campanha) {
      atualizar.mutate({ id: campanha.id, input: payload as any }, { onSuccess });
    } else {
      criar.mutate(payload as any, { onSuccess });
    }
  };

  const loading = criar.isPending || atualizar.isPending;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Editar campanha" : "Nova campanha de prêmio"}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <Label className="text-xs">Nome do prêmio *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vale-combustível R$ 200" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descrição</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">URL da imagem</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Custo (pontos) *</Label>
              <Input type="number" min={1} value={pointsCost} onChange={(e) => setPointsCost(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantidade *</Label>
              <Input type="number" min={1} value={quantityTotal} onChange={(e) => setQuantityTotal(Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Início *</Label>
              <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim *</Label>
              <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusCampanha)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_CAMPANHA.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}