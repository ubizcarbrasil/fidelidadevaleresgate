import { useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { Home, Tag, Wallet, UserCircle, MapPin } from "lucide-react";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import CustomerOffersPage from "@/pages/customer/CustomerOffersPage";
import CustomerWalletPage from "@/pages/customer/CustomerWalletPage";
import CustomerProfilePage from "@/pages/customer/CustomerProfilePage";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

type Tab = "home" | "offers" | "wallet" | "profile";

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Início", icon: Home },
  { key: "offers", label: "Ofertas", icon: Tag },
  { key: "wallet", label: "Carteira", icon: Wallet },
  { key: "profile", label: "Perfil", icon: UserCircle },
];

export default function CustomerLayout() {
  const { brand, selectedBranch, theme } = useBrand();
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const bg = hslToCss(theme?.colors?.background, "hsl(var(--background))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const cardBg = hslToCss(theme?.colors?.card, "hsl(var(--card))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme?.font_body ? `"${theme.font_body}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand?.name || "";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg, color: fg, fontFamily: fontBody }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-md"
        style={{ backgroundColor: primary, color: "#fff" }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {theme?.logo_url ? (
              <img
                src={theme.logo_url}
                alt={displayName}
                className="h-7 object-contain"
                style={{ filter: "brightness(0) invert(1)" }}
              />
            ) : (
              <span className="font-bold text-lg" style={{ fontFamily: fontHeading }}>
                {displayName}
              </span>
            )}
          </div>
          {selectedBranch && (
            <div className="flex items-center gap-1 text-xs opacity-80">
              <MapPin className="h-3 w-3" />
              <span>{selectedBranch.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {activeTab === "home" && <CustomerHomePage />}
        {activeTab === "offers" && <CustomerOffersPage />}
        {activeTab === "wallet" && <CustomerWalletPage />}
        {activeTab === "profile" && <CustomerProfilePage />}
      </main>

      {/* Bottom Tab Bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        style={{ backgroundColor: cardBg, borderColor: `${fg}10` }}
      >
        <div className="max-w-lg mx-auto flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
                style={{ color: isActive ? primary : `${fg}60` }}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
