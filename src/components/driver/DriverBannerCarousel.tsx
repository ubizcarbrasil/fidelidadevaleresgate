import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, useCallback } from "react";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  link_url: string | null;
}

export default function DriverBannerCarousel({ brandId }: { brandId: string }) {
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
      return (data || []) as Banner[];
    },
  });

  const count = banners?.length ?? 0;

  // Auto-advance
  useEffect(() => {
    if (count <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % count);
    }, 4000);
    return () => clearInterval(interval);
  }, [count]);

  // Reset index if banners change
  useEffect(() => {
    if (current >= count) setCurrent(0);
  }, [count, current]);

  const handleClick = useCallback((url: string | null) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  if (!count) return null;

  const banner = banners![current];

  return (
    <div className="px-4 pt-4">
      <div
        className="relative h-40 rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => handleClick(banner.link_url)}
      >
        <img
          src={banner.image_url}
          alt={banner.title || "Banner"}
          className="w-full h-full object-cover"
        />

        {count > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners!.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 16 : 6,
                  backgroundColor: i === current ? "white" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
