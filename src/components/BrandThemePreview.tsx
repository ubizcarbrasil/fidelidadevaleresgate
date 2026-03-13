import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, MapPin, Bell, Search, Wallet, House, Tag, Ticket, CircleUser,
  Coins, Percent, Store, Gift, Sparkles, ChevronRight, Heart, Star,
  Shield, CircleHelp, LogOut, Moon, ArrowUpRight, ArrowDownRight, Sun,
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

type Screen = "home" | "offers" | "wallet" | "profile";

const QUICK_ACTIONS = [
  { label: "Ofertas", icon: Tag, color: "#FF6B35", bg: "#FFE0CC" },
  { label: "Cupons", icon: Percent, color: "#E91E63", bg: "#F8C8D8" },
  { label: "Parceiros", icon: Store, color: "#7C3AED", bg: "#DDD6FE" },
  { label: "Pontos", icon: Coins, color: "#059669", bg: "#A7F3D0" },
  { label: "Presentes", icon: Gift, color: "#D97706", bg: "#FDE68A" },
  { label: "Achadinhos", icon: Sparkles, color: "#0EA5E9", bg: "#BAE6FD" },
];

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
  // Dark: merge defaults + colors + dark_colors
  const merged = { ...DARK_DEFAULTS, ...theme.colors, ...theme.dark_colors };
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

  const TABS: { key: Screen; label: string; icon: any }[] = [
    { key: "home", label: "Início", icon: House },
    { key: "offers", label: "Ofertas", icon: Tag },
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
            {screen === "home" && <HomeScreen accent={accent} accentParsed={accentParsed} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} displayName={displayName} isDark={previewDark} />}
            {screen === "offers" && <OffersScreen accent={accent} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} />}
            {screen === "wallet" && <WalletScreen accent={accent} accentParsed={accentParsed} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} />}
            {screen === "profile" && <ProfileScreen accent={accent} fg={fg} muted={muted} cardBg={cardBg} fontHeading={fontHeading} displayName={displayName} logoUrl={theme.logo_url} isDark={previewDark} />}
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
function HomeScreen({ accent, accentParsed, fg, muted, cardBg, fontHeading, displayName, isDark }: any) {
  return (
    <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ height: "100%" }}>
      {/* Greeting */}
      <div>
        <p className="font-bold text-[13px]" style={{ fontFamily: fontHeading, color: fg }}>
          Boa tarde, <span style={{ color: accent }}>João</span>! 👋
        </p>
        <p className="text-[9px]" style={{ color: fg, opacity: 0.5 }}>Confira suas ofertas e pontos</p>
      </div>

      {/* Points banner */}
      <div
        className="rounded-2xl p-4 relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${hslAlpha(accentParsed, 1)} 0%, ${hslAlpha(accentParsed, 0.7)} 100%)`,
          boxShadow: `0 6px 20px -6px ${hslAlpha(accentParsed, 0.4)}`,
        }}
      >
        <div className="absolute -top-6 -right-6 h-20 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="relative z-10 text-center">
          <div className="flex items-center gap-1.5 justify-center mb-1">
            <div className="h-5 w-5 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
              <Coins className="h-2.5 w-2.5 text-white" />
            </div>
            <span className="text-[8px] font-semibold text-white/60 uppercase tracking-wider">Seus Pontos</span>
          </div>
          <span className="text-[28px] font-black text-white leading-none" style={{ fontFamily: fontHeading }}>1.250</span>
          <div className="flex items-center justify-center gap-1 mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
            <span className="text-[8px] text-white/50 font-semibold">Ver extrato completo</span>
            <ChevronRight className="h-2.5 w-2.5 text-white/50" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-6 gap-1">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.label} className="flex flex-col items-center gap-1">
              <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: isDark ? `${a.color}25` : a.bg }}>
                <Icon className="h-4 w-4" style={{ color: a.color }} />
              </div>
              <span className="text-[7px] font-semibold text-center" style={{ color: fg, opacity: 0.6 }}>{a.label}</span>
            </div>
          );
        })}
      </div>

      {/* For you section */}
      <div>
        <div className="flex items-center gap-1 mb-2">
          <Sparkles className="h-3 w-3" style={{ color: accent }} />
          <span className="text-[10px] font-bold" style={{ fontFamily: fontHeading, color: fg }}>Selecionados para você</span>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {["Pizzaria do João", "Burger House"].map((name, i) => (
            <div key={i} className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: 120, backgroundColor: cardBg, boxShadow: `0 2px 8px ${fg}08` }}>
              <div className="h-16 flex items-center justify-center text-white font-black text-lg"
                style={{ backgroundColor: i === 0 ? "#E53935" : "#FF8F00" }}>
                {name[0]}{name.split(" ").pop()?.[0]}
              </div>
              <div className="p-2">
                <p className="text-[9px] font-bold truncate" style={{ color: fg }}>{name}</p>
                <p className="text-[7px]" style={{ color: fg, opacity: 0.5 }}>10% OFF • Resgate</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
        <div key={i} className="flex gap-2 p-2 rounded-xl" style={{ backgroundColor: cardBg, boxShadow: `0 1px 4px ${fg}06` }}>
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
