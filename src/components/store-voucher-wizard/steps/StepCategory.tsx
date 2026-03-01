import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StoreVoucherData } from "../types";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { icons } from "lucide-react";
import { useState } from "react";

interface Props {
  data: StoreVoucherData;
  update: (p: Partial<StoreVoucherData>) => void;
}

interface TaxCategory {
  id: string;
  name: string;
  icon_name: string | null;
}

interface TaxSegment {
  id: string;
  name: string;
  icon_name: string | null;
  category_id: string;
}

function LucideIcon({ name, className }: { name: string | null; className?: string }) {
  if (!name) return null;
  const Icon = (icons as any)[name];
  return Icon ? <Icon className={className} /> : null;
}

export default function StepCategory({ data, update }: Props) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const { data: categories, isLoading: loadingCats } = useQuery({
    queryKey: ["taxonomy-categories-wizard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("taxonomy_categories")
        .select("id, name, icon_name")
        .eq("is_active", true)
        .order("order_index");
      return (data || []) as TaxCategory[];
    },
  });

  const { data: segments, isLoading: loadingSegs } = useQuery({
    queryKey: ["taxonomy-segments-wizard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("taxonomy_segments")
        .select("id, name, icon_name, category_id")
        .eq("is_active", true)
        .order("name");
      return (data || []) as TaxSegment[];
    },
  });

  const isLoading = loadingCats || loadingSegs;

  const handleSelectSegment = (seg: TaxSegment, catName: string) => {
    update({
      coupon_category: catName,
      taxonomy_segment_id: seg.id,
    });
  };

  const selectedSegment = segments?.find(s => s.id === data.taxonomy_segment_id);

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Categoria do Cupom</Label>
      <p className="text-sm text-muted-foreground">Selecione a categoria e o segmento do cupom.</p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Selected segment badge */}
          {selectedSegment && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-primary bg-primary/5">
              <LucideIcon name={selectedSegment.icon_name} className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{data.coupon_category} → {selectedSegment.name}</span>
              <button
                type="button"
                onClick={() => {
                  update({ coupon_category: "", taxonomy_segment_id: "" });
                  setExpandedCat(null);
                }}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground"
              >
                Alterar
              </button>
            </div>
          )}

          {!selectedSegment && (
            <div className="grid grid-cols-2 gap-2">
              {(categories || []).map(cat => {
                const isExpanded = expandedCat === cat.id;
                const catSegments = (segments || []).filter(s => s.category_id === cat.id);

                return (
                  <div key={cat.id} className={isExpanded ? "col-span-2" : ""}>
                    <button
                      type="button"
                      onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                      className={`w-full flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                        isExpanded
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <LucideIcon name={cat.icon_name} className="h-4 w-4 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </button>

                    {isExpanded && catSegments.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 mt-2 pl-2">
                        {catSegments.map(seg => (
                          <button
                            key={seg.id}
                            type="button"
                            onClick={() => handleSelectSegment(seg, cat.name)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors text-left ${
                              data.taxonomy_segment_id === seg.id
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border bg-card hover:border-primary/50"
                            }`}
                          >
                            <LucideIcon name={seg.icon_name} className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{seg.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
