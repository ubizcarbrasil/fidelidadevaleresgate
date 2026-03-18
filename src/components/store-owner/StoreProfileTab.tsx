import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, Save, Image as ImageIcon, Video, Globe, Instagram,
  MapPin, MessageCircle, Tag, HelpCircle, Coins, Plus, Trash2,
  Lock, Store, Mail, Phone, Camera, X,
} from "lucide-react";
import { toast } from "sonner";
import SegmentAutocomplete from "@/components/SegmentAutocomplete";
import OperatingHoursEditor, { type DayHours } from "./OperatingHoursEditor";
import ImageUploadField from "@/components/ImageUploadField";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";

interface FaqItem {
  question: string;
  answer: string;
}

export default function StoreProfileTab({ store, onOpenWizard }: { store: any; onOpenWizard?: (stepIdx?: number) => void }) {
  const [form, setForm] = useState({
    name: store.name || "",
    email: store.email || "",
    phone: store.phone || "",
    description: store.description || "",
    segment: store.segment || "",
    taxonomy_segment_id: store.taxonomy_segment_id || "",
    logo_url: store.logo_url || "",
    banner_url: store.banner_url || "",
    video_url: store.video_url || "",
    gallery_urls: (store.gallery_urls || []) as string[],
    site_url: store.site_url || "",
    instagram: store.instagram || "",
    whatsapp: store.whatsapp || "",
    address: store.address || "",
    points_rule_text: store.points_rule_text || "",
    points_deadline_text: store.points_deadline_text || "",
    faq_json: (store.faq_json || []) as FaqItem[],
    operating_hours_json: (store.operating_hours_json || []) as DayHours[],
    tags: (store.tags || []) as string[],
  });
  const [saving, setSaving] = useState(false);
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string }[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Fetch sibling segments for dynamic tags when segment changes
  useEffect(() => {
    if (!form.taxonomy_segment_id) {
      setAvailableTags([]);
      return;
    }
    const fetchSiblings = async () => {
      setLoadingTags(true);
      // Get the category of the selected segment
      const { data: seg } = await supabase
        .from("taxonomy_segments")
        .select("category_id")
        .eq("id", form.taxonomy_segment_id)
        .maybeSingle();

      if (seg?.category_id) {
        // Get all segments in the same category
        const { data: siblings } = await supabase
          .from("taxonomy_segments")
          .select("id, name")
          .eq("category_id", seg.category_id)
          .neq("id", form.taxonomy_segment_id)
          .order("name");
        setAvailableTags(siblings || []);
      }
      setLoadingTags(false);
    };
    fetchSiblings();
  }, [form.taxonomy_segment_id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        description: form.description,
        segment: form.segment || null,
        taxonomy_segment_id: form.taxonomy_segment_id || null,
        logo_url: form.logo_url || null,
        banner_url: form.banner_url || null,
        video_url: form.video_url || null,
        gallery_urls: form.gallery_urls.length ? form.gallery_urls : null,
        site_url: form.site_url || null,
        instagram: form.instagram || null,
        whatsapp: form.whatsapp || null,
        address: form.address || null,
        points_rule_text: form.points_rule_text || null,
        points_deadline_text: form.points_deadline_text || null,
        faq_json: form.faq_json as any,
        operating_hours_json: form.operating_hours_json.length ? form.operating_hours_json as any : null,
        tags: form.tags.length ? form.tags : null,
      })
      .eq("id", store.id);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Perfil atualizado!");
    }
  };

  const toggleTag = (tagName: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName],
    }));
  };

  const addGalleryImage = (url: string) => {
    if (url && form.gallery_urls.length < 10) {
      setForm(prev => ({ ...prev, gallery_urls: [...prev.gallery_urls, url] }));
    }
  };

  const removeGalleryImage = (index: number) => {
    setForm(prev => ({ ...prev, gallery_urls: prev.gallery_urls.filter((_, i) => i !== index) }));
  };

  const addFaqItem = () => {
    setForm(prev => ({ ...prev, faq_json: [...prev.faq_json, { question: "", answer: "" }] }));
  };

  const updateFaqItem = (index: number, field: "question" | "answer", value: string) => {
    setForm(prev => ({
      ...prev,
      faq_json: prev.faq_json.map((item, i) => i === index ? { ...item, [field]: value } : item),
    }));
  };

  const removeFaqItem = (index: number) => {
    setForm(prev => ({ ...prev, faq_json: prev.faq_json.filter((_, i) => i !== index) }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-sm text-muted-foreground">Configure o perfil público do seu estabelecimento</p>
        </div>
      </div>

      {/* Logomarca */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" /> Logomarca
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {form.logo_url && (
            <div className="relative">
              <img
                src={form.logo_url}
                alt="Logo"
                className="h-20 w-20 rounded-full object-cover border-2 border-input shadow-sm"
              />
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, logo_url: "" }))}
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <ImageUploadField
            value={form.logo_url}
            onChange={(url) => setForm(prev => ({ ...prev, logo_url: url }))}
            folder={`stores/${store.id}/logo`}
            label="Logo"
            aspectRatio={1}
            previewClassName="hidden"
          />
        </CardContent>
      </Card>

      {/* Dados do Estabelecimento */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4" /> Dados do Estabelecimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome</Label>
            <Input
              placeholder="Nome do estabelecimento"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Mail className="h-3 w-3" /> E-mail
              </Label>
              <Input
                type="email"
                placeholder="contato@loja.com"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telefone
              </Label>
              <Input
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição</Label>
            <Textarea
              placeholder="Descreva seu estabelecimento, produtos e diferenciais..."
              value={form.description}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Banner */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Banner
          </CardTitle>
        </CardHeader>
        <CardContent>
          {form.banner_url && (
            <div className="relative mb-3 rounded-xl overflow-hidden border">
              <img
                src={form.banner_url}
                alt="Banner"
                className="w-full aspect-[16/9] object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-md"
                onClick={() => setForm(prev => ({ ...prev, banner_url: "" }))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          <ImageUploadField
            value={form.banner_url}
            onChange={(url) => setForm(prev => ({ ...prev, banner_url: url }))}
            folder={`stores/${store.id}/banner`}
            label="Banner"
            aspectRatio={16 / 9}
            previewClassName="hidden"
          />
        </CardContent>
      </Card>

      {/* Galeria de Fotos */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Galeria de Fotos ({form.gallery_urls.length}/10)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {form.gallery_urls.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {form.gallery_urls.map((url, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border aspect-square">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.gallery_urls.length < 10 && (
            <GalleryUploadButton
              storeId={store.id}
              onUploaded={addGalleryImage}
            />
          )}
        </CardContent>
      </Card>

      {/* Segmento e Tags */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" /> Segmento e Produtos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Segmento principal</Label>
            <SegmentAutocomplete
              value={form.taxonomy_segment_id || null}
              segmentName={form.segment}
              onSelect={(segId, segName) => {
                setForm(prev => ({ ...prev, taxonomy_segment_id: segId || "", segment: segName, tags: [] }));
              }}
              storeId={store.id}
              placeholder="Digite para buscar... Ex: Hamburgueria"
            />
          </div>
          {form.taxonomy_segment_id && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Quais tipos de produto você vende?
              </Label>
              {loadingTags ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                </div>
              ) : availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const selected = form.tags.includes(tag.name);
                    return (
                      <Badge
                        key={tag.id}
                        variant={selected ? "default" : "outline"}
                        className={`cursor-pointer transition-all text-xs ${
                          selected
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-accent"
                        }`}
                        onClick={() => toggleTag(tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma tag disponível para esta categoria</p>
              )}
            </div>
          )}
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

      {/* Regras de Pontuação */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Coins className="h-4 w-4" /> Regras de Pontuação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Regra (como o cliente acumula pontos)</Label>
            <Input
              placeholder="Ex: Faça suas compras no site e acumule pontos automaticamente"
              value={form.points_rule_text}
              onChange={e => setForm(prev => ({ ...prev, points_rule_text: e.target.value }))}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Prazo de creditação</Label>
            <Input
              placeholder="Ex: Pontos creditados em até 30 dias após a compra"
              value={form.points_deadline_text}
              onChange={e => setForm(prev => ({ ...prev, points_deadline_text: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Dúvidas Frequentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {form.faq_json.map((faq, idx) => (
            <div key={idx} className="rounded-xl border p-3 space-y-2 relative">
              <button
                onClick={() => removeFaqItem(idx)}
                className="absolute top-2 right-2 h-6 w-6 rounded-full flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <Input
                placeholder="Pergunta"
                value={faq.question}
                onChange={e => updateFaqItem(idx, "question", e.target.value)}
              />
              <Textarea
                placeholder="Resposta"
                value={faq.answer}
                onChange={e => updateFaqItem(idx, "answer", e.target.value)}
                rows={2}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addFaqItem} className="w-full">
            <Plus className="h-4 w-4 mr-1" /> Adicionar pergunta
          </Button>
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

      {/* Horário de Funcionamento */}
      <OperatingHoursEditor
        value={form.operating_hours_json}
        onChange={(hours) => setForm(prev => ({ ...prev, operating_hours_json: hours }))}
      />

      {/* Alterar Senha */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordDialog
            trigger={
              <Button variant="outline" className="w-full gap-2">
                <Lock className="h-4 w-4" /> Alterar Senha
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Salvar Perfil
      </Button>
    </div>
  );
}

/** Inline gallery upload — uses ImageUploadField internally but adds to the gallery array */
function GalleryUploadButton({ storeId, onUploaded }: { storeId: string; onUploaded: (url: string) => void }) {
  const [tempUrl, setTempUrl] = useState("");

  const handleChange = (url: string) => {
    if (url) {
      onUploaded(url);
      setTempUrl("");
    }
  };

  return (
    <ImageUploadField
      value={tempUrl}
      onChange={handleChange}
      folder={`stores/${storeId}/gallery`}
      label="Foto"
      aspectRatio={1}
      previewClassName="hidden"
    />
  );
}
