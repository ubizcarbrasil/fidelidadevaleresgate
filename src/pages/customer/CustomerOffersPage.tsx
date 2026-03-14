import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { Search, Heart, ShoppingBag, Store, Sparkles, Clock, ThumbsUp, Percent } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import EmptyState from "@/components/customer/EmptyState";
import SafeImage from "@/components/customer/SafeImage";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function withAlpha(hslColor: string, alpha: number): string {
  const inner = hslColor.match(/hsl\((.+)\)/)?.[1];
  if (!inner) return hslColor;
  return `hsl(${inner} / ${alpha})`;
}

export default function CustomerOffersPage() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const { openOffer, isFavorite, toggleFavorite, activeSegmentFilter, clearSegmentFilter } = useCustomerNav();
  const [offers, setOffers] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [segments, setSegments] = useState<{ id: string; name: string }[]>([]);

  // Sync external segment filter from context (e.g. from home category tap)
  useEffect(() => {
    if (activeSegmentFilter) {
      setSelectedSegmentId(activeSegmentFilter);
      clearSegmentFilter();
    }
  }, [activeSegmentFilter, clearSegmentFilter]);

  const primary = hslToCss(theme?.colors?.secondary, "") || hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  // Load segments for stores with active offers in the branch
  useEffect(() => {
    if (!selectedBranch || !brand) return;
    const fetchSegments = async () => {
      const { data } = await supabase
        .from("stores")
        .select("taxonomy_segment_id, taxonomy_segments(id, name)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .not("taxonomy_segment_id", "is", null);
      if (!data) return;
      const segMap = new Map<string, { id: string; name: string }>();
      for (const s of data) {
        const seg = s.taxonomy_segments as { id: string; name: string } | null;
        if (seg && !segMap.has(seg.id)) {
          segMap.set(seg.id, { id: seg.id, name: seg.name });
        }
      }
      setSegments(Array.from(segMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    };
    fetchSegments();
  }, [selectedBranch, brand]);

  const filtered = useMemo(() => {
    let result = offers;
    if (selectedSegmentId) {
      result = result.filter((o) => (o.stores as Record<string, unknown> | null)?.taxonomy_segment_id === selectedSegmentId);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter((o) => {
        const title = (o.title as string || "").toLowerCase();
        const desc = (o.description as string || "").toLowerCase();
        const storeName = ((o.stores as Record<string, unknown> | null)?.name as string || "").toLowerCase();
        return title.includes(q) || desc.includes(q) || storeName.includes(q);
      });
    }
    return result;
  }, [offers, selectedSegmentId, query]);

  useEffect(() => {
    if (!selectedBranch || !brand) return;
    const fetchOffers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("offers")
        .select("*, stores(name, logo_url, taxonomy_segment_id)")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("status", "ACTIVE")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setOffers(data || []);
      setLoading(false);
    };
    fetchOffers();
  }, [selectedBranch, brand]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-4 space-y-3">
        <Skeleton className="h-10 w-full rounded-full" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 p-3 rounded-2xl bg-card" style={{ boxShadow: "0 1px 4px hsl(var(--foreground) / 0.04)" }}>
            <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-16 rounded" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-4">
      {/* Search */}
      <div
        className="flex items-center gap-2.5 rounded-full px-4 py-2.5 mb-4 bg-muted"
      >
        <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar ofertas e parceiros..."
          className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Segment chips */}
      {segments.length >= 2 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5">
          <button
            onClick={() => setSelectedSegmentId(null)}
            className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor: !selectedSegmentId ? primary : "hsl(var(--muted))",
              color: !selectedSegmentId ? "#fff" : "hsl(var(--muted-foreground))",
            }}
          >
            Todas
          </button>
          {segments.map((seg) => (
            <button
              key={seg.id}
              onClick={() => setSelectedSegmentId(selectedSegmentId === seg.id ? null : seg.id)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                backgroundColor: selectedSegmentId === seg.id ? primary : "hsl(var(--muted))",
                color: selectedSegmentId === seg.id ? "#fff" : "hsl(var(--muted-foreground))",
              }}
            >
              {seg.name}
            </button>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs mb-3 text-muted-foreground">
        {filtered.length} oferta{filtered.length !== 1 ? "s" : ""} disponíve{filtered.length !== 1 ? "is" : "l"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          type="offers"
          primary={primary}
          ctaLabel={query || selectedSegmentId ? "Limpar filtros" : undefined}
          onCta={query || selectedSegmentId ? () => { setQuery(""); setSelectedSegmentId(null); } : undefined}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((offer, idx) => {
            const isNew = idx < 2;
            const hasDiscount = Number(offer.discount_percent) > 0;
            const hasCashback = Number(offer.value_rescue) > 0;
            const daysLeft = offer.end_at
              ? Math.max(0, Math.ceil((new Date(offer.end_at).getTime() - Date.now()) / 86400000))
              : null;
            const isUrgent = daysLeft !== null && daysLeft <= 3;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
                className="flex gap-3 p-3 rounded-2xl bg-card cursor-pointer relative"
                style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.05)" }}
                onClick={() => openOffer(offer)}
              >
                {/* Image */}
                <div className="relative flex-shrink-0">
                  <SafeImage
                    src={offer.image_url}
                    fallbackSrc={offer.stores?.logo_url}
                    alt={offer.title}
                    className="h-20 w-20 rounded-xl object-cover"
                    fallback={
                      <div
                        className="h-20 w-20 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: withAlpha(primary, 0.08) }}
                      >
                        <ShoppingBag className="h-8 w-8" style={{ color: withAlpha(primary, 0.3) }} />
                      </div>
                    }
                  />
                  {/* Badges on image */}
                  <div className="absolute top-1 left-1 flex flex-col gap-0.5">
                    {isNew && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: primary }}>
                        <Sparkles className="h-2.5 w-2.5" /> NOVO
                      </span>
                    )}
                    {isUrgent && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white" style={{ backgroundColor: "hsl(0 72% 51%)" }}>
                        <Clock className="h-2.5 w-2.5" /> {daysLeft === 0 ? "HOJE" : `${daysLeft}d`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  {/* Store name */}
                  {offer.stores?.name && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <SafeImage
                        src={offer.stores.logo_url}
                        alt=""
                        className="h-4 w-4 rounded object-cover"
                        fallback={<Store className="h-3 w-3 text-muted-foreground" />}
                      />
                      <span className="text-[11px] font-medium truncate text-muted-foreground">
                        {offer.stores.name}
                      </span>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-bold text-sm leading-tight line-clamp-2" style={{ fontFamily: fontHeading }}>
                    {offer.title}
                  </h3>

                  {/* Price row */}
                  <div className="flex items-center gap-2 mt-auto">
                    {hasCashback && (
                      <div className="flex items-center gap-1">
                        <span className="text-base font-bold" style={{ color: "hsl(var(--vb-highlight))", fontFamily: fontHeading }}>
                          {Number(offer.value_rescue).toLocaleString("pt-BR")} pts
                        </span>
                        {Number(offer.min_purchase) > 0 && (
                          <span className="text-[10px] line-through text-muted-foreground">
                            {Number(offer.min_purchase).toLocaleString("pt-BR")} pts
                          </span>
                        )}
                      </div>
                    )}
                    {hasDiscount && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{ backgroundColor: "hsl(var(--vb-highlight) / 0.12)", color: "hsl(var(--vb-highlight))" }}
                      >
                        {offer.discount_percent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side: likes + favorite */}
                <div className="flex flex-col items-end justify-between flex-shrink-0 py-0.5">
                  <motion.button
                    whileTap={{ scale: 1.3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 12 }}
                    className="h-7 w-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: isFavorite(offer.id) ? withAlpha(primary, 0.12) : "hsl(var(--foreground) / 0.06)" }}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(offer.id); }}
                  >
                    <Heart
                      className="h-3.5 w-3.5"
                      fill={isFavorite(offer.id) ? primary : "none"}
                      style={{ color: isFavorite(offer.id) ? primary : "hsl(var(--muted-foreground))" }}
                    />
                  </motion.button>
                  {offer.likes_count > 0 && (
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <ThumbsUp className="h-2.5 w-2.5" />
                      {offer.likes_count}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}