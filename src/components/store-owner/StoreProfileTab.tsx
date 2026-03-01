import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Image as ImageIcon, Video, Globe, Instagram, MapPin, MessageCircle, Tag } from "lucide-react";
import { toast } from "sonner";
import SegmentAutocomplete from "@/components/SegmentAutocomplete";

export default function StoreProfileTab({ store }: { store: any }) {
  const [form, setForm] = useState({
    description: store.description || "",
    segment: store.segment || "",
    taxonomy_segment_id: store.taxonomy_segment_id || "",
    banner_url: store.banner_url || "",
    video_url: store.video_url || "",
    gallery_urls: (store.gallery_urls || []) as string[],
    site_url: store.site_url || "",
    instagram: store.instagram || "",
    whatsapp: store.whatsapp || "",
    address: store.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        description: form.description,
        segment: form.segment || null,
        taxonomy_segment_id: form.taxonomy_segment_id || null,
        banner_url: form.banner_url || null,
        video_url: form.video_url || null,
        gallery_urls: form.gallery_urls.length ? form.gallery_urls : null,
        site_url: form.site_url || null,
        instagram: form.instagram || null,
        whatsapp: form.whatsapp || null,
        address: form.address || null,
      })
      .eq("id", store.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Perfil atualizado!");
    }
  };

  const addGalleryUrl = () => {
    if (newGalleryUrl.trim() && form.gallery_urls.length < 10) {
      setForm(prev => ({ ...prev, gallery_urls: [...prev.gallery_urls, newGalleryUrl.trim()] }));
      setNewGalleryUrl("");
    }
  };

  const removeGalleryUrl = (index: number) => {
    setForm(prev => ({ ...prev, gallery_urls: prev.gallery_urls.filter((_, i) => i !== index) }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Configure o perfil público do seu estabelecimento</p>
      </div>

      {/* Descrição */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Descrição do Estabelecimento</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Descreva seu estabelecimento, produtos e diferenciais..."
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Segmento */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" /> Segmento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SegmentAutocomplete
            value={form.taxonomy_segment_id || null}
            segmentName={form.segment}
            onSelect={(segId, segName) => {
              setForm(prev => ({ ...prev, taxonomy_segment_id: segId || "", segment: segName }));
            }}
            storeId={store.id}
            placeholder="Digite para buscar... Ex: Hamburgueria"
          />
          <p className="text-[11px] text-muted-foreground mt-2">
            O segmento ajuda seus clientes a encontrar seu estabelecimento mais facilmente
          </p>
        </CardContent>
      </Card>

      {/* Imagens */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Imagens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Banner (URL)</Label>
            <Input
              placeholder="https://..."
              value={form.banner_url}
              onChange={e => setForm(prev => ({ ...prev, banner_url: e.target.value }))}
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Galeria de Imagens ({form.gallery_urls.length}/10)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="URL da imagem"
                value={newGalleryUrl}
                onChange={e => setNewGalleryUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addGalleryUrl()}
              />
              <Button variant="outline" onClick={addGalleryUrl} disabled={form.gallery_urls.length >= 10}>
                Adicionar
              </Button>
            </div>
            {form.gallery_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {form.gallery_urls.map((url, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryUrl(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vídeo */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Video className="h-4 w-4" /> Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="URL do vídeo (YouTube, Vimeo...)"
            value={form.video_url}
            onChange={e => setForm(prev => ({ ...prev, video_url: e.target.value }))}
          />
        </CardContent>
      </Card>

      {/* Links e Contato */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Links e Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Globe className="h-3 w-3" /> Site
              </Label>
              <Input
                placeholder="https://meusite.com"
                value={form.site_url}
                onChange={e => setForm(prev => ({ ...prev, site_url: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Instagram className="h-3 w-3" /> Instagram
              </Label>
              <Input
                placeholder="@meuinsta"
                value={form.instagram}
                onChange={e => setForm(prev => ({ ...prev, instagram: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </Label>
              <Input
                placeholder="5511999999999"
                value={form.whatsapp}
                onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <MapPin className="h-3 w-3" /> Endereço
              </Label>
              <Input
                placeholder="Rua, número, bairro, cidade"
                value={form.address}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Perfil
      </Button>
    </div>
  );
}
