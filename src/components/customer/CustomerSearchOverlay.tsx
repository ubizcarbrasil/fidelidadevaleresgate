import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Tag, Store, ArrowRight, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { useDebounce } from "@/hooks/useDebounce";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

interface CustomerSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export default function CustomerSearchOverlay({ open, onClose }: CustomerSearchOverlayProps) {
  const { brand, selectedBranch, theme } = useBrand();
  const { openOffer, openStore } = useCustomerNav();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [stores, setStores] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<{ id: string; name: string; category_name: string }[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  // Load segments that have at least one active store in the current branch
  useEffect(() => {
    if (!open || !brand || !selectedBranch) return;
    const fetchSegments = async () => {
      const { data } = await supabase
        .from("stores")
        .select("taxonomy_segment_id, taxonomy_segments(id, name, taxonomy_categories(name))")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .not("taxonomy_segment_id", "is", null);
      if (!data) return;
      const segMap = new Map<string, { id: string; name: string; category_name: string }>();
      for (const s of data) {
        const seg = s.taxonomy_segments as any;
        if (seg && !segMap.has(seg.id)) {
          segMap.set(seg.id, {
            id: seg.id,
            name: seg.name,
            category_name: seg.taxonomy_categories?.name || "",
          });
        }
      }
      setSegments(Array.from(segMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    };
    fetchSegments();
  }, [open, brand, selectedBranch]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setStores([]);
      setOffers([]);
      setSelectedSegmentId(null);
    }
  }, [open]);

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const hasQuery = debouncedQuery.trim().length > 0;
    const hasSegment = !!selectedSegmentId;

    if (!hasQuery && !hasSegment) {
      setStores([]);
      setOffers([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      const term = hasQuery ? `%${debouncedQuery.trim()}%` : null;

      // Build stores query
      let storesQ = supabase
        .from("stores")
        .select("id, name, logo_url, category, address, taxonomy_segment_id, taxonomy_segments(name)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("is_active", true);
      if (term) storesQ = storesQ.ilike("name", term);
      if (selectedSegmentId) storesQ = storesQ.eq("taxonomy_segment_id", selectedSegmentId);
      storesQ = storesQ.limit(10);

      // Build offers query
      let offersQ = supabase
        .from("offers")
        .select("*, stores(name, logo_url, taxonomy_segment_id)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("status", "ACTIVE")
        .eq("is_active", true);
      if (term) offersQ = offersQ.ilike("title", term);
      if (selectedSegmentId) {
        // Filter offers by stores that belong to the segment
        const { data: segStores } = await supabase
          .from("stores")
          .select("id")
          .eq("branch_id", selectedBranch.id)
          .eq("brand_id", brand.id)
          .eq("is_active", true)
          .eq("taxonomy_segment_id", selectedSegmentId);
        const storeIds = (segStores || []).map((s: any) => s.id);
        if (storeIds.length === 0) {
          setStores([]);
          setOffers([]);
          setLoading(false);
          return;
        }
        offersQ = offersQ.in("store_id", storeIds);
      }
      offersQ = offersQ.limit(5);

      const [storesRes, offersRes] = await Promise.all([storesQ, offersQ]);

      setStores(storesRes.data || []);
      setOffers(offersRes.data || []);
      setLoading(false);
    };

    search();
  }, [debouncedQuery, brand, selectedBranch, selectedSegmentId]);

  const hasResults = stores.length > 0 || offers.length > 0;
  const hasQuery = debouncedQuery.trim().length > 0 || !!selectedSegmentId;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col"
          style={{ backgroundColor: "#FAFAFA" }}
        >
          {/* Search Header */}
          <div className="sticky top-0 z-10 bg-white">
            <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
              <div
                className="flex-1 flex items-center gap-2.5 rounded-full px-4 py-2.5"
                style={{ backgroundColor: "#F2F2F7" }}
              >
                <Search className="h-4 w-4 flex-shrink-0" style={{ color: `${fg}50` }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busque por lojas e ofertas"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
                  style={{ color: fg }}
                />
                {query && (
                  <button onClick={() => setQuery("")} className="p-0.5">
                    <X className="h-4 w-4" style={{ color: `${fg}40` }} />
                  </button>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-sm font-medium shrink-0"
                style={{ color: primary }}
              >
                Cancelar
              </button>
            </div>
            <div className="h-px" style={{ backgroundColor: `${fg}08` }} />

            {/* Segment chips */}
            {segments.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5">
                {segments.map((seg) => (
                  <button
                    key={seg.id}
                    onClick={() => setSelectedSegmentId(selectedSegmentId === seg.id ? null : seg.id)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
                    style={{
                      backgroundColor: selectedSegmentId === seg.id ? primary : `${fg}06`,
                      color: selectedSegmentId === seg.id ? "#fff" : `${fg}60`,
                    }}
                  >
                    {seg.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto max-w-lg mx-auto w-full px-4 py-4">
            {loading && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-white">
                    <Skeleton className="h-11 w-11 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3 rounded" />
                      <Skeleton className="h-3 w-1/3 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && hasQuery && !hasResults && (
              <div className="text-center py-16 opacity-40">
                <Search className="h-10 w-10 mx-auto mb-3" style={{ color: `${fg}30` }} />
                <p className="font-medium text-sm">Nenhum resultado para "{debouncedQuery}"</p>
                <p className="text-xs mt-1">Tente buscar por outro termo</p>
              </div>
            )}

            {!loading && !hasQuery && (
              <div className="text-center py-16 opacity-30">
                <Search className="h-10 w-10 mx-auto mb-3" />
                <p className="text-sm">Digite para buscar lojas e ofertas</p>
              </div>
            )}

            {!loading && stores.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: `${fg}40` }}>
                  Lojas
                </h3>
                <div className="space-y-1">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => { openStore(store); onClose(); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-black/[0.02] transition-colors text-left"
                      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    >
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                        style={{ backgroundColor: `${primary}10` }}
                      >
                        {store.logo_url ? (
                          <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <Store className="h-5 w-5" style={{ color: primary }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ fontFamily: fontHeading }}>{store.name}</p>
                        <p className="text-xs truncate" style={{ color: `${fg}50` }}>
                          {(store.taxonomy_segments as any)?.name || store.category || ""}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0" style={{ color: `${fg}25` }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!loading && offers.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: `${fg}40` }}>
                  Ofertas
                </h3>
                <div className="space-y-1">
                  {offers.map((offer) => (
                    <button
                      key={offer.id}
                      onClick={() => { openOffer(offer); onClose(); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white hover:bg-black/[0.02] transition-colors text-left"
                      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                    >
                      <div
                        className="h-11 w-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                        style={{ backgroundColor: `${primary}10` }}
                      >
                        {offer.image_url ? (
                          <img src={offer.image_url} alt={offer.title} className="h-full w-full object-cover rounded-xl" />
                        ) : (
                          <Tag className="h-5 w-5" style={{ color: primary }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ fontFamily: fontHeading }}>{offer.title}</p>
                        {offer.stores?.name && (
                          <p className="text-xs truncate" style={{ color: `${fg}50` }}>{offer.stores.name}</p>
                        )}
                      </div>
                      {Number(offer.value_rescue) > 0 && (
                        <span className="text-xs font-bold shrink-0 px-2 py-1 rounded-full" style={{ backgroundColor: `${primary}12`, color: primary }}>
                          R$ {Number(offer.value_rescue).toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
