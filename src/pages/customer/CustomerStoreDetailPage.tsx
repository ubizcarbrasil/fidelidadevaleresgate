import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Tables } from "@/integrations/supabase/types";
import StoreCatalogView from "@/components/customer/StoreCatalogView";
import {
  ArrowLeft,
  Store as StoreIcon,
  MapPin,
  Clock,
  ShoppingBag,
  Heart,
  MessageCircle,
  Phone,
  Tag,
  Sparkles,
  Instagram,
  Globe,
  Navigation,
  Play,
  ChevronLeft,
  ChevronRight,
  X,
  Coins,
  Calendar,
  ChevronDown,
  Info,
  HelpCircle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type StoreRow = Tables<"stores">;
type Offer = Tables<"offers">;
type CatalogItem = Tables<"store_catalog_items">;

interface Props {
  store: StoreRow;
  onBack: () => void;
  onOfferClick?: (offer: any) => void;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerStoreDetailPage({ store, onBack, onOfferClick }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [activeTab, setActiveTab] = useState<"ofertas" | "catalogo">("ofertas");

  const isEmitter = store.store_type === "EMISSORA" || store.store_type === "MISTA";
  const hasCatalog = isEmitter;

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
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
    const fetchCatalog = async () => {
      setLoadingCatalog(true);
      const { data } = await supabase
        .from("store_catalog_items")
        .select("*")
        .eq("store_id", store.id)
        .eq("is_active", true)
        .order("order_index")
        .limit(50);
      setCatalogItems(data || []);
      setLoadingCatalog(false);
    };
    fetchOffers();
    fetchCatalog();
  }, [store.id]);

  const whatsappUrl = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col bg-background"
    >
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Hero header */}
        <div
          className="relative w-full pt-14 pb-8 px-5"
          style={{
            background: `linear-gradient(135deg, ${primary}18 0%, ${primary}06 100%)`,
          }}
        >
          {/* Back button */}
          <button
            onClick={onBack}
            className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-md"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>

          <div className="max-w-lg mx-auto flex flex-col items-center text-center">
            {store.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="h-20 w-20 rounded-2xl object-cover mb-3 shadow-md"
              />
            ) : (
              <div
                className="h-20 w-20 rounded-2xl flex items-center justify-center mb-3 shadow-md"
                style={{ backgroundColor: `${primary}15` }}
              >
                <StoreIcon className="h-10 w-10" style={{ color: primary }} />
              </div>
            )}

            <h1 className="text-xl font-bold mb-1" style={{ fontFamily: fontHeading }}>
              {store.name}
            </h1>

            {/* Points rule - prominent like Livelo */}
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
        </div>

        {/* Info card */}
        <div
          className="relative -mt-4 mx-4 rounded-[20px] bg-white p-5"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}
        >
          {store.address && (
            <div className="flex items-start gap-3 mb-3">
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${primary}10` }}
              >
                <MapPin className="h-4 w-4" style={{ color: primary }} />
              </div>
              <div>
                <p className="text-xs font-semibold">Endereço</p>
                <p className="text-xs" style={{ color: `${fg}55` }}>
                  {store.address}
                </p>
              </div>
            </div>
          )}

          {store.description && (
            <p className="text-xs leading-relaxed mt-3" style={{ color: `${fg}65` }}>
              {store.description}
            </p>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white min-w-[120px]"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {store.whatsapp && (
              <a
                href={`tel:${store.whatsapp}`}
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: `${fg}08`, color: `${fg}70` }}
              >
                <Phone className="h-4 w-4" />
                Ligar
              </a>
            )}
            {store.instagram && (
              <a
                href={store.instagram.startsWith("http") ? store.instagram : `https://instagram.com/${store.instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm text-white"
                style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
              >
                <Instagram className="h-4 w-4" />
                Instagram
              </a>
            )}
            {store.site_url && (
              <a
                href={store.site_url.startsWith("http") ? store.site_url : `https://${store.site_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: `${primary}12`, color: primary }}
              >
                <Globe className="h-4 w-4" />
                Site
              </a>
            )}
            {store.address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: "#4285F412", color: "#4285F4" }}
              >
                <Navigation className="h-4 w-4" />
                Ir até lá
              </a>
            )}
          </div>
        </div>

        {/* Orientações importantes - Livelo style */}
        {(store.points_rule_text || store.points_deadline_text) && (
          <div className="mx-4 mt-5">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: fontHeading }}>
              Orientações importantes
            </h2>

            {store.points_rule_text && (
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <Tag className="h-5 w-5" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-sm font-bold">Regra</p>
                  <p className="text-sm mt-0.5" style={{ color: `${fg}65` }}>
                    {store.points_rule_text}
                  </p>
                </div>
              </div>
            )}

            {store.points_deadline_text && (
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <Calendar className="h-5 w-5" style={{ color: primary }} />
                </div>
                <div>
                  <p className="text-sm font-bold">Prazo</p>
                  <p className="text-sm mt-0.5" style={{ color: `${fg}65` }}>
                    {store.points_deadline_text}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAQ Accordion - Livelo style */}
        {store.faq_json && Array.isArray(store.faq_json) && (store.faq_json as any[]).length > 0 && (
          <div className="mx-4 mt-5">
            <h2 className="text-lg font-bold mb-3" style={{ fontFamily: fontHeading }}>
              Dúvidas frequentes
            </h2>
            <div className="rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <Accordion type="single" collapsible>
                {(store.faq_json as any[]).map((faq: any, idx: number) => (
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
        )}
        {/* Video embed */}
        {store.video_url && (
          <div className="mx-4 mt-4">
            <VideoEmbed url={store.video_url} primary={primary} fontHeading={fontHeading} />
          </div>
        )}

        {/* Gallery */}
        {store.gallery_urls && (store.gallery_urls as string[]).length > 0 && (
          <StoreGallery urls={store.gallery_urls as string[]} fontHeading={fontHeading} />
        )}

        {/* Tab switcher for Ofertas / Catálogo */}
        {hasCatalog && (() => {
          const catalogConfig = (store as any).store_catalog_config_json as any;
          const tabLabel = catalogConfig?.tab_label || "Catálogo";
          return (
            <div className="flex gap-1.5 mx-4 mt-5 bg-white/80 rounded-xl p-1" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <button
                onClick={() => setActiveTab("ofertas")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "ofertas" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <Tag className="h-3.5 w-3.5 inline mr-1.5" />
                Ofertas
              </button>
              <button
                onClick={() => setActiveTab("catalogo")}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "catalogo" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5 inline mr-1.5" />
                {tabLabel}
              </button>
            </div>
          );
        })()}

        {/* Offers section */}
        {(activeTab === "ofertas" || !hasCatalog) && (
          <div className="mx-4 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold" style={{ fontFamily: fontHeading }}>
                Ofertas deste parceiro
              </h3>
              {!loadingOffers && (
                <span className="text-xs" style={{ color: `${fg}40` }}>
                  {offers.length} {offers.length === 1 ? "oferta" : "ofertas"}
                </span>
              )}
            </div>

            {loadingOffers ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-[18px] overflow-hidden bg-white"
                    style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}
                  >
                    <Skeleton className="h-32 w-full" />
                    <div className="p-3 space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-1/2 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className="text-center py-12 opacity-40">
                <div
                  className="h-14 w-14 mx-auto mb-3 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${primary}10` }}
                >
                  <Tag className="h-6 w-6" style={{ color: primary }} />
                </div>
                <p className="text-sm font-medium">Nenhuma oferta disponível</p>
                <p className="text-xs mt-1" style={{ color: `${fg}40` }}>
                  Fique de olho, novas ofertas podem surgir!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers.map((offer, idx) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    className="rounded-[18px] overflow-hidden bg-white cursor-pointer"
                    style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
                    onClick={() => onOfferClick?.({ ...offer, stores: { name: store.name, logo_url: store.logo_url } })}
                  >
                    <div className="flex">
                      {offer.image_url ? (
                        <img
                          src={offer.image_url}
                          alt={offer.title}
                          className="w-28 h-28 object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-28 h-28 flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: `${primary}06` }}
                        >
                          <ShoppingBag className="h-8 w-8" style={{ color: `${primary}30` }} />
                        </div>
                      )}

                      <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4
                              className="font-semibold text-sm line-clamp-2"
                              style={{ fontFamily: fontHeading }}
                            >
                              {offer.title}
                            </h4>
                            {idx < 2 && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                                style={{ backgroundColor: primary }}
                              >
                                Novo
                              </span>
                            )}
                          </div>
                          {offer.description && (
                            <p
                              className="text-[11px] line-clamp-1 mt-0.5"
                              style={{ color: `${fg}45` }}
                            >
                              {offer.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          {Number(offer.value_rescue) > 0 && (
                            <span
                              className="font-bold text-sm"
                              style={{ color: primary, fontFamily: fontHeading }}
                            >
                              R$ {Number(offer.value_rescue).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                          {offer.end_at && (
                            <div
                              className="flex items-center gap-0.5 text-[10px]"
                              style={{ color: `${fg}35` }}
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {new Date(offer.end_at).toLocaleDateString("pt-BR")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Catalog tab content */}
        {activeTab === "catalogo" && hasCatalog && (
          <StoreCatalogView
            storeId={store.id}
            storeName={store.name}
            brandId={store.brand_id}
            branchId={store.branch_id}
            pointsPerReal={Number(store.points_per_real) || 1}
            whatsapp={store.whatsapp}
            customerName={customer?.name}
            customerCpf={(customer as any)?.cpf || ""}
            customerId={customer?.id}
            primary={primary}
            fontHeading={fontHeading}
            onOfferClick={onOfferClick}
          />
        )}
      </div>
    </motion.div>
  );
}

// --- Video Embed ---
function VideoEmbed({ url, primary, fontHeading }: { url: string; primary: string; fontHeading: string }) {
  const getEmbedUrl = (rawUrl: string): string | null => {
    // YouTube
    const ytMatch = rawUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = rawUrl.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  };

  const embedUrl = getEmbedUrl(url);
  if (!embedUrl) return null;

  return (
    <div>
      <h3 className="text-base font-bold mb-3" style={{ fontFamily: fontHeading }}>
        Vídeo
      </h3>
      <div className="rounded-[16px] overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={embedUrl}
            title="Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

// --- Store Gallery ---
function StoreGallery({ urls, fontHeading }: { urls: string[]; fontHeading: string }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="mx-4 mt-4">
      <h3 className="text-base font-bold mb-3" style={{ fontFamily: fontHeading }}>
        Fotos
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="aspect-square rounded-[12px] overflow-hidden cursor-pointer active:scale-95 transition-transform"
            style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
            onClick={() => setSelected(i)}
          >
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"
              onClick={() => setSelected(null)}
            >
              <X className="h-5 w-5 text-white" />
            </button>
            {selected > 0 && (
              <button
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setSelected(selected - 1); }}
              >
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
            )}
            {selected < urls.length - 1 && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); setSelected(selected + 1); }}
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            )}
            <img
              src={urls[selected]}
              alt=""
              className="max-w-full max-h-[85vh] rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}