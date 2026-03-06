import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { icons, Store } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SegmentItem {
  id: string;
  name: string;
  category_name: string;
  icon_name: string | null;
  category_icon_name: string | null;
  store_count: number;
}

interface SegmentNavSectionProps {
  onSegmentClick: (segmentId: string, segmentName: string) => void;
}

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

function segmentColor(name: string): string {
  const colors = [
    "#FF6B35", "#E91E63", "#7C3AED", "#059669",
    "#D97706", "#0EA5E9", "#6366F1", "#EC4899",
    "#14B8A6", "#F59E0B", "#8B5CF6", "#EF4444",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function kebabToPascal(name: string): string {
  return name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function SegmentIcon({ iconName, color }: { iconName: string | null; color: string }) {
  if (!iconName) return <Store className="h-6 w-6" style={{ color }} />;
  // Support custom image URLs from icon gallery
  if (iconName.startsWith("http")) {
    return <img src={iconName} alt="" className="h-6 w-6 object-contain" />;
  }
  const pascalName = kebabToPascal(iconName);
  const LucideIcon = (icons as Record<string, any>)[pascalName];
  if (!LucideIcon) return <Store className="h-6 w-6" style={{ color }} />;
  return <LucideIcon className="h-6 w-6" style={{ color }} />;
}

export default function SegmentNavSection({ onSegmentClick }: SegmentNavSectionProps) {
  const { brand, selectedBranch, theme } = useBrand();
  const [segments, setSegments] = useState<SegmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!brand || !selectedBranch) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("stores")
        .select("taxonomy_segment_id, taxonomy_segments(id, name, icon_name, taxonomy_categories(name, icon_name))")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("is_active", true)
        .not("taxonomy_segment_id", "is", null);

      if (!data) { setLoading(false); return; }

      const map = new Map<string, SegmentItem>();
      for (const s of data) {
        const seg = s.taxonomy_segments as any;
        if (!seg) continue;
        const existing = map.get(seg.id);
        if (existing) {
          existing.store_count++;
        } else {
          map.set(seg.id, {
            id: seg.id,
            name: seg.name,
            category_name: seg.taxonomy_categories?.name || "",
            icon_name: seg.icon_name || null,
            category_icon_name: seg.taxonomy_categories?.icon_name || null,
            store_count: 1,
          });
        }
      }

      setSegments(
        Array.from(map.values())
          .sort((a, b) => b.store_count - a.store_count)
          .slice(0, 16)
      );
      setLoading(false);
    };
    fetch();
  }, [brand, selectedBranch]);

  if (loading) {
    return (
      <section className="max-w-lg mx-auto px-5">
        <Skeleton className="h-5 w-28 rounded-lg mb-3" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-14 w-14 rounded-2xl" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (segments.length < 2) return null;

  const useScroll = segments.length > 8;

  const segmentItems = segments.map((seg, idx) => {
    const color = segmentColor(seg.name);
    const iconName = seg.icon_name || seg.category_icon_name;
    return (
      <motion.button
        key={seg.id}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: idx * 0.03, duration: 0.25 }}
        whileTap={{ scale: 0.9 }}
        className="flex flex-col items-center gap-1.5"
        style={{ minWidth: useScroll ? 72 : undefined }}
        onClick={() => onSegmentClick(seg.id, seg.name)}
      >
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center relative"
          style={{ backgroundColor: `${color}20` }}
        >
          <SegmentIcon iconName={iconName} color={color} />
          {/* Store count badge */}
          <span
            className="absolute -top-1 -right-1 h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: color, fontSize: 9 }}
          >
            {seg.store_count}
          </span>
        </div>
        <span
          className="text-[11px] font-semibold text-center leading-tight line-clamp-2"
          style={{ color: `${fg}70` }}
        >
          {seg.name}
        </span>
      </motion.button>
    );
  });

  return (
    <section className="max-w-lg mx-auto px-5">
      <h3 className="text-sm font-bold mb-3" style={{ fontFamily: fontHeading }}>
        Categorias
      </h3>
      {useScroll ? (
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {segmentItems}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="grid grid-cols-4 gap-x-3 gap-y-4">
          {segmentItems}
        </div>
      )}
    </section>
  );
}
