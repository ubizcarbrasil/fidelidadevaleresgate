import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Image as ImageIcon, MessageSquareQuote } from "lucide-react";
import ImageUploadField from "@/components/ImageUploadField";
import type {
  ProdutoComercialDraft,
  LandingScreenshot,
  LandingTestimonial,
} from "../types/tipos_produto";

interface Props {
  draft: ProdutoComercialDraft;
  onChange: (patch: Partial<ProdutoComercialDraft>) => void;
}

const MAX_SCREENSHOTS = 6;
const MAX_TESTIMONIALS = 6;

export default function PassoLandingProvas({ draft, onChange }: Props) {
  const lc = draft.landing_config_json;
  const screenshots = lc.screenshots ?? [];
  const testimonials = lc.testimonials ?? [];

  const updateScreenshots = (next: LandingScreenshot[]) =>
    onChange({ landing_config_json: { ...lc, screenshots: next } });
  const updateTestimonials = (next: LandingTestimonial[]) =>
    onChange({ landing_config_json: { ...lc, testimonials: next } });

  return (
    <div className="space-y-8">
      {/* Screenshots */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4" /> Screenshots do produto
            </h3>
            <p className="text-xs text-muted-foreground">
              Até {MAX_SCREENSHOTS} imagens com legenda — aparecem em carrossel na landing.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={screenshots.length >= MAX_SCREENSHOTS}
            onClick={() => updateScreenshots([...screenshots, { url: "", caption: "" }])}
          >
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>

        {screenshots.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum screenshot ainda.</p>
        ) : (
          <div className="space-y-3">
            {screenshots.map((s, i) => (
              <Card key={i}>
                <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Imagem</Label>
                    <ImageUploadField
                      value={s.url}
                      onChange={(url) => {
                        const next = [...screenshots];
                        next[i] = { ...s, url };
                        updateScreenshots(next);
                      }}
                      folder="product-landings"
                      label="Screenshot"
                      previewClassName="h-24 object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Legenda</Label>
                    <Input
                      value={s.caption ?? ""}
                      onChange={(e) => {
                        const next = [...screenshots];
                        next[i] = { ...s, caption: e.target.value };
                        updateScreenshots(next);
                      }}
                      placeholder="Painel de duelos em tempo real"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => updateScreenshots(screenshots.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remover
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" /> Depoimentos
            </h3>
            <p className="text-xs text-muted-foreground">
              Até {MAX_TESTIMONIALS} depoimentos — aparecem em grid na landing.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={testimonials.length >= MAX_TESTIMONIALS}
            onClick={() =>
              updateTestimonials([
                ...testimonials,
                { name: "", role: "", quote: "", avatar_url: "" },
              ])
            }
          >
            <Plus className="h-3 w-3 mr-1" /> Adicionar
          </Button>
        </div>

        {testimonials.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Nenhum depoimento ainda.</p>
        ) : (
          <div className="space-y-3">
            {testimonials.map((t, i) => (
              <Card key={i}>
                <CardContent className="pt-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Nome *</Label>
                      <Input
                        value={t.name}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[i] = { ...t, name: e.target.value };
                          updateTestimonials(next);
                        }}
                        placeholder="João Silva"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo / Cidade</Label>
                      <Input
                        value={t.role ?? ""}
                        onChange={(e) => {
                          const next = [...testimonials];
                          next[i] = { ...t, role: e.target.value };
                          updateTestimonials(next);
                        }}
                        placeholder="Motorista, Curitiba"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Depoimento *</Label>
                    <Textarea
                      rows={2}
                      value={t.quote}
                      onChange={(e) => {
                        const next = [...testimonials];
                        next[i] = { ...t, quote: e.target.value };
                        updateTestimonials(next);
                      }}
                      placeholder="Em 1 mês já resgatei mais de R$ 200 em ofertas..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Avatar (opcional)</Label>
                    <ImageUploadField
                      value={t.avatar_url ?? ""}
                      onChange={(url) => {
                        const next = [...testimonials];
                        next[i] = { ...t, avatar_url: url };
                        updateTestimonials(next);
                      }}
                      folder="product-landings"
                      label="Avatar"
                      previewClassName="h-16 w-16 object-cover rounded-full"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => updateTestimonials(testimonials.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover depoimento
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
