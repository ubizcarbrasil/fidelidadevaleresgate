import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import AppIcon from "@/components/customer/AppIcon";
import BranchPickerSheet from "@/components/customer/BranchPickerSheet";
import NotificationDrawer from "@/components/customer/NotificationDrawer";
import CategoryGridOverlay from "@/components/customer/CategoryGridOverlay";
import CategoryStoresOverlay from "@/components/customer/CategoryStoresOverlay";
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
import CustomerEmissorasPage from "@/pages/customer/CustomerEmissorasPage";
import WelcomeTour from "@/components/customer/WelcomeTour";
import { haptic } from "@/lib/haptics";
import { useBrandModules } from "@/hooks/useBrandModules";
import type { Tables } from "@/integrations/supabase/types";
import type { OfferWithStore } from "@/types/customer";

type StoreRow = Tables<"stores">;

interface SectionDetail {
  title: string | null;
  subtitle: string | null;
  banner_image_url?: string | null;
  banner_height?: string;
  templateType?: string;
}

interface SectionItem {
  id: string;
  name?: string;
  title?: string;
  [key: string]: unknown;
}

interface CustomerNavContextType {
  openOffer: (offer: OfferWithStore) => void;
  openStore: (store: StoreRow) => void;
  openSectionDetail: (section: SectionDetail, items: SectionItem[]) => void;
  isFavorite: (offerId: string) => boolean;
  toggleFavorite: (offerId: string) => void;
  navigateToTab: (tab: Tab) => void;
  navigateToOffersWithSegment: (segmentId: string) => void;
  activeSegmentFilter: string | null;
  clearSegmentFilter: () => void;
  openEmissorasList?: () => void;
}
const CustomerNavContext = createContext<CustomerNavContextType>({
  openOffer: () => {}, openStore: () => {}, openSectionDetail: () => {},
  isFavorite: () => false, toggleFavorite: () => {},
  navigateToTab: () => {},
  navigateToOffersWithSegment: () => {},
  activeSegmentFilter: null,
  clearSegmentFilter: () => {},
  openEmissorasList: () => {},
});
export const useOfferNav = () => useContext(CustomerNavContext);
export const useCustomerNav = () => useContext(CustomerNavContext);

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

type Tab = "home" | "offers" | "redemptions" | "wallet" | "profile";

import type { AppIconKey } from "@/hooks/useAppIcons";

const TABS: { key: Tab; label: string; iconKey: AppIconKey; moduleKey?: string }[] = [
  { key: "home", label: "Início", iconKey: "nav_home" },
  { key: "offers", label: "Ofertas", iconKey: "nav_offers", moduleKey: "offers" },
  { key: "redemptions", label: "Resgates", iconKey: "nav_redemptions", moduleKey: "redemption_qr" },
  { key: "wallet", label: "Carteira", iconKey: "nav_wallet", moduleKey: "wallet" },
  { key: "profile", label: "Perfil", iconKey: "nav_profile" },
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
  const { customer } = useCustomer();
  const { isModuleEnabled } = useBrandModules();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [sectionDetail, setSectionDetail] = useState<{ section: SectionDetail; items: SectionItem[] } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [emissorasOpen, setEmissorasOpen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState<string | null>(null);
  const [categoryGridOpen, setCategoryGridOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string; icon_name: string | null } | null>(null);
  const [showTour, setShowTour] = useState(false);
  const { isFavorite, toggleFavorite } = useCustomerFavorites();
  const { unreadCount } = useCustomerNotifications();

  const filteredTabs = useMemo(() =>
    TABS.filter(t => !t.moduleKey || isModuleEnabled(t.moduleKey)),
    [isModuleEnabled]
  );

  // Auto-hide header on scroll down, show on scroll up
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const mainRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const el = mainRef.current;
    if (!el) return;
    const currentY = el.scrollTop;
    const delta = currentY - lastScrollY.current;
    if (delta > 8 && currentY > 60) {
      setHeaderVisible(false);
    } else if (delta < -5) {
      setHeaderVisible(true);
    }
    lastScrollY.current = currentY;
  }, []);

  // Default to dark mode for customer app (respect user preference if saved)
  useEffect(() => {
    const saved = localStorage.getItem("customer_dark_mode");
    if (saved === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  // Show welcome tour on first visit
  useEffect(() => {
    if (!customer) return;
    const key = `welcome_tour_${customer.id}`;
    if (!localStorage.getItem(key)) {
      setShowTour(true);
    }
  }, [customer]);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const accent = hslToCss(theme?.colors?.secondary, "") || primary;
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";
  const fontBody = theme?.font_body ? `"${theme.font_body}", sans-serif` : "inherit";
  const displayName = theme?.display_name || brand?.name || "";
  const navigateToOffersWithSegment = (segmentId: string) => {
    setSegmentFilter(segmentId);
    setActiveTab("offers");
  };

  const clearSegmentFilter = () => setSegmentFilter(null);

  const ActivePage = TAB_CONTENT[activeTab];

  // Click tracking: log offer/store views for recommendation engine
  const trackClick = useCallback((entityType: "offer" | "store", entityId: string, storeId?: string) => {
    if (!customer || !brand || !selectedBranch) return;
    supabase.from("customer_click_events").insert({
      customer_id: customer.id,
      brand_id: brand.id,
      branch_id: selectedBranch.id,
      entity_type: entityType,
      entity_id: entityId,
      store_id: storeId || null,
    }).then(() => {});
  }, [customer, brand, selectedBranch]);

  const handleOpenOffer = useCallback((offer: any) => {
    trackClick("offer", offer.id, offer.store_id);
    setSelectedOffer(offer);
  }, [trackClick]);

  const handleOpenStore = useCallback((store: any) => {
    trackClick("store", store.id, store.id);
    setSelectedStore(store);
  }, [trackClick]);

  return (
    <CustomerNavContext.Provider value={{ openOffer: handleOpenOffer, openStore: handleOpenStore, openSectionDetail: (section, items) => setSectionDetail({ section, items }), isFavorite, toggleFavorite, navigateToTab: setActiveTab, navigateToOffersWithSegment, activeSegmentFilter: segmentFilter, clearSegmentFilter, openEmissorasList: () => setEmissorasOpen(true) }}>
      <div className="min-h-screen flex flex-col bg-background text-foreground" style={{ fontFamily: fontBody, overscrollBehavior: "none" }}>
        {/* Dark Premium Header */}
        <header
          className="sticky top-0 z-50 transition-transform duration-300 will-change-transform"
          style={{
            transform: headerVisible ? "translateY(0)" : "translateY(-100%)",
            backgroundColor: "hsl(var(--background))",
          }}
        >
          <div className="max-w-lg mx-auto px-4 pt-3 pb-0">
            {/* Top row: Logo/Name + actions */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2.5">
                {theme?.logo_url && (
                  <img
                    src={theme.logo_url}
                    alt={displayName}
                    className="h-8 w-8 object-contain rounded-lg"
                  />
                )}
                <span
                  className="font-extrabold text-[15px] tracking-tight"
                  style={{ fontFamily: fontHeading, color: "hsl(var(--foreground))" }}
                >
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                <BranchPickerSheet />
                <button
                  onClick={() => setNotifOpen(true)}
                  className="relative h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                >
                  <AppIcon iconKey="header_bell" className="h-5 w-5" strokeWidth={1.8} style={{ color: "hsl(var(--vb-highlight))" }} />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: "hsl(var(--destructive))" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: "hsl(var(--muted) / 0.5)" }}
                  onClick={() => setActiveTab("wallet")}
                >
                  <AppIcon iconKey="header_wallet" className="h-5 w-5" strokeWidth={1.8} style={{ color: "hsl(var(--vb-highlight))" }} />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-shadow mb-3"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <AppIcon iconKey="header_search" className="h-4.5 w-4.5 flex-shrink-0 text-foreground/50" />
              <span className="text-sm text-foreground/50">
                O que está procurando?
              </span>
            </button>
          </div>
          {/* Bottom divider */}
          <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
        </header>

        {/* Content with tab transition */}
        <main
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 pb-24 overflow-y-auto"
          style={{ overscrollBehavior: "none", WebkitOverflowScrolling: "touch" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {activeTab === "home" ? (
                <CustomerHomePage
                  onOpenLedger={() => setLedgerOpen(true)}
                  onOpenCategoryGrid={() => setCategoryGridOpen(true)}
                  onOpenCategoryStores={(cat) => setSelectedCategory(cat)}
                />
              ) : (
                <ActivePage />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Tab Bar — Dark premium */}
        <nav
          className="fixed bottom-0 inset-x-0 z-50"
          style={{
            backgroundColor: "hsl(var(--card))",
            borderTop: "1px solid hsl(var(--border))",
          }}
        >
          <div className="max-w-lg mx-auto flex">
            {filteredTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    haptic("light");
                    setActiveTab(tab.key);
                    setHeaderVisible(true);
                    if (mainRef.current) mainRef.current.scrollTop = 0;
                    lastScrollY.current = 0;
                  }}
                  className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-3 transition-all relative"
                >
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute top-0 inset-x-0 mx-auto w-10 h-[3px] rounded-full"
                      style={{ backgroundColor: "hsl(var(--foreground))" }}
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    className="h-8 w-8 rounded-xl flex items-center justify-center"
                    animate={{
                      backgroundColor: isActive ? "hsl(var(--foreground) / 0.12)" : "transparent",
                      scale: isActive ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <AppIcon
                      iconKey={tab.iconKey}
                      className="h-5 w-5"
                      strokeWidth={isActive ? 2.2 : 1.6}
                      style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                    />
                  </motion.div>
                  <span
                    className="text-[10px] font-semibold transition-colors"
                    style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                  >
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
              onOpenStore={(store) => {
                setSelectedOffer(null);
                setTimeout(() => setSelectedStore(store), 150);
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

        {/* Emissoras List Overlay */}
        <AnimatePresence>
          {emissorasOpen && (
            <CustomerEmissorasPage onBack={() => setEmissorasOpen(false)} />
          )}
        </AnimatePresence>

        {/* Category Grid Overlay */}
        <AnimatePresence>
          {categoryGridOpen && (
            <CategoryGridOverlay
              onBack={() => setCategoryGridOpen(false)}
              onCategoryClick={(cat) => {
                setCategoryGridOpen(false);
                setSelectedCategory(cat);
              }}
            />
          )}
        </AnimatePresence>

        {/* Category Stores Overlay */}
        <AnimatePresence>
          {selectedCategory && (
            <CategoryStoresOverlay
              category={selectedCategory}
              onBack={() => setSelectedCategory(null)}
            />
          )}
        </AnimatePresence>

        {/* Notification Drawer */}
        <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

        {/* Welcome Tour */}
        <AnimatePresence>
          {showTour && (
            <WelcomeTour
              primary={primary}
              brandName={displayName}
              customSlides={((brand?.brand_settings_json as any)?.welcome_tour_slides) || undefined}
              onComplete={() => {
                setShowTour(false);
                if (customer) localStorage.setItem(`welcome_tour_${customer.id}`, "done");
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </CustomerNavContext.Provider>
  );
}
