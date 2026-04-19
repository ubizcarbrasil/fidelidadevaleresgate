/**
 * DialogCriarModelo — Sub-fase 5.3
 * Form completo para criar um novo Business Model.
 * Validações:
 *  - key: lowercase_underscore, único
 *  - name obrigatório
 *  - audience: cliente | motorista | b2b
 *  - pricing_model: included | usage_based | fixed_addon
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useCreateBusinessModel,
  useBusinessModelsCatalog,
  type BusinessModelAudience,
  type BusinessModelPricing,
} from "@/compartilhados/hooks/hook_modelos_negocio_crud";

interface DialogCriarModeloProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SLUG_RX = /^[a-z][a-z0-9_]*$/;

export function DialogCriarModelo({ open, onOpenChange }: DialogCriarModeloProps) {
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Briefcase");
  const [color, setColor] = useState("#6366F1");
  const [audience, setAudience] = useState<BusinessModelAudience>("cliente");
  const [pricingModel, setPricingModel] = useState<BusinessModelPricing>("included");
  const [sortOrder, setSortOrder] = useState<number>(99);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateBusinessModel();
  const { data: catalog } = useBusinessModelsCatalog();

  useEffect(() => {
    if (open) {
      setKey(""); setName(""); setDescription(""); setIcon("Briefcase");
      setColor("#6366F1"); setAudience("cliente"); setPricingModel("included");
      setSortOrder(99); setError(null);
    }
  }, [open]);

  const validate = (): string | null => {
    if (!key.trim()) return "A chave é obrigatória.";
    if (!SLUG_RX.test(key)) return "A chave deve estar em lowercase_underscore (ex.: meu_modelo).";
    if ((catalog ?? []).some((m) => m.key === key)) return "Já existe um modelo com essa chave.";
    if (!name.trim()) return "O nome é obrigatório.";
    return null;
  };

  const handleCriar = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    await create.mutateAsync({
      key, name,
      description: description || null,
      icon: icon || null,
      color: color || null,
      audience,
      pricing_model: pricingModel,
      sort_order: sortOrder,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg z-[90]">
        <DialogHeader>
          <DialogTitle>Novo Modelo de Negócio</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="new-key">Chave (única, imutável)</Label>
              <Input
                id="new-key"
                value={key}
                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="ex: novo_modelo"
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                lowercase_underscore. Não pode ser alterada depois.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="new-name">Nome</Label>
              <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="new-desc">Descrição</Label>
              <Textarea id="new-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label htmlFor="new-icon">Ícone (lucide)</Label>
              <Input id="new-icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="new-color">Cor</Label>
              <div className="flex gap-2">
                <Input id="new-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-16 p-1 h-10" />
                <Input value={color} onChange={(e) => setColor(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as BusinessModelAudience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="motorista">Motorista</SelectItem>
                  <SelectItem value="b2b">B2B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pricing model</Label>
              <Select value={pricingModel} onValueChange={(v) => setPricingModel(v as BusinessModelPricing)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="included">Incluso</SelectItem>
                  <SelectItem value="usage_based">Por uso</SelectItem>
                  <SelectItem value="fixed_addon">Add-on fixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-sort">Ordem</Label>
              <Input
                id="new-sort"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCriar} disabled={create.isPending}>
            {create.isPending ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
