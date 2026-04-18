import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CATEGORY_META, ORDEM_CATEGORIAS } from "@/compartilhados/constants/constantes_categorias_modulos";
import { useCriarModulo, useAtualizarModulo, type ModuleDefinitionRow } from "../hooks/hook_catalogo";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: ModuleDefinitionRow | null;
}

const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

export default function ModalModuloForm({ open, onOpenChange, initial }: Props) {
  const isEdit = !!initial;
  const criar = useCriarModulo();
  const atualizar = useAtualizarModulo();

  const [form, setForm] = useState({
    key: "",
    name: "",
    description: "",
    category: "essencial",
    icon: "Blocks",
    route: "",
    is_core: false,
    customer_facing: false,
  });

  useEffect(() => {
    if (open) {
      setForm({
        key: initial?.key ?? "",
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        category: initial?.category ?? "essencial",
        icon: initial?.schema_json?.icon ?? "Blocks",
        route: initial?.schema_json?.route ?? "",
        is_core: initial?.is_core ?? false,
        customer_facing: initial?.customer_facing ?? false,
      });
    }
  }, [open, initial]);

  const keyValido = KEY_REGEX.test(form.key);
  const podeSalvar = form.name.trim().length > 0 && (isEdit || keyValido);

  const handleSave = async () => {
    if (!podeSalvar) return;
    if (isEdit && initial) {
      await atualizar.mutateAsync({
        id: initial.id,
        prev: initial,
        input: {
          name: form.name,
          description: form.description || null,
          category: form.category,
          icon: form.icon,
          route: form.route || undefined,
          is_core: form.is_core,
          customer_facing: form.customer_facing,
        },
      });
    } else {
      await criar.mutateAsync({
        key: form.key,
        name: form.name,
        description: form.description || null,
        category: form.category,
        icon: form.icon,
        route: form.route || undefined,
        is_core: form.is_core,
        customer_facing: form.customer_facing,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Catálogo de Produtos" />
          </div>
          <div>
            <Label>Chave (snake_case)</Label>
            <Input
              value={form.key}
              disabled={isEdit}
              onChange={(e) => setForm({ ...form, key: e.target.value.toLowerCase() })}
              placeholder="catalog_products"
              className="font-mono"
            />
            {!isEdit && form.key && !keyValido && (
              <p className="text-xs text-destructive mt-1">Use letras minúsculas, números e underscore. Deve começar com letra.</p>
            )}
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDEM_CATEGORIAS.filter((c) => c !== "general").map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ícone (lucide)</Label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="Blocks" />
            </div>
          </div>
          <div>
            <Label>Rota</Label>
            <Input value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} placeholder="/minha-rota" />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Core (sempre ativo)</Label>
              <p className="text-xs text-muted-foreground">Não pode ser desativado por marca/cidade</p>
            </div>
            <Switch checked={form.is_core} onCheckedChange={(v) => setForm({ ...form, is_core: v })} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Visível para clientes</Label>
              <p className="text-xs text-muted-foreground">Aparece nos apps end-user</p>
            </div>
            <Switch checked={form.customer_facing} onCheckedChange={(v) => setForm({ ...form, customer_facing: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!podeSalvar || criar.isPending || atualizar.isPending}>
            {isEdit ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
