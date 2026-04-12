import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Menu } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_GROUP_ORDER = [
  "Guias Inteligentes",
  "Manuais",
  "Cidades",
  "Personalização & Vitrine",
  "Achadinhos",
  "Resgate com Pontos",
  "Aprovações",
  "Comunicação",
  "Gestão Comercial",
  "Programa de Fidelidade",
  "Gamificação",
  "Cashback Inteligente",
  "Equipe & Acessos",
  "Inteligência & Dados",
  "Integrações & API",
  "Configurações",
];

interface Props {
  brandId: string;
}

export default function SidebarOrderEditor({ brandId }: Props) {
  const qc = useQueryClient();

  const { data: brand } = useQuery({
    queryKey: ["brand-settings-sidebar", brandId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("brand_settings_json")
        .eq("id", brandId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
  });

  const savedOrder: string[] = (() => {
    const settings = brand?.brand_settings_json as Record<string, any> | null;
    if (settings?.sidebar_group_order && Array.isArray(settings.sidebar_group_order)) {
      return settings.sidebar_group_order;
    }
    return DEFAULT_GROUP_ORDER;
  })();

  // Merge: saved order first, then any missing groups from default
  const mergedOrder = [
    ...savedOrder,
    ...DEFAULT_GROUP_ORDER.filter(g => !savedOrder.includes(g)),
  ];

  const handleMove = async (idx: number, direction: "up" | "down") => {
    const newOrder = [...mergedOrder];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newOrder.length) return;

    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];

    // Merge with existing settings
    const currentSettings = (brand?.brand_settings_json as Record<string, any>) || {};
    const updatedSettings = { ...currentSettings, sidebar_group_order: newOrder };

    const { error } = await supabase
      .from("brands")
      .update({ brand_settings_json: updatedSettings as any })
      .eq("id", brandId);

    if (error) {
      toast.error("Erro ao salvar ordem");
      return;
    }

    qc.invalidateQueries({ queryKey: ["brand-settings-sidebar", brandId] });
    qc.invalidateQueries({ queryKey: ["brand-sidebar-order", brandId] });
    toast.success("Ordem do menu atualizada!");
  };

  if (mergedOrder.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Menu className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm">Ordem do Menu Lateral</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {mergedOrder.map((label, idx) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <span className="text-sm">
                <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                {label}
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
                  disabled={idx === mergedOrder.length - 1}
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
