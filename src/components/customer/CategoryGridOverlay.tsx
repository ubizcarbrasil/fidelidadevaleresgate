import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { ArrowLeft, icons, Store } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryItem {
  id: string;
  name: string;
  icon_name: string | null;
  store_count: number;
}

interface CategoryGridOverlayProps {
  onBack: () => void;
  onCategoryClick: (category: CategoryItem) => void;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function kebabToPascal(name: string): string {
  return name.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function CatIcon({ iconName, color }: { iconName: string | null; color: string }) {
  if (!iconName) return <Store className="h-6 w-6" style={{ color }} />;
  if (iconName.startsWith("http")) return <img src={iconName} alt="" className="h-6 w-6 object-contain" />;
  const LucideIcon = (icons as Record<string, any>)[kebabToPascal(iconName)];
  if (!LucideIcon) return <Store className="h-6 w-6" style={{ color }} />;
  return <LucideIcon className="h-6 w-6" style={{ color }} />;
}

export default function CategoryGridOverlay({ onBack, onCategoryClick }: CategoryGridOverlayProps) {
  const { brand, selectedBranch, theme } = useBrand();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("stores")
        .select("taxonomy_segment_id, taxonomy_segments(id, taxonomy_categories(id, name, icon_name))")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .not("taxonomy_segment_id", "is", null);

      if (!data) { setLoading(false); return; }

      const map = new Map<string, CategoryItem>();
      for (const s of data) {
        const seg = s.taxonomy_segments as any;
        if (!seg?.taxonomy_categories) continue;
        const cat = seg.taxonomy_categories;
        const existing = map.get(cat.id);
        if (existing) existing.store_count++;
        else map.set(cat.id, { id: cat.id, name: cat.name, icon_name: cat.icon_name || null, store_count: 1 });
      }

      setCategories(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    };
    fetchAll();
  }, [brand, selectedBranch]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Sliding content */}
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
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" style={{ color: fg }} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>
              Categorias
            </h1>
            <p className="text-[11px]" style={{ color: `${fg}50` }}>
              Todas as categorias disponíveis
            </p>
          </div>
        </div>
        <div className="h-px" style={{ backgroundColor: `${fg}08` }} />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="max-w-lg mx-auto px-4 pt-4">
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat, idx) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.25 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-3 rounded-2xl p-4 text-left transition-colors"
                  style={{ backgroundColor: "hsl(var(--muted))" }}
                  onClick={() => onCategoryClick(cat)}
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${primary}12` }}
                  >
                    <CatIcon iconName={cat.icon_name} color={primary} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate" style={{ fontFamily: fontHeading }}>
                      {cat.name}
                    </h3>
                    <p className="text-[10px]" style={{ color: `${fg}50` }}>
                      {cat.store_count} {cat.store_count === 1 ? "loja" : "lojas"}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
