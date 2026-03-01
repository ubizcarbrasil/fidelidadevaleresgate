import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomerNav } from "@/components/customer/CustomerLayout";
import { useCustomerFavoriteStores } from "@/hooks/useCustomerFavoriteStores";
import { useDebounce } from "@/hooks/useDebounce";
import { ArrowLeft, Heart, Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
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

  const filtered = stores.filter((s) => {
    const matchSearch = !debouncedSearch || s.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchFav = !showFavoritesOnly || isFavoriteStore(s.id);
    return matchSearch && matchFav;
  });

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
          <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5">
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>
          <h1 className="text-lg font-bold flex-1" style={{ fontFamily: fontHeading }}>
            Parceiros que pontuam
          </h1>
        </div>

        {/* Search + Filter */}
        <div className="max-w-lg mx-auto px-4 pb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar parceiro..."
              className="pl-9 h-10 rounded-full bg-muted border-none"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="h-10 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
            style={{
              backgroundColor: showFavoritesOnly ? `${primary}15` : "#F2F2F7",
              color: showFavoritesOnly ? primary : `${fg}70`,
            }}
          >
            <Heart className="h-3.5 w-3.5" fill={showFavoritesOnly ? primary : "none"} />
            Favoritos
          </button>
        </div>
        <Separator />
      </header>

      {/* List */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-3">
          <p className="text-xs font-medium mb-3" style={{ color: `${fg}50` }}>
            {filtered.length} {filtered.length === 1 ? "parceiro" : "parceiros"}
          </p>

          {loading ? (
            <div className="space-y-0">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <Skeleton className="h-14 w-14 rounded-2xl flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-28 rounded mb-1.5" />
                    <Skeleton className="h-3 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum parceiro encontrado</p>
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
              {filtered.map((store, idx) => (
                <div key={store.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer active:bg-black/[0.02] transition-colors"
                    onClick={() => openStore(store)}
                  >
                    {store.logo_url ? (
                      <div className="h-[52px] w-[52px] rounded-xl overflow-hidden bg-muted flex-shrink-0" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                        <img src={store.logo_url} alt={store.name} className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-[52px] w-[52px] rounded-xl flex items-center justify-center bg-muted flex-shrink-0">
                        <Store className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: fg }}>
                        {store.name}
                      </p>
                      {store.points_per_real && (
                        <p className="text-xs mt-0.5" style={{ color: `${fg}70` }}>
                          {Number(store.points_per_real).toFixed(0)} {Number(store.points_per_real) === 1 ? "ponto" : "pontos"} por R$ 1
                        </p>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteStore(store.id);
                      }}
                      className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors flex-shrink-0"
                    >
                      <Heart
                        className="h-5 w-5 transition-colors"
                        fill={isFavoriteStore(store.id) ? "#EF4444" : "none"}
                        stroke={isFavoriteStore(store.id) ? "#EF4444" : `${fg}40`}
                        strokeWidth={1.8}
                      />
                    </button>
                  </motion.div>
                  {idx < filtered.length - 1 && (
                    <Separator className="ml-[76px] mr-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
}
