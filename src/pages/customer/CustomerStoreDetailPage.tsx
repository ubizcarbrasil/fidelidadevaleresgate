import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Tables } from "@/integrations/supabase/types";
import StoreCatalogView from "@/components/customer/StoreCatalogView";
import { useCustomerFavoriteStores } from "@/hooks/useCustomerFavoriteStores";
import { toast } from "@/hooks/use-toast";
import { Tag, ShoppingBag, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import StoreReviewsSection from "@/components/customer/StoreReviewsSection";
import StoreDetailHero from "@/components/customer/StoreDetailHero";
import StoreDetailInfoCard from "@/components/customer/StoreDetailInfoCard";
import { StoreOffersList } from "@/components/customer/StoreOffersList";

type StoreRow = Tables<"stores">;
type Offer = Tables<"offers">;

interface Props {
  store: StoreRow;
  onBack: () => void;
  onOfferClick?: (offer: Offer) => void;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerStoreDetailPage({ store, onBack, onOfferClick }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { isFavoriteStore, toggleFavoriteStore } = useCustomerFavoriteStores();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [activeTab, setActiveTab] = useState<"ofertas" | "catalogo">("ofertas");

  const isDark = document.documentElement.classList.contains("dark");
  const isEmitter = store.store_type === "EMISSORA" || store.store_type === "MISTA";
  const hasCatalog = isEmitter;

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    const fetchOffers = async () => {
      setLoadingOffers(true);
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(20);
      setOffers(data || []);
      setLoadingOffers(false);
    };
    fetchOffers();
  }, [store.id]);

  const handleShare = async () => {
    const shareText = `${store.name}${store.description ? ` - ${store.description}` : ""}`;
    if (navigator.share) {
      try { await navigator.share({ title: store.name, text: shareText }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copiado!", description: "Link da loja copiado." });
    }
  };

  const isFav = isFavoriteStore(store.id);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col bg-background"
    >
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Hero */}
        <StoreDetailHero
          storeName={store.name}
          bannerUrl={store.banner_url}
          logoUrl={store.logo_url}
          primary={primary}
          isFav={isFav}
          onBack={onBack}
          onShare={handleShare}
          onToggleFav={() => toggleFavoriteStore(store.id)}
        />

        {/* Store name + points */}
        <div className="max-w-lg mx-auto flex flex-col items-center text-center pt-12 px-5 pb-2">
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: fontHeading }}>
            {store.name}
          </h1>
          {store.points_per_real && (
            <p className="text-2xl font-black mb-2" style={{ fontFamily: fontHeading }}>
              {Number(store.points_per_real).toFixed(0)} {Number(store.points_per_real) === 1 ? "ponto" : "pontos"}{" "}
              <span className="text-base font-medium" style={{ color: `${fg}60` }}>por R$ 1</span>
            </p>
          )}
          {store.category && (
            <span
              className="text-xs font-medium px-3 py-1 rounded-full mb-2"
              style={{ backgroundColor: `${primary}12`, color: primary }}
            >
              {store.category}
            </span>
          )}
        </div>

        {/* Info Card */}
        <StoreDetailInfoCard store={store} primary={primary} fg={fg} />

        {/* Orientações */}
        <StoreOrientations store={store} primary={primary} fg={fg} fontHeading={fontHeading} />

        {/* FAQ */}
        <StoreFAQ faqJson={store.faq_json} primary={primary} fg={fg} fontHeading={fontHeading} />

        {/* Reviews */}
        <StoreReviewsSection
          storeId={store.id}
          customerId={customer?.id}
          primary={primary}
          fontHeading={fontHeading}
          fg={fg}
        />

        {/* Video */}
        {store.video_url && (
          <div className="mx-4 mt-4">
            <VideoEmbed url={store.video_url} fontHeading={fontHeading} />
          </div>
        )}

        {/* Gallery */}
        {store.gallery_urls && (store.gallery_urls as string[]).length > 0 && (
          <StoreGallery urls={store.gallery_urls as string[]} fontHeading={fontHeading} />
        )}

        {/* Location */}
        {store.address && (
          <StoreLocationSection address={store.address} primary={primary} fontHeading={fontHeading} fg={fg} />
        )}

        {/* Tab switcher */}
        {hasCatalog && (() => {
          const catalogConfig = (store as StoreRow & { store_catalog_config_json?: { tab_label?: string } }).store_catalog_config_json;
          const tabLabel = catalogConfig?.tab_label || "Catálogo";
          return (
            <div className="flex gap-1.5 mx-4 mt-5 bg-card/80 rounded-xl p-1" style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.04)" }}>
              <button
                onClick={() => setActiveTab("ofertas")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "ofertas" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <Tag className="h-3.5 w-3.5 inline mr-1.5" />
                Ofertas
              </button>
              <button
                onClick={() => setActiveTab("catalogo")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "catalogo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                <ShoppingBag className="h-3.5 w-3.5 inline mr-1.5" />
                {tabLabel}
              </button>
            </div>
          );
        })()}

        {/* Offers */}
        {(activeTab === "ofertas" || !hasCatalog) && (
          <StoreOffersList
            offers={offers}
            loading={loadingOffers}
            storeName={store.name}
            storeLogoUrl={store.logo_url}
            primary={primary}
            fontHeading={fontHeading}
            fg={fg}
            isDark={isDark}
            onOfferClick={onOfferClick}
          />
        )}

        {/* Catalog */}
        {activeTab === "catalogo" && hasCatalog && (
          <StoreCatalogView
            storeId={store.id}
            storeName={store.name}
            brandId={store.brand_id}
            branchId={store.branch_id}
            pointsPerReal={Number(store.points_per_real) || 1}
            whatsapp={store.whatsapp}
            customerName={customer?.name}
            customerCpf={(customer as (typeof customer & { cpf?: string }))?.cpf || ""}
            customerId={customer?.id}
            primary={primary}
            fontHeading={fontHeading}
            onOfferClick={onOfferClick as ((offer: Record<string, unknown>) => void) | undefined}
          />
        )}
      </div>
    </motion.div>
  );
}

/* ─── Orientations Section ─── */
function StoreOrientations({ store, primary, fg, fontHeading }: {
  store: StoreRow; primary: string; fg: string; fontHeading: string;
}) {
  if (!store.points_rule_text && !store.points_deadline_text) return null;
  return (
    <div className="mx-4 mt-5">
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: fontHeading }}>Orientações importantes</h2>
      {store.points_rule_text && (
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}10` }}>
            <Tag className="h-5 w-5" style={{ color: primary }} />
          </div>
          <div>
            <p className="text-sm font-bold">Regra</p>
            <p className="text-sm mt-0.5" style={{ color: `${fg}65` }}>{store.points_rule_text}</p>
          </div>
        </div>
      )}
      {store.points_deadline_text && (
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primary}10` }}>
            <Calendar className="h-5 w-5" style={{ color: primary }} />
          </div>
          <div>
            <p className="text-sm font-bold">Prazo</p>
            <p className="text-sm mt-0.5" style={{ color: `${fg}65` }}>{store.points_deadline_text}</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── FAQ Section ─── */
interface FaqItem {
  question: string;
  answer: string;
}

function StoreFAQ({ faqJson, primary, fg, fontHeading }: {
  faqJson: unknown; primary: string; fg: string; fontHeading: string;
}) {
  if (!faqJson || !Array.isArray(faqJson) || faqJson.length === 0) return null;
  const items = faqJson as FaqItem[];
  return (
    <div className="mx-4 mt-5">
      <h2 className="text-lg font-bold mb-3" style={{ fontFamily: fontHeading }}>Dúvidas frequentes</h2>
      <div className="rounded-2xl bg-card overflow-hidden" style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}>
        <Accordion type="single" collapsible>
          {items.map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`} className="border-b last:border-b-0">
              <AccordionTrigger className="px-4 py-3.5 text-sm font-semibold text-left hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-sm" style={{ color: `${fg}65` }}>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

/* ─── Video Embed ─── */
function VideoEmbed({ url, fontHeading }: { url: string; fontHeading: string }) {
  const getEmbedUrl = (rawUrl: string): string | null => {
    const ytMatch = rawUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = rawUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };
  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) return null;
  return (
    <div>
      <h3 className="text-base font-bold mb-3" style={{ fontFamily: fontHeading }}>Vídeo</h3>
      <div className="rounded-[16px] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe src={embedUrl} title="Video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="absolute inset-0 w-full h-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Store Gallery ─── */
function StoreGallery({ urls, fontHeading }: { urls: string[]; fontHeading: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="mx-4 mt-4">
      <h3 className="text-base font-bold mb-3" style={{ fontFamily: fontHeading }}>Fotos</h3>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="aspect-square rounded-[12px] overflow-hidden cursor-pointer active:scale-95 transition-transform" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }} onClick={() => setSelected(i)}>
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>
      <AnimatePresence>
        {selected !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <img src={urls[selected]} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Store Location ─── */
function StoreLocationSection({ address, primary, fontHeading, fg }: { address: string; primary: string; fontHeading: string; fg: string }) {
  const mapQuery = encodeURIComponent(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  return (
    <div className="mx-4 mt-5">
      <h3 className="text-base font-bold mb-3" style={{ fontFamily: fontHeading }}>Localização</h3>
      <div className="rounded-[16px] overflow-hidden bg-card" style={{ boxShadow: "0 2px 12px hsl(var(--foreground) / 0.04)" }}>
        <div className="relative w-full h-44">
          <iframe title="Mapa" src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`} className="absolute inset-0 w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
        </div>
        <div className="p-4">
          <p className="text-sm font-semibold">Endereço</p>
          <p className="text-xs mt-0.5" style={{ color: `${fg}55` }}>{address}</p>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm" style={{ backgroundColor: `${primary}12`, color: primary }}>
            Como chegar
          </a>
        </div>
      </div>
    </div>
  );
}
