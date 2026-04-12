import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Smartphone } from "lucide-react";
import type { NativeSectionConfig } from "@/components/page-builder-v2/PageSectionsEditor";
import { toast } from "sonner";

const DEFAULT_NATIVE_SECTIONS: NativeSectionConfig[] = [
  { key: "BANNERS", label: "Banners", enabled: true, order: 0 },
  { key: "CATEGORIES", label: "Categorias", enabled: true, order: 1 },
  { key: "FOR_YOU", label: "Selecionado para Você", enabled: true, order: 2 },
  { key: "EMISSORAS", label: "Compre e Pontue", enabled: true, order: 3 },
  { key: "COMPRE_COM_PONTOS", label: "Compre com Pontos", enabled: true, order: 4 },
  { key: "ACHADINHOS", label: "Achadinhos", enabled: true, order: 5 },
];

const SECTION_MODULE_MAP: Record<string, string> = {
  ACHADINHOS: "affiliate_deals",
  COMPRE_COM_PONTOS: "customer_product_redeem",
  EMISSORAS: "offers",
  BANNERS: "banners",
  CATEGORIES: "categories",
};

interface Props {
  brandId: string;
  isModuleEnabled: (key: string) => boolean;
}

export default function HomeSectionOrderEditor({ brandId, isModuleEnabled }: Props) {
  const qc = useQueryClient();

  const { data: brand } = useQuery({
    queryKey: ["brand-home-layout", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("home_layout_json")
        .eq("id", brandId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  const nativeSections: NativeSectionConfig[] = (() => {
    const layout = brand?.home_layout_json as any;
    if (layout?.native_sections && Array.isArray(layout.native_sections)) {
      return [...layout.native_sections].sort((a: NativeSectionConfig, b: NativeSectionConfig) => a.order - b.order);
    }
    return DEFAULT_NATIVE_SECTIONS;
  })();

  // Filter to only show sections whose module is enabled (or has no module mapping)
  const visibleSections = nativeSections.filter(ns => {
    const moduleKey = SECTION_MODULE_MAP[ns.key];
    if (moduleKey && !isModuleEnabled(moduleKey)) return false;
    return true;
  });

  const handleMove = async (idx: number, direction: "up" | "down") => {
    const sorted = [...nativeSections].sort((a, b) => a.order - b.order);
    // Find the visible section in the full sorted list
    const visSection = visibleSections[idx];
    const fullIdx = sorted.findIndex(s => s.key === visSection.key);
    
    // Find next visible section in the desired direction
    let targetFullIdx = fullIdx;
    const step = direction === "up" ? -1 : 1;
    targetFullIdx += step;
    while (targetFullIdx >= 0 && targetFullIdx < sorted.length) {
      const targetModuleKey = SECTION_MODULE_MAP[sorted[targetFullIdx].key];
      if (!targetModuleKey || isModuleEnabled(targetModuleKey)) break;
      targetFullIdx += step;
    }
    
    if (targetFullIdx < 0 || targetFullIdx >= sorted.length) return;

    const tempOrder = sorted[fullIdx].order;
    sorted[fullIdx].order = sorted[targetFullIdx].order;
    sorted[targetFullIdx].order = tempOrder;

    await supabase.from("brands").update({
      home_layout_json: { native_sections: sorted } as any
    } as any).eq("id", brandId);

    qc.invalidateQueries({ queryKey: ["brand-home-layout", brandId] });
    toast.success("Ordem atualizada!");
  };

  if (visibleSections.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">Ordem de exibição na Home</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {visibleSections.map((ns, idx) => (
            <div
              key={ns.key}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <span className="text-sm">
                <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                {ns.label}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMove(idx, "up")}
                  disabled={idx === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleMove(idx, "down")}
                  disabled={idx === visibleSections.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
