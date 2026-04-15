import React, { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, X, Store, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import CityOfferDetailOverlay from "./CityOfferDetailOverlay";
import type { OfertaCidade } from "./SecaoResgateCidade";
import { formatPoints } from "@/lib/formatPoints";
import { Coins } from "lucide-react";
import { useDriverSession } from "@/contexts/DriverSessionContext";

interface StoreItem {
  id: string;
  name: string;
  logo_url: string | null;
  segment: string | null;
  address: string | null;
}

interface Props {
  brandId: string;
  branchId: string;
  fontHeading?: string;
  onBack: () => void;
}

export default function DriverCityPartnersPage({ brandId, branchId, fontHeading, onBack }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [selectedCityOffer, setSelectedCityOffer] = useState<OfertaCidade | null>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { driver, refreshDriver } = useDriverSession();

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["city-partners", brandId, branchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("stores")
        .select("id, name, logo_url, segment, address")
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .eq("is_active", true)
        .eq("approval_status", "APPROVED")
        .order("name");
      return (data || []) as StoreItem[];
    },
  });

  const { data: storeOffers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ["city-partner-offers", brandId, branchId, selectedStore?.id],
    queryFn: async () => {
      if (!selectedStore) return [];
      const { data } = await supabase
        .from("offers")
        .select("id, title, image_url, value_rescue, min_purchase, offer_purpose, store_id, stores(name, logo_url)")
        .eq("brand_id", brandId)
        .eq("branch_id", branchId)
        .eq("store_id", selectedStore.id)
        .eq("is_active", true)
        .eq("status", "ACTIVE")
        .in("offer_purpose", ["REDEEM", "BOTH"])
        .order("created_at", { ascending: false })
        .limit(50);
      return (data || []).map((o: any) => ({
        id: o.id,
        title: o.title,
        image_url: o.image_url,
        value_rescue: o.value_rescue,
        min_purchase: o.min_purchase,
        offer_purpose: o.offer_purpose,
        store_name: o.stores?.name || selectedStore.name,
        store_logo_url: o.stores?.logo_url || selectedStore.logo_url,
        pointsCost: Math.ceil(o.value_rescue || 0),
      })) as OfertaCidade[];
    },
    enabled: !!selectedStore,
  });

  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return stores;
    const q = debouncedSearch.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.segment?.toLowerCase().includes(q)
    );
  }, [stores, debouncedSearch]);

  // Store detail view
  if (selectedStore && !selectedCityOffer) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-border bg-background">
          <button onClick={() => setSelectedStore(null)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedStore.logo_url ? (
              <img src={selectedStore.logo_url} alt={selectedStore.name} className="h-8 w-8 rounded-lg object-contain bg-muted/30" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center">
                <Store className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate" style={{ fontFamily: fontHeading }}>{selectedStore.name}</h1>
              {selectedStore.segment && <p className="text-[10px] text-muted-foreground truncate">{selectedStore.segment}</p>}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loadingOffers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : storeOffers.length === 0 ? (
            <div className="text-center pt-12">
              <Store className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma oferta disponível neste parceiro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {storeOffers.map((oferta) => (
                <div
                  key={oferta.id}
                  onClick={() => setSelectedCityOffer(oferta)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card cursor-pointer active:scale-[0.98] transition-transform"
                  style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.05)" }}
                >
                  <div className="h-14 w-14 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {oferta.store_logo_url ? (
                      <img src={oferta.store_logo_url} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <Store className="h-6 w-6 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold line-clamp-2 mb-1" style={{ fontFamily: fontHeading }}>
                      {oferta.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      <Coins className="h-3 w-3" style={{ color: "hsl(var(--primary))" }} />
                      <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>
                        {formatPoints(oferta.pointsCost)} pts
                      </span>
                    </div>
                    {oferta.value_rescue != null && oferta.value_rescue > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        Crédito de R$ {Number(oferta.value_rescue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Offer detail overlay
  if (selectedCityOffer) {
    return (
      <CityOfferDetailOverlay
        oferta={selectedCityOffer}
        fontHeading={fontHeading}
        onBack={() => setSelectedCityOffer(null)}
        onRedeemSuccess={() => refreshDriver()}
      />
    );
  }

  // Main partners list
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3 border-b border-border bg-background">
        <button onClick={onBack} className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted">
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-base font-bold text-foreground" style={{ fontFamily: fontHeading }}>
          Parceiros da Cidade
        </h1>
      </header>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar parceiro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-9 h-10 rounded-xl bg-muted border-0 text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-12">
            <Store className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {debouncedSearch ? "Nenhum parceiro encontrado" : "Nenhum parceiro disponível"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((store) => (
              <div
                key={store.id}
                onClick={() => setSelectedStore(store)}
                className="flex items-center gap-3 p-3 rounded-xl bg-card cursor-pointer active:scale-[0.98] transition-transform"
                style={{ boxShadow: "0 1px 6px hsl(var(--foreground) / 0.05)" }}
              >
                <div className="h-12 w-12 rounded-xl bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {store.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="h-full w-full object-contain" />
                  ) : (
                    <Store className="h-6 w-6 text-muted-foreground/30" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate" style={{ fontFamily: fontHeading }}>
                    {store.name}
                  </h3>
                  {store.segment && (
                    <p className="text-[10px] text-muted-foreground truncate">{store.segment}</p>
                  )}
                  {store.address && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-muted-foreground/50" />
                      <p className="text-[9px] text-muted-foreground/70 truncate">{store.address}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
