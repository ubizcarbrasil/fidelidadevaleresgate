import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, MapPin, Bell, Search, Wallet, House, Tag, Ticket, CircleUser,
  Coins, Percent, Store, Gift, Sparkles, ChevronRight, Heart, Star,
  Shield, CircleHelp, LogOut, Moon, ArrowUpRight, ArrowDownRight, Sun,
  TicketCheck,
} from "lucide-react";
import type { BrandTheme } from "@/hooks/useBrandTheme";

interface Props {
  theme: BrandTheme;
  brandName: string;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function parseHsl(hsl: string | undefined, fallback: string) {
  const raw = hsl || fallback;
  const parts = raw.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  return { h: parts[0] || "250", s: parts[1] || "65%", l: parts[2] || "55%" };
}

function hslAlpha(p: { h: string; s: string; l: string }, a: number) {
  return `hsla(${p.h}, ${p.s}, ${p.l}, ${a})`;
}

type Screen = "home" | "offers" | "redemptions" | "wallet" | "profile";

const VB_GOLD = "#D4A017";
const VB_GOLD_HSL = "hsl(45, 80%, 45%)";

const DARK_DEFAULTS = {
  background: "222 47% 7%",
  foreground: "0 0% 100%",
  card: "222 47% 11%",
  muted: "222 47% 15%",
  accent: "45 100% 55%",
};

function resolveColors(theme: BrandTheme, isDark: boolean) {
  if (!isDark) {
    const colors = theme.colors || {};
    return {
      accent: hslToCss(colors.secondary, "") || hslToCss(colors.primary, "hsl(220 70% 50%)"),
      accentParsed: parseHsl(colors.secondary || colors.primary, "220 70% 50%"),
      bg: hslToCss(colors.background, "hsl(0 0% 100%)"),
      fg: hslToCss(colors.foreground, "hsl(222 47% 11%)"),
      muted: hslToCss(colors.muted, "hsl(210 40% 96%)"),
      cardBg: hslToCss(colors.card, "hsl(0 0% 100%)"),
    };
  }
  // Dark: merge defaults + accent colors only (exclude light structural colors)
  const { background: _bg, foreground: _fg, card: _card, muted: _mut, ...colorAccents } = (theme.colors || {});
  const merged = { ...DARK_DEFAULTS, ...colorAccents, ...theme.dark_colors };
  return {
    accent: hslToCss(merged.secondary, "") || hslToCss(merged.primary, "hsl(220 70% 50%)"),
    accentParsed: parseHsl(merged.secondary || merged.primary, "220 70% 50%"),
    bg: hslToCss(merged.background, "hsl(222 47% 7%)"),
    fg: hslToCss(merged.foreground, "hsl(0 0% 100%)"),
    muted: hslToCss(merged.muted, "hsl(222 47% 15%)"),
    cardBg: hslToCss(merged.card, "hsl(222 47% 11%)"),
  };
}

export default function BrandThemePreview({ theme, brandName }: Props) {
  const [screen, setScreen] = useState<Screen>("home");
  const [previewDark, setPreviewDark] = useState(false);

  const { accent, accentParsed, bg, fg, muted, cardBg } = resolveColors(theme, previewDark);
  const fontHeading = theme.font_heading ? `"${theme.font_heading}", sans-serif` : "system-ui, sans-serif";
  const fontBody = theme.font_body ? `"${theme.font_body}", sans-serif` : "system-ui, sans-serif";
  const displayName = theme.display_name || brandName || "Minha Marca";

  // Layout config with defaults
  const layout = theme.layout || {};
  const cardRadius = layout.card_border_radius ?? 12;
  const cardImgH = layout.card_image_height ?? 140;
  const iconSize = layout.category_icon_size ?? 64;
  const iconRadius = layout.category_icon_radius ?? 16;
  const catFontSize = layout.category_font_size ?? 11;
  const btnRadius = layout.button_radius ?? 8;
  const sectionTitleSize = layout.section_title_size ?? 16;

  const TABS: { key: Screen; label: string; icon: any }[] = [
    { key: "home", label: "Início", icon: House },
    { key: "offers", label: "Ofertas", icon: Tag },
    { key: "redemptions", label: "Resgates", icon: TicketCheck },
    { key: "wallet", label: "Carteira", icon: Wallet },
    { key: "profile", label: "Perfil", icon: CircleUser },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4" /> Preview Real do App
        </CardTitle>
        {/* Screen selector + dark mode toggle */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <div className="flex gap-1 flex-1 flex-wrap">
            {TABS.map((tab) => {
              const isActive = screen === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setScreen(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          {/* Dark mode toggle */}
          <button
            onClick={() => setPreviewDark(!previewDark)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              previewDark
                ? "border-amber-500 bg-amber-500/10 text-amber-600"
                : "border-border hover:border-primary/50 text-muted-foreground"
            }`}
            title={previewDark ? "Ver modo claro" : "Ver modo escuro"}
          >
            {previewDark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
            {previewDark ? "Escuro" : "Claro"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {/* Phone frame */}
        <div
          className="mx-auto rounded-[28px] border-4 border-foreground/10 overflow-hidden shadow-xl"
          style={{ width: 300, height: 580, backgroundColor: bg, color: fg, fontFamily: fontBody, fontSize: 12 }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[9px] font-semibold" style={{ color: fg }}>
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm border" style={{ borderColor: fg, opacity: 0.4 }} />
            </div>
          </div>

          {/* Header */}
          <div
            className="px-4 pt-2 pb-2"
            style={{
              background: `linear-gradient(180deg, ${accent}18 0%, ${accent}08 60%, ${bg} 100%)`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {theme.logo_url ? (
                  <img src={theme.logo_url} alt="" className="h-7 w-7 rounded-lg object-contain" />
                ) : (
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent }}>
                    <Ticket className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <span className="font-extrabold text-[13px]" style={{ color: accent, fontFamily: fontHeading }}>
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-0.5 px-2 py-1 rounded-full" style={{ backgroundColor: muted }}>
                  <MapPin className="h-2.5 w-2.5" style={{ color: accent }} />
                  <span className="text-[8px] font-medium" style={{ color: fg }}>Centro</span>
                </div>
                <div className="h-6 w-6 rounded-lg flex items-center justify-center">
                  <Bell className="h-3.5 w-3.5" style={{ color: fg, opacity: 0.6 }} />
                </div>
              </div>
            </div>
            {/* Search */}
            <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ backgroundColor: muted }}>
              <Search className="h-3 w-3" style={{ color: fg, opacity: 0.4 }} />
              <span className="text-[10px]" style={{ color: fg, opacity: 0.4 }}>Busque por parceiros e ofertas</span>
            </div>
          </div>

          {/* Content area */}
          <div className="overflow-hidden" style={{ height: 380 }}>
            {screen === "home" && <HomeScreen accent={accent} accentParsed={accentParsed} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} displayName={displayName} isDark={previewDark} cardRadius={cardRadius} cardImgH={cardImgH} iconSize={iconSize} iconRadius={iconRadius} catFontSize={catFontSize} btnRadius={btnRadius} sectionTitleSize={sectionTitleSize} />}
            {screen === "offers" && <OffersScreen accent={accent} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} cardRadius={cardRadius} btnRadius={btnRadius} sectionTitleSize={sectionTitleSize} />}
            {screen === "redemptions" && <RedemptionsScreen accent={accent} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} cardRadius={cardRadius} />}
            {screen === "wallet" && <WalletScreen accent={accent} accentParsed={accentParsed} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} cardRadius={cardRadius} />}
            {screen === "profile" && <ProfileScreen accent={accent} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} displayName={displayName} logoUrl={theme.logo_url} isDark={previewDark} cardRadius={cardRadius} />}
          </div>

          {/* Bottom tab bar */}
          <div className="flex border-t" style={{ borderColor: `${fg}10`, backgroundColor: cardBg }}>
            {TABS.map((tab) => {
              const isActive = screen === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setScreen(tab.key)}
                  className="flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-all"
                >
                  {isActive && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ backgroundColor: accent }} />
                  )}
                  <div className="h-5 w-5 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: isActive ? `${accent}15` : "transparent" }}>
                    <Icon className="h-3 w-3" style={{ color: isActive ? accent : `${fg}60` }} strokeWidth={isActive ? 2.4 : 1.6} />
                  </div>
                  <span className="text-[8px] font-semibold" style={{ color: isActive ? accent : `${fg}60` }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ──────────────── Home Screen ──────────────── */
function HomeScreen({ accent, accentParsed, fg, muted, cardBg, fontHeading, displayName, isDark, cardRadius, cardImgH, iconSize, iconRadius, catFontSize, btnRadius, sectionTitleSize }: any) {
  const STORES = [
    { name: "Pizzaria do João", initials: "PJ", color: "#E53935" },
    { name: "Burger House", initials: "BH", color: "#FF8F00" },
    { name: "Barbearia Premium", initials: "BP", color: "#7C3AED" },
    { name: "Salão Beleza", initials: "SB", color: "#E91E63" },
    { name: "Padaria Central", initials: "PC", color: "#059669" },
  ];

  return (
    <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ height: "100%" }}>
      {/* Greeting + balance badge */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold" style={{ fontSize: sectionTitleSize * 0.8, fontFamily: fontHeading, color: fg }}>
            Olá, <span style={{ color: VB_GOLD }}>João</span>
          </p>
          <p className="text-[9px]" style={{ color: fg, opacity: 0.5 }}>Confira suas ofertas e pontos</p>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1.5" style={{ borderRadius: btnRadius, backgroundColor: VB_GOLD, color: "#fff" }}>
          <Coins className="h-3 w-3" />
          <span className="text-[10px] font-bold">1.250 pts</span>
        </div>
      </div>

      {/* Location line */}
      <div className="flex items-center gap-1">
        <MapPin className="h-2.5 w-2.5" style={{ color: accent }} />
        <span className="text-[8px]" style={{ color: fg, opacity: 0.5 }}>Visualizando ofertas em: <b style={{ color: fg, opacity: 0.7 }}>Centro</b></span>
      </div>

      {/* For you section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" style={{ color: accent }} />
            <span className="font-bold" style={{ fontSize: sectionTitleSize * 0.65, fontFamily: fontHeading, color: fg }}>Selecionados para você</span>
          </div>
          <span className="text-[8px] font-semibold" style={{ color: accent }}>Ver todos</span>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {[
            { title: "10% OFF em Pizzas", store: "Pizzaria do João", pts: 50, color: "#E53935" },
            { title: "Combo Família", store: "Burger House", pts: 30, color: "#FF8F00" },
          ].map((offer, i) => (
            <div key={i} className="overflow-hidden flex-shrink-0" style={{ width: 120, backgroundColor: cardBg, boxShadow: `0 2px 8px ${fg}08`, borderRadius: cardRadius }}>
              <div className="relative flex items-center justify-center" style={{ height: cardImgH * 0.45, backgroundColor: `${offer.color}20` }}>
                <Tag className="h-6 w-6" style={{ color: offer.color, opacity: 0.4 }} />
                <div className="absolute top-1 right-1 px-1.5 py-0.5 text-[7px] font-bold text-white" style={{ backgroundColor: VB_GOLD, borderRadius: btnRadius }}>
                  +{offer.pts} pts
                </div>
              </div>
              <div className="p-2">
                <p className="text-[9px] font-bold truncate" style={{ color: fg }}>{offer.title}</p>
                <p className="text-[7px]" style={{ color: fg, opacity: 0.5 }}>{offer.store}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category icons section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Coins className="h-3 w-3" style={{ color: VB_GOLD }} />
            <span className="font-bold" style={{ fontSize: sectionTitleSize * 0.65, fontFamily: fontHeading, color: fg }}>Compre e pontue</span>
          </div>
          <span className="text-[8px] font-semibold" style={{ color: accent }}>Ver todos</span>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {STORES.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="flex items-center justify-center text-white font-bold text-[10px]"
                style={{ height: iconSize * 0.7, width: iconSize * 0.7, borderRadius: iconRadius, backgroundColor: s.color }}>
                {s.initials}
              </div>
              <span className="font-medium text-center truncate" style={{ fontSize: catFontSize * 0.7, width: iconSize * 0.7, color: fg, opacity: 0.6 }}>{s.name.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Redemptions Screen ──────────────── */
function RedemptionsScreen({ accent, fg, muted, cardBg, fontHeading, cardRadius }: any) {
  const redemptions = [
    { title: "10% OFF em Pizzas", store: "Pizzaria do João", status: "Ativo", statusColor: "#059669", date: "Expira em 3 dias" },
    { title: "Combo Família", store: "Burger House", status: "Usado", statusColor: "#9CA3AF", date: "Usado em 12/03" },
    { title: "Corte + Barba", store: "Barbearia Premium", status: "Ativo", statusColor: "#059669", date: "Expira em 7 dias" },
  ];
  return (
    <div className="px-4 py-3 space-y-2 overflow-y-auto" style={{ height: "100%" }}>
      <p className="text-[12px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>Meus Resgates</p>
      {redemptions.map((r, i) => (
        <div key={i} className="flex gap-2 p-2.5" style={{ backgroundColor: cardBg, boxShadow: `0 1px 4px ${fg}06`, borderRadius: cardRadius }}>
          <div className="h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
            <TicketCheck className="h-4 w-4" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold truncate" style={{ fontFamily: fontHeading, color: fg }}>{r.title}</p>
            <p className="text-[8px]" style={{ color: fg, opacity: 0.5 }}>{r.store}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: `${r.statusColor}18`, color: r.statusColor }}>{r.status}</span>
              <span className="text-[7px]" style={{ color: fg, opacity: 0.4 }}>{r.date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────── Offers Screen ──────────────── */
function OffersScreen({ accent, fg, muted, cardBg, fontHeading }: any) {
  const offers = [
    { title: "10% de desconto em pizzas", store: "Pizzaria do João", badge: "10% OFF", badgeColor: "#E53935" },
    { title: "Combo família completo", store: "Burger House", badge: "Combo", badgeColor: "#FF8F00" },
    { title: "Corte + Barba especial", store: "Barbearia Premium", badge: "Novo", badgeColor: "#7C3AED" },
    { title: "Manicure + Pedicure", store: "Salão Beleza Total", badge: "20% OFF", badgeColor: "#E91E63" },
  ];
  return (
    <div className="px-4 py-3 space-y-2 overflow-y-auto" style={{ height: "100%" }}>
      <p className="text-[12px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>Ofertas Disponíveis</p>
      {/* Filter chips */}
      <div className="flex gap-1">
        {["Todos", "Perto de mim", "Novos"].map((f, i) => (
          <span key={f} className="px-2 py-1 rounded-full text-[8px] font-semibold"
            style={{
              backgroundColor: i === 0 ? accent : muted,
              color: i === 0 ? "white" : fg,
            }}>{f}</span>
        ))}
      </div>
      {offers.map((o, i) => (
        <div key={i} className="flex gap-2 p-2" style={{ backgroundColor: cardBg, boxShadow: `0 1px 4px ${fg}06`, borderRadius: cardRadius }}>
          <div className="h-14 w-14 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px]"
            style={{ backgroundColor: o.badgeColor }}>
            {o.badge}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold truncate" style={{ fontFamily: fontHeading, color: fg }}>{o.title}</p>
            <p className="text-[8px]" style={{ color: fg, opacity: 0.5 }}>{o.store}</p>
            <div className="flex items-center gap-1 mt-1">
              <Heart className="h-2.5 w-2.5" style={{ color: `${fg}30` }} />
              <span className="text-[7px] font-semibold" style={{ color: accent }}>Resgatar</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────── Wallet Screen ──────────────── */
function WalletScreen({ accent, accentParsed, fg, muted, cardBg, fontHeading }: any) {
  return (
    <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ height: "100%" }}>
      <p className="text-[12px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>Minha Carteira</p>

      {/* Points card */}
      <div className="rounded-2xl p-4 text-center"
        style={{ background: `linear-gradient(145deg, ${hslAlpha(accentParsed, 1)}, ${hslAlpha(accentParsed, 0.75)})` }}>
        <div className="flex items-center justify-center gap-1 mb-1">
          <Star className="h-3 w-3 text-white/70" />
          <span className="text-[8px] font-semibold text-white/60 uppercase">Seus pontos</span>
        </div>
        <span className="text-[24px] font-black text-white" style={{ fontFamily: fontHeading }}>1.250</span>
      </div>

      {/* Transaction history */}
      <p className="text-[10px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>Histórico</p>
      {[
        { label: "Pizzaria do João", pts: "+50 pts", icon: ArrowUpRight, color: "#059669" },
        { label: "Resgate cupom", pts: "-100 pts", icon: ArrowDownRight, color: "#E53935" },
        { label: "Burger House", pts: "+30 pts", icon: ArrowUpRight, color: "#059669" },
      ].map((t, i) => {
        const Icon = t.icon;
        return (
          <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${fg}08` }}>
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${t.color}15` }}>
              <Icon className="h-3 w-3" style={{ color: t.color }} />
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-semibold" style={{ color: fg }}>{t.label}</p>
              <p className="text-[7px]" style={{ color: fg, opacity: 0.4 }}>Hoje, 14:30</p>
            </div>
            <span className="text-[9px] font-bold" style={{ color: t.color }}>{t.pts}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────── Profile Screen ──────────────── */
function ProfileScreen({ accent, fg, muted, cardBg, fontHeading, displayName, logoUrl, isDark }: any) {
  const items = [
    { icon: CircleUser, label: "Meus dados" },
    { icon: MapPin, label: "Minha cidade" },
    { icon: Moon, label: "Modo escuro" },
    { icon: Shield, label: "Privacidade" },
    { icon: CircleHelp, label: "Ajuda" },
    { icon: LogOut, label: "Sair" },
  ];
  return (
    <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ height: "100%" }}>
      {/* User card */}
      <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: muted }}>
        <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold"
          style={{ backgroundColor: accent }}>
          JC
        </div>
        <div>
          <p className="text-[11px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>João Carlos</p>
          <p className="text-[8px]" style={{ color: fg, opacity: 0.5 }}>joao@email.com</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: cardBg, boxShadow: `0 1px 6px ${fg}06` }}>
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: i < items.length - 1 ? `1px solid ${fg}08` : "none" }}>
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}12` }}>
                <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
              </div>
              <span className="text-[10px] font-medium flex-1" style={{ color: fg }}>{item.label}</span>
              <ChevronRight className="h-3 w-3" style={{ color: fg, opacity: 0.3 }} />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center pt-2">
        {logoUrl && <img src={logoUrl} alt="" className="h-6 mx-auto mb-1 opacity-30" />}
        <p className="text-[7px]" style={{ color: fg, opacity: 0.3 }}>{displayName} • Versão 1.0</p>
      </div>
    </div>
  );
}
