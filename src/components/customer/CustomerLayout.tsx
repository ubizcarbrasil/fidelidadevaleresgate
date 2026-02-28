import { createContext, useContext, useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { Home, Tag, Wallet, UserCircle, MapPin, Bell, Search } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import CustomerOffersPage from "@/pages/customer/CustomerOffersPage";
import CustomerWalletPage from "@/pages/customer/CustomerWalletPage";
import CustomerProfilePage from "@/pages/customer/CustomerProfilePage";
import CustomerOfferDetailPage from "@/pages/customer/CustomerOfferDetailPage";

// Context to allow child components to open offer detail
interface OfferNavContextType {
  openOffer: (offer: any) => void;
}
const OfferNavContext = createContext<OfferNavContextType>({ openOffer: () => {} });
export const useOfferNav = () => useContext(OfferNavContext);

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

const TAB_CONTENT: Record<Tab, React.FC> = {
  home: CustomerHomePage,
  offers: CustomerOffersPage,
  wallet: CustomerWalletPage,
  profile: CustomerProfilePage,
};

const tabVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" as const } },
};

export default function CustomerLayout() {
  const { brand, selectedBranch, theme } = useBrand();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedOffer, setSelectedOffer] = useState<any>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const bg = "#FAFAFA";
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const cardBg = "#FFFFFF";
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme?.font_body ? `"${theme.font_body}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand?.name || "";

  const ActivePage = TAB_CONTENT[activeTab];

  return (
    <OfferNavContext.Provider value={{ openOffer: setSelectedOffer }}>
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg, color: fg, fontFamily: fontBody }}>
        {/* Modern Header */}
        <header className="sticky top-0 z-50" style={{ backgroundColor: cardBg }}>
          <div className="max-w-lg mx-auto flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              {theme?.logo_url ? (
                <img src={theme.logo_url} alt={displayName} className="h-8 object-contain" />
              ) : (
                <span className="font-bold text-xl" style={{ fontFamily: fontHeading, color: fg }}>
                  {displayName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {selectedBranch && (
                <div className="flex items-center gap-1 text-xs mr-2 px-2.5 py-1 rounded-full" style={{ backgroundColor: `${primary}10`, color: primary }}>
                  <MapPin className="h-3 w-3" />
                  <span className="font-medium">{selectedBranch.name}</span>
                </div>
              )}
              <button className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors">
                <Bell className="h-5 w-5" style={{ color: `${fg}90` }} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: primary }} />
              </button>
              <button className="h-9 w-9 flex items-center justify-center rounded-full" onClick={() => setActiveTab("wallet")} style={{ color: `${fg}90` }}>
                <Wallet className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-w-lg mx-auto px-5 pb-3">
            <div className="flex items-center gap-2.5 rounded-full px-4 py-2.5" style={{ backgroundColor: "#F2F2F7" }}>
              <Search className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}50` }} />
              <span className="text-sm" style={{ color: `${fg}40` }}>Busque por lojas e ofertas</span>
            </div>
          </div>

          <div className="h-px" style={{ backgroundColor: `${fg}08` }} />
        </header>

        {/* Content with tab transition */}
        <main className="flex-1 pb-24 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ActivePage />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Tab Bar */}
        <nav className="fixed bottom-0 inset-x-0 z-50" style={{ backgroundColor: cardBg, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
          <div className="max-w-lg mx-auto flex">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 transition-all relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                      style={{ backgroundColor: primary }}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    className="h-8 w-8 rounded-xl flex items-center justify-center"
                    animate={{ backgroundColor: isActive ? `${primary}12` : "transparent", scale: isActive ? 1.05 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon className="h-5 w-5" strokeWidth={isActive ? 2.2 : 1.6} style={{ color: isActive ? primary : `${fg}45` }} />
                  </motion.div>
                  <span className="text-[10px] font-semibold transition-colors" style={{ color: isActive ? primary : `${fg}45` }}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Offer Detail Overlay */}
        <AnimatePresence>
          {selectedOffer && (
            <CustomerOfferDetailPage
              offer={selectedOffer}
              onBack={() => setSelectedOffer(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </OfferNavContext.Provider>
  );
}
