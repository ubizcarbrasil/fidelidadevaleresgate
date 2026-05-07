import { Copy, ExternalLink, Share2, Link2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useLinkPublicoOfertas } from "../hooks/hook_link_publico_ofertas";

interface Props {
  brandId?: string;
  titulo?: string;
}

export default function LinkPublicoOfertas({ brandId, titulo }: Props) {
  const { url, carregando } = useLinkPublicoOfertas(brandId);

  const copiar = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const abrir = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const compartilhar = async () => {
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo || "Ubiz Ofertas", url });
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    }
    copiar();
  };

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-primary" />
        <Label className="text-xs font-semibold">Link público da vitrine</Label>
      </div>

      <div className="flex gap-2">
        <Input
          readOnly
          value={carregando ? "Resolvendo domínio..." : url || "—"}
          className="h-9 font-mono text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={copiar}
          disabled={!url}
          title="Copiar"
        >
          {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={abrir}
          disabled={!url}
          title="Abrir"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={compartilhar}
          disabled={!url}
          title="Compartilhar"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Use este link para divulgar a vitrine pública. Funciona sem login, sem pontos e sem WhatsApp.
      </p>

      <details className="text-[11px] text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground/80 hover:text-foreground">
          Como configurar (passo a passo)
        </summary>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Ative o toggle <strong>Ubiz Ofertas (vitrine pública)</strong> acima.</li>
          <li>Defina o <strong>título exibido na vitrine</strong> (opcional).</li>
          <li>Salve as alterações da marca.</li>
          <li>Copie o link acima e divulgue para seus clientes.</li>
        </ol>
        <p className="mt-2">
          As ofertas exibidas são as mesmas dos Achadinhos (cadastradas em <em>Ofertas Afiliadas</em>),
          porém sem pontuação, duelos, campeonato ou compra de pontos.
        </p>
      </details>
    </div>
  );
}