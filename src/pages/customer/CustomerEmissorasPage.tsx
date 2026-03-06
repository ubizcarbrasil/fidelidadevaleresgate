import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { useCustomerFavoriteStores } from "@/hooks/useCustomerFavoriteStores";
import { useDebounce } from "@/hooks/useDebounce";
import { ArrowLeft, Heart, Search, Store, Star, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

interface EmissoraStore {
  id: string;
  name: string;
  logo_url: string | null;
  category: string | null;
  points_per_real: number | null;
  description: string | null;
  store_type: string;
}

interface Props {
  onBack: () => void;
}

export default function CustomerEmissorasPage({ onBack }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const { openStore } = useCustomerNav();
  const { isFavoriteStore, toggleFavoriteStore } = useCustomerFavoriteStores();
  const [stores, setStores] = useState<EmissoraStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const debouncedSearch = useDebounce(search, 250);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetchStores = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("stores")
        .select("id, name, logo_url, category, points_per_real, description, store_type")
        .eq("brand_id", brand.id)
        .eq("branch_id", selectedBranch.id)
        .eq("is_active", true)
        .eq("approval_status", "APPROVED")
        .in("store_type", ["EMISSORA", "MISTA"])
        .not("points_per_real", "is", null)
        .order("name");
      setStores((data as EmissoraStore[]) || []);
      setLoading(false);
    };
    fetchStores();
  }, [brand, selectedBranch]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    stores.forEach(s => { if (s.category) cats.add(s.category); });
    return Array.from(cats).sort();
  }, [stores]);

  const filtered = useMemo(() => {
    return stores.filter((s) => {
      const matchSearch = !debouncedSearch || s.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchFilter =
        activeFilter === "all" ||
        (activeFilter === "favorites" && isFavoriteStore(s.id)) ||
        (activeFilter !== "all" && activeFilter !== "favorites" && s.category === activeFilter);
      return matchSearch && matchFilter;
    });
  }, [stores, debouncedSearch, activeFilter, isFavoriteStore]);

  const FILTER_PILLS = [
    { key: "all", label: "Todos" },
    { key: "favorites", label: "♥ Favoritos" },
    ...categories.map(c => ({ key: c, label: c })),
  ];

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5">
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ fontFamily: fontHeading, color: fg }}>
            Compre e pontue
          </h1>
        </div>

        {/* Search bar */}
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar parceiro..."
               className="pl-9 pr-8 h-10 rounded-full border-none text-sm bg-muted"
             />
            {search && (
              <button
                onClick={() => setSearch("")}
                 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full flex items-center justify-center bg-muted-foreground/50"
               >
                <X className="h-3 w-3 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Filter pills - Livelo style */}
        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          {FILTER_PILLS.map((pill) => {
            const isActive = activeFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border"
                 style={{
                   backgroundColor: isActive ? primary : "hsl(var(--card))",
                   color: isActive ? "hsl(var(--primary-foreground, 0 0% 100%))" : fg,
                   borderColor: isActive ? primary : "hsl(var(--border))",
                 }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="h-px bg-border" />
      </header>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3">
          <p className="text-xs font-medium mb-3 text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "parceiro" : "parceiros"}
          </p>

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-[180px] rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
               <div className="h-16 w-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-muted">
                 <Store className="h-7 w-7 text-muted-foreground" />
               </div>
               <p className="text-sm font-medium text-muted-foreground">Nenhum parceiro encontrado</p>
              {activeFilter !== "all" && (
                <button
                  onClick={() => setActiveFilter("all")}
                  className="mt-2 text-xs font-bold"
                  style={{ color: primary }}
                >
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((store, idx) => (
                <motion.div
                  key={store.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                  className="rounded-2xl overflow-hidden cursor-pointer relative group active:scale-[0.98] transition-transform"
                   style={{
                     backgroundColor: "hsl(var(--card))",
                     boxShadow: "0 1px 6px hsl(var(--foreground) / 0.06), 0 0 0 1px hsl(var(--border))",
                   }}
                  onClick={() => openStore(store)}
                >
                  {/* Favorite heart */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteStore(store.id);
                    }}
                    className="absolute top-2.5 right-2.5 z-10 h-8 w-8 flex items-center justify-center rounded-full transition-colors"
                    style={{ backgroundColor: "hsl(var(--card) / 0.9)" }}
                  >
                    <Heart
                      className="h-4 w-4 transition-colors"
                      fill={isFavoriteStore(store.id) ? "#E5195F" : "none"}
                      stroke={isFavoriteStore(store.id) ? "#E5195F" : "#BBB"}
                      strokeWidth={2}
                    />
                  </button>

                  {/* Logo area */}
                  <div className="h-[100px] flex items-center justify-center px-5 pt-4 pb-1">
                    {store.logo_url ? (
                      <img
                        src={store.logo_url}
                        alt={store.name}
                        className="max-h-[64px] max-w-[120px] object-contain"
                      />
                    ) : (
                       <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-muted">
                         <Store className="h-7 w-7 text-muted-foreground" />
                       </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-3 pb-3 text-center">
                    <p className="text-xs font-semibold truncate mb-1.5" style={{ color: fg }}>
                      {store.name}
                    </p>

                    {/* Points badge */}
                    {store.points_per_real && (
                      <div
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: `${primary}12`,
                          color: primary,
                        }}
                      >
                        <Star className="h-2.5 w-2.5" fill={primary} stroke={primary} />
                        {Number(store.points_per_real).toFixed(0)} {Number(store.points_per_real) === 1 ? "ponto" : "pontos"} por R$
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
