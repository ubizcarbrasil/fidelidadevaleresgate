import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useEffect, useState } from "react";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
}

export default function DriverBannerCarousel({ brandId }: { brandId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  const { data: banners } = useQuery({
    queryKey: ["driver-banners", brandId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("banner_schedules")
        .select("id, image_url, title, link_url")
        .eq("brand_id", brandId)
        .eq("is_active", true)
        .lte("start_at", now)
        .order("order_index")
        .limit(10);
      // Filter out expired banners client-side
      return (data || []) as Banner[];
    },
  });

  // Auto-scroll
  useEffect(() => {
    if (!banners?.length || banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.children[next]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [banners?.length]);

  if (!banners?.length) return null;

  return (
    <div className="px-4 pt-4">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide rounded-2xl"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="min-w-full flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
            style={{ scrollSnapAlign: "start" }}
            onClick={() => b.link_url && window.open(b.link_url, "_blank", "noopener,noreferrer")}
          >
            <img
              src={b.image_url}
              alt={b.title || "Banner"}
              className="w-full h-36 object-cover rounded-2xl"
              loading={i === 0 ? "eager" : "lazy"}
            />
          </div>
        ))}
      </div>
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {banners.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === current ? 16 : 6,
                backgroundColor: i === current ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
