import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles, Link2, Info, Save, Pencil } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert, AlertDescription, AlertTitle,
} from "@/components/ui/alert";
import {
  fetchSourceCatalog, updateSourceCatalogEntry, type SourceCatalogEntry,
} from "@/lib/api/mirrorSync";

const ICON_MAP: Record<string, any> = { Sparkles, Link2 };

function CardOrigem({ entry, onEditar }: { entry: SourceCatalogEntry; onEditar: () => void }) {
  const queryClient = useQueryClient();
  const Icon = (entry.icon && ICON_MAP[entry.icon]) || Sparkles;

  const handleToggle = async (value: boolean) => {
    try {
      await updateSourceCatalogEntry(entry.id, { is_enabled: value });
      queryClient.invalidateQueries({ queryKey: ["source-catalog"] });
      toast.success(value ? "Origem ativada na plataforma" : "Origem desativada na plataforma");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{entry.display_name}</h3>
              <Badge variant={entry.is_enabled ? "default" : "outline"}>
                {entry.is_enabled ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Chave: <code className="text-[11px]">{entry.source_key}</code>
            </p>
            {entry.description && (
              <p className="text-sm text-muted-foreground mt-2">{entry.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div>
            <Label className="text-sm">Disponível na plataforma</Label>
            <p className="text-xs text-muted-foreground">
              Quando desativada, a origem some do menu de todas as marcas.
            </p>
          </div>
          <Switch checked={entry.is_enabled} onCheckedChange={handleToggle} />
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={onEditar}>
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ModalEditarOrigem({
  entry, open, onClose,
}: {
  entry: SourceCatalogEntry | null; open: boolean; onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState(entry?.display_name || "");
  const [description, setDescription] = useState(entry?.description || "");
  const [icon, setIcon] = useState(entry?.icon || "");
  const [saving, setSaving] = useState(false);

  // Sync state quando o entry muda
  useState(() => {
    setDisplayName(entry?.display_name || "");
    setDescription(entry?.description || "");
    setIcon(entry?.icon || "");
  });

  if (!entry) return null;

  const handleSalvar = async () => {
    setSaving(true);
    try {
      await updateSourceCatalogEntry(entry.id, {
        display_name: displayName.trim(),
        description: description.trim() || null,
        icon: icon.trim() || null,
      });
      queryClient.invalidateQueries({ queryKey: ["source-catalog"] });
      toast.success("Origem atualizada");
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar origem</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome de exibição</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Texto curto exibido nos painéis."
            />
          </div>
          <div className="space-y-2">
            <Label>Ícone (Lucide)</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Sparkles, Link2..."
            />
            <p className="text-xs text-muted-foreground">
              Nome do ícone do pacote Lucide. Deixe vazio para usar o padrão.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PaginaAdminOrigens() {
  const { data: catalog, isLoading } = useQuery({
    queryKey: ["source-catalog"],
    queryFn: () => fetchSourceCatalog(),
  });

  const [editando, setEditando] = useState<SourceCatalogEntry | null>(null);

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Origens da Plataforma"
        description="Catálogo global de origens de sincronização. Define o que cada marca pode usar."
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Como funciona</AlertTitle>
        <AlertDescription className="text-sm">
          Cada origem listada aqui possui um <strong>scraper específico programado no backend</strong> (ex: Divulga Link, Divulgador Inteligente).
          Você pode <strong>ligar ou desligar</strong> uma origem inteira para todas as marcas, ou editar o nome de exibição.
          Para adicionar um <strong>site totalmente novo</strong> (ex: Awin, Lomadee, outro agregador), é preciso solicitar à equipe técnica
          o desenvolvimento do scraper correspondente — não é possível cadastrar pela tela.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 rounded-xl" />
          <Skeleton className="h-44 rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(catalog || []).map((entry) => (
            <CardOrigem key={entry.id} entry={entry} onEditar={() => setEditando(entry)} />
          ))}
        </div>
      )}

      <ModalEditarOrigem
        entry={editando}
        open={!!editando}
        onClose={() => setEditando(null)}
      />
    </div>
  );
}