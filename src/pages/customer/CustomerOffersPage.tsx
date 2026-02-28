import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { useCustomer } from "@/contexts/CustomerContext";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, Tag, Clock, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Offer = Tables<"offers">;

function hslToCss(hsl: string | undefined, fallback: string): string {
  if (!hsl) return fallback;
  return `hsl(${hsl})`;
}

export default function CustomerOffersPage() {
  const { brand, selectedBranch, theme } = useBrand();
  const { customer } = useCustomer();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  const primary = hslToCss(theme?.colors?.primary, "hsl(var(--primary))");
  const cardBg = hslToCss(theme?.colors?.card, "hsl(var(--card))");
  const fg = hslToCss(theme?.colors?.foreground, "hsl(var(--foreground))");
  const fontHeading = theme?.font_heading ? `"${theme.font_heading}", sans-serif` : "inherit";

  useEffect(() => {
    if (!selectedBranch || !brand) return;
    const fetchOffers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("offers")
        .select("*")
        .eq("branch_id", selectedBranch.id)
        .eq("brand_id", brand.id)
        .eq("status", "ACTIVE")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setOffers(data || []);
      setLoading(false);
    };
    fetchOffers();
  }, [selectedBranch, brand]);

  const handleRedeem = async (offer: Offer) => {
    if (!customer || !brand || !selectedBranch) return;
    setRedeeming(offer.id);
    try {
      const { error } = await supabase.from("redemptions").insert({
        offer_id: offer.id,
        customer_id: customer.id,
        brand_id: brand.id,
        branch_id: selectedBranch.id,
        status: "PENDING",
      });
      if (error) throw error;
      toast({ title: "Resgate solicitado!", description: "Apresente o código ao estabelecimento." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <h2 className="text-lg font-bold" style={{ fontFamily: fontHeading }}>Ofertas</h2>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border overflow-hidden" style={{ backgroundColor: cardBg }}>
            <Skeleton className="h-36 w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <h2 className="text-lg font-bold mb-4" style={{ fontFamily: fontHeading }}>Ofertas</h2>

      {offers.length === 0 ? (
        <div className="text-center py-16 opacity-50">
          <Tag className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Nenhuma oferta disponível</p>
          <p className="text-sm mt-1">Volte em breve para novas ofertas!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-xl border overflow-hidden shadow-sm"
              style={{ backgroundColor: cardBg, borderColor: `${fg}12` }}
            >
              {offer.image_url && (
                <img src={offer.image_url} alt={offer.title} className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <h3 className="font-semibold text-base mb-1" style={{ fontFamily: fontHeading }}>
                  {offer.title}
                </h3>
                {offer.description && (
                  <p className="text-sm opacity-60 mb-3 line-clamp-2">{offer.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {Number(offer.value_rescue) > 0 && (
                      <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: primary }}>
                        <ShoppingBag className="h-4 w-4" />
                        {Number(offer.value_rescue).toLocaleString("pt-BR")} pts
                      </div>
                    )}
                    {offer.end_at && (
                      <div className="flex items-center gap-1 text-xs opacity-50">
                        <Clock className="h-3 w-3" />
                        Até {new Date(offer.end_at).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </div>

                  {customer && (
                    <Button
                      size="sm"
                      disabled={redeeming === offer.id}
                      onClick={() => handleRedeem(offer)}
                      className="rounded-lg font-semibold"
                      style={{ backgroundColor: primary, color: "#fff" }}
                    >
                      {redeeming === offer.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                      Resgatar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
