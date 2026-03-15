import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { ArrowLeft, icons, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface DealCategory {
  id: string;
  name: string;
  icon_name: string;
  color: string;
  deal_count: number;
}

const ICON_ALIASES: Record<string, string> = { Home: "House" };

function kebabToPascal(name: string): string {
  return name.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function CatIcon({ iconName, color }: { iconName: string; color: string }) {
  const pascal = kebabToPascal(iconName);
  const resolved = ICON_ALIASES[pascal] || pascal;
  const Icon = (icons as Record<string, any>)[resolved] || Tag;
  return <Icon className="h-7 w-7" style={{ color }} />;
}

interface Props {
  onBack: () => void;
  onCategoryClick: (category: { id: string; name: string; icon_name: string; color: string }) => void;
}

export default function AchadinhoCategoryGridOverlay({ onBack, onCategoryClick }: Props) {
  const { brand, selectedBranch, theme } = useBrand();
  const [categories, setCategories] = useState<DealCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand) return;
    const fetch = async () => {
      setLoading(true);

      // Get categories
      const { data: cats } = await supabase
        .from("affiliate_deal_categories")
        .select("id, name, icon_name, color")
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .order("order_index");

      if (!cats?.length) { setCategories([]); setLoading(false); return; }

      // Get deals to count per category
      let dealsQuery = supabase
        .from("affiliate_deals")
        .select("category_id")
        .eq("brand_id", brand.id)
        .eq("is_active", true);
      if (selectedBranch) {
        dealsQuery = dealsQuery.or(`branch_id.eq.${selectedBranch.id},branch_id.is.null`);
      }
      const { data: deals } = await dealsQuery;

      const countMap = new Map<string, number>();
      (deals || []).forEach(d => {
        if (d.category_id) countMap.set(d.category_id, (countMap.get(d.category_id) || 0) + 1);
      });

      setCategories(
        cats
          .map(c => ({ ...c, deal_count: countMap.get(c.id) || 0 }))
          .filter(c => c.deal_count > 0)
      );
      setLoading(false);
    };
    fetch();
  }, [brand, selectedBranch]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="relative z-10 flex flex-col h-full"
        initial={{ x: "100%", opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.9 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background">
          <div className="max-w-lg mx-auto flex items-center gap-3 px-4 pt-4 pb-2">
            <button
              onClick={onBack}
              className="h-9 w-9 flex items-center justify-center rounded-xl transition-colors"
              style={{ backgroundColor: "hsl(var(--muted))" }}
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                Achadinhos
              </h1>
              <p className="text-xs font-semibold text-muted-foreground">
                Todas as categorias
              </p>
            </div>
          </div>
          <div className="h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto pb-8">
          <div className="max-w-lg mx-auto px-4 pt-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-12">Nenhuma categoria encontrada</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat, idx) => (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative flex flex-col justify-between rounded-2xl p-4 text-left transition-colors h-28"
                    style={{ backgroundColor: `${cat.color}12` }}
                    onClick={() => onCategoryClick(cat)}
                  >
                    <CatIcon iconName={cat.icon_name} color={cat.color} />
                    <div className="mt-auto">
                      <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: fontHeading }}>
                        {cat.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">{cat.deal_count} oferta{cat.deal_count !== 1 ? "s" : ""}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
