import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MapPin, Ticket } from "lucide-react";
import type { BrandTheme } from "@/hooks/useBrandTheme";

interface BrandThemePreviewProps {
  theme: BrandTheme;
  brandName: string;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function BrandThemePreview({ theme, brandName }: BrandThemePreviewProps) {
  const primary = hslToCss(theme.colors?.primary, "hsl(222 47% 31%)");
  const secondary = hslToCss(theme.colors?.secondary, "hsl(217 33% 17%)");
  const accent = hslToCss(theme.colors?.accent, "hsl(210 40% 96%)");
  const bg = hslToCss(theme.colors?.background, "hsl(0 0% 100%)");
  const fg = hslToCss(theme.colors?.foreground, "hsl(222 47% 11%)");
  const muted = hslToCss(theme.colors?.muted, "hsl(210 40% 96%)");
  const cardBg = hslToCss(theme.colors?.card, "hsl(0 0% 100%)");

  const fontHeading = theme.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme.font_body ? `"${theme.font_body}", sans-serif` : "inherit";

  const displayName = theme.display_name || brandName || "Minha Marca";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" /> Preview do Cliente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="rounded-lg border overflow-hidden text-sm"
          style={{
            backgroundColor: bg,
            color: fg,
            fontFamily: fontBody,
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ backgroundColor: primary, color: "#fff" }}
          >
            <div className="flex items-center gap-2">
              {theme.logo_url ? (
                <img
                  src={theme.logo_url}
                  alt={displayName}
                  className="h-8 w-8 rounded-xl object-contain"
                  style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}
                />
              ) : (
                <Ticket className="h-5 w-5" />
              )}
              <span className="font-semibold text-sm" style={{ fontFamily: fontHeading }}>
                {displayName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs opacity-80">
              <MapPin className="h-3 w-3" />
              Filial Centro
            </div>
          </div>

          {/* Hero / Content */}
          <div
            className="px-4 py-6 text-center"
            style={{
              backgroundImage: theme.background_image_url
                ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${theme.background_image_url})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              color: theme.background_image_url ? "#fff" : fg,
            }}
          >
            <h2
              className="text-lg font-bold mb-1"
              style={{ fontFamily: fontHeading }}
            >
              {theme.slogan || "Bem-vindo ao Vale Resgate"}
            </h2>
            <p className="text-xs opacity-70 mb-4">
              Resgate seus vouchers de desconto exclusivos
            </p>
            <div
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium"
              style={{ backgroundColor: primary, color: "#fff" }}
            >
              <Ticket className="h-3.5 w-3.5" />
              Resgatar Voucher
            </div>
          </div>

          {/* Sample voucher cards */}
          <div className="px-4 py-4 space-y-2" style={{ backgroundColor: muted }}>
            <p className="text-xs font-medium opacity-60 uppercase tracking-wide" style={{ fontFamily: fontHeading }}>
              Ofertas disponíveis
            </p>
            {[
              { title: "15% de desconto", desc: "Em qualquer produto" },
              { title: "Frete grátis", desc: "Pedidos acima de R$100" },
            ].map((v, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md px-3 py-2.5 border"
                style={{ backgroundColor: cardBg, borderColor: `${fg}15` }}
              >
                <div>
                  <div className="font-medium text-xs" style={{ fontFamily: fontHeading }}>
                    {v.title}
                  </div>
                  <div className="text-[10px] opacity-50">{v.desc}</div>
                </div>
                <div
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: accent, color: primary }}
                >
                  Ativo
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          {theme.footer_text && (
            <div
              className="px-4 py-2 text-center text-[10px] opacity-50 border-t"
              style={{ borderColor: `${fg}10` }}
            >
              {theme.footer_text}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
