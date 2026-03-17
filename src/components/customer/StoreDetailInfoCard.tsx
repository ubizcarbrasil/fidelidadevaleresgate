import React from "react";
import { MapPin, MessageCircle, Phone, Instagram, Globe, Navigation } from "lucide-react";
import OperatingHoursDisplay from "@/components/customer/OperatingHoursDisplay";
import { brandAlpha } from "@/lib/utils";

interface Props {
  store: {
    address: string | null;
    description: string | null;
    whatsapp: string | null;
    instagram: string | null;
    site_url: string | null;
    operating_hours_json: unknown;
  };
  primary: string;
  fg: string;
}

const StoreDetailInfoCard = React.memo(function StoreDetailInfoCard({ store, primary, fg }: Props) {
  const whatsappUrl = store.whatsapp
    ? `https://wa.me/${store.whatsapp.replace(/\D/g, "")}`
    : null;

  return (
    <div
      className="relative -mt-4 mx-4 rounded-[20px] bg-card p-5"
      style={{ boxShadow: "0 4px 20px hsl(var(--foreground) / 0.05)" }}
    >
      {store.address && (
        <div className="flex items-start gap-3 mb-3">
          <div
            className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: brandAlpha(primary, 0.06) }}
          >
            <MapPin className="h-4 w-4" style={{ color: primary }} />
          </div>
          <div>
            <p className="text-xs font-semibold">Endereço</p>
            <p className="text-xs" style={{ color: brandAlpha(fg, 0.33) }}>{store.address}</p>
          </div>
        </div>
      )}

      {store.description && (
        <p className="text-xs leading-relaxed mt-3" style={{ color: brandAlpha(fg, 0.40) }}>
          {store.description}
        </p>
      )}

      {store.operating_hours_json != null && Array.isArray(store.operating_hours_json) && (store.operating_hours_json as any[]).length > 0 && (
        <OperatingHoursDisplay
          hours={store.operating_hours_json as any[]}
          primary={primary}
          fg={fg}
        />
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white min-w-[120px]"
            style={{ backgroundColor: "#25D366" }}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        )}
        {store.whatsapp && (
          <a
            href={`tel:${store.whatsapp}`}
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm"
            style={{ backgroundColor: brandAlpha(fg, 0.03), color: brandAlpha(fg, 0.44) }}
          >
            <Phone className="h-4 w-4" />
            Ligar
          </a>
        )}
        {store.instagram && (
          <a
            href={store.instagram.startsWith("http") ? store.instagram : `https://instagram.com/${store.instagram.replace("@", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm text-white"
            style={{ background: "linear-gradient(135deg, #833AB4, #E1306C, #F77737)" }}
          >
            <Instagram className="h-4 w-4" />
            Instagram
          </a>
        )}
        {store.site_url && (
          <a
            href={store.site_url.startsWith("http") ? store.site_url : `https://${store.site_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm"
            style={{ backgroundColor: brandAlpha(primary, 0.07), color: primary }}
          >
            <Globe className="h-4 w-4" />
            Site
          </a>
        )}
        {store.address && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-5 rounded-2xl font-semibold text-sm"
            style={{ backgroundColor: "#4285F412", color: "#4285F4" }}
          >
            <Navigation className="h-4 w-4" />
            Ir até lá
          </a>
        )}
      </div>
    </div>
  );
});

export default StoreDetailInfoCard;
