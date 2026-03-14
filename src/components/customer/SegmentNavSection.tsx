import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { icons, Store, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";

interface CategoryItem {
  id: string;
  name: string;
  icon_name: string | null;
  store_count: number;
}

interface SegmentNavSectionProps {
  onSegmentClick: (categoryId: string, categoryName: string, iconName: string | null) => void;
  onSeeMore?: () => void;
}

function kebabToPascal(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function CategoryIcon({ iconName }: { iconName: string | null }) {
  const isDark = document.documentElement.classList.contains("dark");
  const color = isDark ? "hsl(var(--vb-gold))" : "#FFFFFF";
  if (!iconName) return <Store className="h-5 w-5" style={{ color }} />;
  if (iconName.startsWith("http")) {
    return <img src={iconName} alt="" className="h-5 w-5 object-contain" />;
  }
  const pascalName = kebabToPascal(iconName);
  const LucideIcon = (icons as Record<string, any>)[pascalName];
  if (!LucideIcon) return <Store className="h-5 w-5" style={{ color }} />;
  return <LucideIcon className="h-5 w-5" style={{ color }} />;
}

const containerVariants = {
  animate: { transition: { staggerChildren: 0.03 } },
};
const itemVariants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
};

export default function SegmentNavSection({ onSegmentClick, onSeeMore }: SegmentNavSectionProps) {
  const { brand, selectedBranch, theme } = useBrand();

  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.stores.list(brand?.id, selectedBranch?.id, "categories"),
    enabled: !!brand && !!selectedBranch,
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("taxonomy_segment_id, taxonomy_segments(id, name, icon_name, category_id, taxonomy_categories(id, name, icon_name))")
        .eq("branch_id", selectedBranch!.id)
        .eq("brand_id", brand!.id)
        .eq("is_active", true)
        .eq("approval_status", "APPROVED")
        .not("taxonomy_segment_id", "is", null);

      if (!data) return [];

      const map = new Map<string, CategoryItem>();
      for (const s of data) {
        const seg = s.taxonomy_segments as any;
        if (!seg?.taxonomy_categories) continue;
        const cat = seg.taxonomy_categories;
        const existing = map.get(cat.id);
        if (existing) {
          existing.store_count++;
        } else {
          map.set(cat.id, {
            id: cat.id,
            name: cat.name,
            icon_name: cat.icon_name || null,
            store_count: 1,
          });
        }
      }

      return Array.from(map.values())
        .sort((a, b) => b.store_count - a.store_count)
        .slice(0, 12);
    },
  });

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-4">
        <Skeleton className="h-5 w-28 rounded-lg mb-3" />
        <div className="flex gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[88px] w-[80px] rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length < 2) return null;

  return (
    <section className="max-w-lg mx-auto px-4 py-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-base font-bold"
          style={{ fontFamily: fontHeading, color: "hsl(var(--foreground))" }}
        >
          Categorias
        </h3>
        {onSeeMore && categories.length > 4 && (
          <button
            onClick={onSeeMore}
            className="text-xs font-bold flex items-center gap-0.5"
            style={{ color: "hsl(var(--vb-highlight))" }}
          >
            Ver mais
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal scroll */}
      <ScrollArea className="w-full">
        <motion.div
          className="flex gap-0 pb-2"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {categories.map((cat) => (
            <motion.button
              key={cat.id}
              variants={itemVariants}
              whileTap={{ scale: 0.92 }}
              className="flex flex-col items-center gap-1 flex-shrink-0"
              style={{ width: 68 }}
              onClick={() => onSegmentClick(cat.id, cat.name, cat.icon_name)}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "hsl(var(--vb-card-elevated))" }}
              >
                <CategoryIcon iconName={cat.icon_name} />
              </div>
              <span
                className="text-[9px] font-semibold text-center leading-tight line-clamp-2 w-full text-muted-foreground"
              >
                {cat.name}
              </span>
            </motion.button>
          ))}
        </motion.div>
        <ScrollBar orientation="horizontal" className="h-1" />
      </ScrollArea>
    </section>
  );
}
