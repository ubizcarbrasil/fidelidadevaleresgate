import { createContext, useContext, useState } from "react";
import { useBrand } from "@/contexts/BrandContext";
import { Home, Tag, Wallet, UserCircle, Bell, Search, Ticket } from "lucide-react";
import BranchPickerSheet from "@/components/customer/BranchPickerSheet";
import NotificationDrawer from "@/components/customer/NotificationDrawer";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { AnimatePresence, motion } from "framer-motion";
import CustomerHomePage from "@/pages/customer/CustomerHomePage";
import CustomerOffersPage from "@/pages/customer/CustomerOffersPage";
import CustomerRedemptionsPage from "@/pages/customer/CustomerRedemptionsPage";
import CustomerWalletPage from "@/pages/customer/CustomerWalletPage";
import CustomerProfilePage from "@/pages/customer/CustomerProfilePage";
import CustomerOfferDetailPage from "@/pages/customer/CustomerOfferDetailPage";
import CustomerStoreDetailPage from "@/pages/customer/CustomerStoreDetailPage";
import CustomerSearchOverlay from "@/components/customer/CustomerSearchOverlay";
import SectionDetailOverlay from "@/components/customer/SectionDetailOverlay";
import CustomerLedgerOverlay from "@/components/customer/CustomerLedgerOverlay";
import { useCustomerFavorites } from "@/hooks/useCustomerFavorites";

// Context to allow child components to open offer/store/section detail, manage favorites, and navigate tabs
interface CustomerNavContextType {
  openOffer: (offer: any) => void;
  openStore: (store: any) => void;
  openSectionDetail: (section: any, items: any[]) => void;
  isFavorite: (offerId: string) => boolean;
  toggleFavorite: (offerId: string) => void;
  navigateToTab: (tab: Tab) => void;
  navigateToOffersWithSegment: (segmentId: string) => void;
  activeSegmentFilter: string | null;
  clearSegmentFilter: () => void;
}
const CustomerNavContext = createContext<CustomerNavContextType>({
  openOffer: () => {}, openStore: () => {}, openSectionDetail: () => {},
  isFavorite: () => false, toggleFavorite: () => {},
  navigateToTab: () => {},
  navigateToOffersWithSegment: () => {},
  activeSegmentFilter: null,
  clearSegmentFilter: () => {},
});
export const useOfferNav = () => useContext(CustomerNavContext);
export const useCustomerNav = () => useContext(CustomerNavContext);

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

type Tab = "home" | "offers" | "redemptions" | "wallet" | "profile";

const TABS: { key: Tab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Início", icon: Home },
  { key: "offers", label: "Ofertas", icon: Tag },
  { key: "redemptions", label: "Resgates", icon: Ticket },
  { key: "wallet", label: "Carteira", icon: Wallet },
  { key: "profile", label: "Perfil", icon: UserCircle },
];

const TAB_CONTENT: Record<Tab, React.FC<any>> = {
  home: CustomerHomePage,
  offers: CustomerOffersPage,
  redemptions: CustomerRedemptionsPage,
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
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [sectionDetail, setSectionDetail] = useState<{ section: any; items: any[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const { isFavorite, toggleFavorite } = useCustomerFavorites();
  const { unreadCount } = useCustomerNotifications();

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const bg = "#FAFAFA";
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const cardBg = "#FFFFFF";
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme?.font_body ? `"${theme.font_body}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand?.name || "";

  const navigateToOffersWithSegment = (segmentId: string) => {
    setSegmentFilter(segmentId);
    setActiveTab("offers");
  };

  const clearSegmentFilter = () => setSegmentFilter(null);

  const ActivePage = TAB_CONTENT[activeTab];

  return (
    <CustomerNavContext.Provider value={{ openOffer: setSelectedOffer, openStore: setSelectedStore, openSectionDetail: (section, items) => setSectionDetail({ section, items }), isFavorite, toggleFavorite, navigateToTab: setActiveTab, navigateToOffersWithSegment, activeSegmentFilter: segmentFilter, clearSegmentFilter }}>
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
              <BranchPickerSheet />
              <button
                onClick={() => setNotifOpen(true)}
                className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
              >
                <Bell className="h-5 w-5" style={{ color: `${fg}90` }} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: "hsl(0 72% 51%)" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button className="h-9 w-9 flex items-center justify-center rounded-full" onClick={() => setActiveTab("wallet")} style={{ color: `${fg}90` }}>
                <Wallet className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-w-lg mx-auto px-5 pb-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2.5 rounded-full px-4 py-2.5 text-left"
              style={{ backgroundColor: "#F2F2F7" }}
            >
              <Search className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}50` }} />
              <span className="text-sm" style={{ color: `${fg}40` }}>Busque por parceiros e ofertas</span>
            </button>
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
              {activeTab === "home" ? (
                <CustomerHomePage onOpenLedger={() => setLedgerOpen(true)} />
              ) : (
                <ActivePage />
              )}
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
              onOfferClick={(offer) => {
                setSelectedOffer(null);
                setTimeout(() => setSelectedOffer(offer), 150);
              }}
            />
          )}
        </AnimatePresence>

        {/* Store Detail Overlay */}
        <AnimatePresence>
          {selectedStore && (
            <CustomerStoreDetailPage
              store={selectedStore}
              onBack={() => setSelectedStore(null)}
              onOfferClick={(offer) => {
                setSelectedStore(null);
                setTimeout(() => setSelectedOffer(offer), 100);
              }}
            />
          )}
        </AnimatePresence>

        {/* Section Detail Overlay */}
        <AnimatePresence>
          {sectionDetail && (
            <SectionDetailOverlay
              section={sectionDetail.section}
              items={sectionDetail.items}
              onBack={() => setSectionDetail(null)}
              primary={primary}
              fg={fg}
              fontHeading={fontHeading}
            />
          )}
        </AnimatePresence>

        {/* Search Overlay */}
        <CustomerSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Ledger Overlay */}
        <CustomerLedgerOverlay open={ledgerOpen} onBack={() => setLedgerOpen(false)} />

        {/* Notification Drawer */}
        <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
    </CustomerNavContext.Provider>
  );
}
