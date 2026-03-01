import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Pencil, Loader2, Link2, ExternalLink, Globe, GripVertical } from "lucide-react";

interface ManualLink {
  id: string;
  brand_section_id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string;
  link_mode: string;
  badge_text: string | null;
  order_index: number;
  is_active: boolean;
}

interface Props {
  section: { id: string; title: string | null };
  onBack: () => void;
}

const EMPTY_LINK = {
  title: "",
  subtitle: "",
  image_url: "",
  link_url: "",
  link_mode: "REDIRECT",
  badge_text: "",
};

export default function ManualLinksEditor({ section, onBack }: Props) {
  const [links, setLinks] = useState<ManualLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<ManualLink | null>(null);
  const [form, setForm] = useState(EMPTY_LINK);
  const [saving, setSaving] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("manual_link_items" as any)
      .select("*")
      .eq("brand_section_id", section.id)
      .order("order_index");
    setLinks((data as any[]) || []);
    setLoading(false);
  }, [section.id]);

  useEffect(() => { fetchLinks(); }, [fetchLinks]);

  const handleSave = async () => {
    if (!form.title.trim() || !form.link_url.trim()) return;
    setSaving(true);

    if (editingLink) {
      await supabase.from("manual_link_items" as any).update({
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        image_url: form.image_url.trim() || null,
        link_url: form.link_url.trim(),
        link_mode: form.link_mode,
        badge_text: form.badge_text.trim() || null,
      }).eq("id", editingLink.id);
      toast({ title: "Link atualizado!" });
    } else {
      const maxOrder = links.length > 0 ? Math.max(...links.map(l => l.order_index)) + 1 : 0;
      await supabase.from("manual_link_items" as any).insert({
        brand_section_id: section.id,
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        image_url: form.image_url.trim() || null,
        link_url: form.link_url.trim(),
        link_mode: form.link_mode,
        badge_text: form.badge_text.trim() || null,
        order_index: maxOrder,
      });
      toast({ title: "Link adicionado!" });
    }

    setShowForm(false);
    setEditingLink(null);
    setForm(EMPTY_LINK);
    fetchLinks();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este link?")) return;
    await supabase.from("manual_link_items" as any).delete().eq("id", id);
    toast({ title: "Link removido" });
    fetchLinks();
  };

  const handleEdit = (link: ManualLink) => {
    setEditingLink(link);
    setForm({
      title: link.title,
      subtitle: link.subtitle || "",
      image_url: link.image_url || "",
      link_url: link.link_url,
      link_mode: link.link_mode,
      badge_text: link.badge_text || "",
    });
    setShowForm(true);
  };

  const handleMove = async (idx: number, direction: "up" | "down") => {
    const newLinks = [...links];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newLinks.length) return;
    const tempOrder = newLinks[idx].order_index;
    newLinks[idx].order_index = newLinks[targetIdx].order_index;
    newLinks[targetIdx].order_index = tempOrder;
    await Promise.all([
      supabase.from("manual_link_items" as any).update({ order_index: newLinks[idx].order_index }).eq("id", newLinks[idx].id),
      supabase.from("manual_link_items" as any).update({ order_index: newLinks[targetIdx].order_index }).eq("id", newLinks[targetIdx].id),
    ]);
    fetchLinks();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Links Manuais</h1>
          <p className="text-xs text-muted-foreground">{section.title || "Sessão de Links"}</p>
        </div>
        <Button size="sm" onClick={() => { setEditingLink(null); setForm(EMPTY_LINK); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Novo Link
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum link manual</p>
          <p className="text-sm mb-4">Crie cards com imagem e link para esta sessão.</p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" /> Criar Link
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link, idx) => (
            <div key={link.id} className={`flex items-center gap-3 p-3 rounded-xl border bg-card ${!link.is_active ? "opacity-50" : ""}`}>
              <div className="flex flex-col gap-0.5">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(idx, "up")} disabled={idx === 0}>
                  <span className="text-[10px]">▲</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(idx, "down")} disabled={idx === links.length - 1}>
                  <span className="text-[10px]">▼</span>
                </Button>
              </div>

              {link.image_url && (
                <img src={link.image_url} alt={link.title} className="h-12 w-12 rounded-lg object-cover shrink-0" />
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{link.title}</h4>
                  {link.badge_text && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">{link.badge_text}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  {link.link_mode === "WEBVIEW" ? <Globe className="h-3 w-3" /> : <ExternalLink className="h-3 w-3" />}
                  <span>{link.link_mode}</span>
                  <span className="truncate">· {link.link_url}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(link)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(link.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLink ? "Editar Link" : "Novo Link Manual"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Site do Parceiro" />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Opcional" />
            </div>
            <div>
              <Label>URL da imagem</Label>
              <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              {form.image_url && (
                <img src={form.image_url} alt="Preview" className="mt-2 h-16 w-16 rounded-lg object-cover" />
              )}
            </div>
            <div>
              <Label>URL do link *</Label>
              <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Modo de abertura</Label>
              <Select value={form.link_mode} onValueChange={v => setForm(f => ({ ...f, link_mode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="REDIRECT">Redirect (abre fora do app)</SelectItem>
                  <SelectItem value="WEBVIEW">WebView (abre dentro do app)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Badge (opcional)</Label>
              <Input value={form.badge_text} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))} placeholder='Ex: "NOVO", "R$10"' />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.title.trim() || !form.link_url.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingLink ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
