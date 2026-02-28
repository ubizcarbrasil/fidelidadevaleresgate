import { useEffect, useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Ticket, MapPin, Clock, Percent, Loader2, Gift } from "lucide-react";
import HomeSectionsRenderer from "@/components/HomeSectionsRenderer";

type Voucher = Tables<"vouchers">;

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function PublicVouchers() {
  const { brand, branches, selectedBranch, theme, loading: brandLoading } = useBrand();

  if (brandLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!brand) return null;

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const bg = hslToCss(theme?.colors?.background, "hsl(var(--background))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const muted = hslToCss(theme?.colors?.muted, "hsl(var(--muted))");
  const cardBg = hslToCss(theme?.colors?.card, "hsl(var(--card))");
  const accent = hslToCss(theme?.colors?.accent, "hsl(var(--accent))");

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme?.font_body ? `"${theme.font_body}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand.name;

  return (
    <div className="min-h-screen" style={{ backgroundColor: bg, color: fg, fontFamily: fontBody }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-md"
        style={{ backgroundColor: primary, color: "#fff" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {theme?.logo_url ? (
              <img
                src={theme.logo_url}
                alt={displayName}
                className="h-8 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            ) : (
              <Ticket className="h-6 w-6" />
            )}
            <span className="font-bold text-lg" style={{ fontFamily: fontHeading }}>
              {displayName}
            </span>
          </div>
          {selectedBranch && (
            <div className="flex items-center gap-1.5 text-sm opacity-80">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">{selectedBranch.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section
        className="py-12 sm:py-16 text-center"
        style={{
          backgroundImage: theme?.background_image_url
            ? `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${theme.background_image_url})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: theme?.background_image_url ? "#fff" : fg,
        }}
      >
        <div className="max-w-2xl mx-auto px-4">
          <Gift className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: fontHeading }}>
            {theme?.slogan || "Ofertas exclusivas para você"}
          </h1>
          <p className="text-base opacity-70">
            Confira os vouchers de desconto disponíveis e aproveite!
          </p>
        </div>
      </section>

      {/* Dynamic Sections */}
      <HomeSectionsRenderer />

      {/* Fallback: Vouchers list (when no sections configured) */}
      <FallbackVouchers
        selectedBranch={selectedBranch}
        primary={primary}
        fg={fg}
        cardBg={cardBg}
        accent={accent}
        fontHeading={fontHeading}
      />

      {/* Footer */}
      {theme?.footer_text && (
        <footer
          className="text-center py-4 text-xs opacity-50 border-t"
          style={{ borderColor: `${fg}10` }}
        >
          {theme.footer_text}
        </footer>
      )}
    </div>
  );
}

function FallbackVouchers({ selectedBranch, primary, fg, cardBg, accent, fontHeading }: {
  selectedBranch: any; primary: string; fg: string; cardBg: string; accent: string; fontHeading: string;
}) {
  const [vouchers, setVouchers] = useState<Tables<"vouchers">[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSections, setHasSections] = useState(true);

  useEffect(() => {
    if (!selectedBranch) { setLoading(false); return; }
    const fetch = async () => {
      // Check if brand has sections configured
      const { data: sections } = await supabase
        .from("brand_sections")
        .select("id")
        .eq("is_enabled", true)
        .limit(1);
      if (sections && sections.length > 0) {
        setHasSections(true);
        setLoading(false);
        return;
      }
      setHasSections(false);
      const { data } = await supabase
        .from("vouchers")
        .select("*")
        .eq("branch_id", selectedBranch.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      setVouchers(data || []);
      setLoading(false);
    };
    fetch();
  }, [selectedBranch]);

  if (hasSections || loading) return null;
  if (vouchers.length === 0) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 text-center py-16 opacity-60">
        <Ticket className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="text-lg font-medium" style={{ fontFamily: fontHeading }}>Nenhum voucher disponível</p>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid gap-4 sm:grid-cols-2">
        {vouchers.map((v) => (
          <div key={v.id} className="rounded-xl border overflow-hidden transition-shadow hover:shadow-lg" style={{ backgroundColor: cardBg, borderColor: `${fg}15` }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: accent }}>
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5" style={{ color: primary }} />
                <span className="font-bold text-lg" style={{ color: primary, fontFamily: fontHeading }}>{v.discount_percent}% OFF</span>
              </div>
              {v.campaign && <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: primary, color: "#fff" }}>{v.campaign}</span>}
            </div>
            <div className="px-5 py-4">
              <h3 className="font-semibold text-base mb-1" style={{ fontFamily: fontHeading }}>{v.title}</h3>
              {v.description && <p className="text-sm opacity-60 mb-3">{v.description}</p>}
              <div className="flex items-center justify-between text-xs opacity-50">
                {v.expires_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Válido até {new Date(v.expires_at).toLocaleDateString("pt-BR")}
                  </div>
                )}
                <div className="font-mono tracking-wider opacity-70" style={{ color: primary }}>{v.code}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
