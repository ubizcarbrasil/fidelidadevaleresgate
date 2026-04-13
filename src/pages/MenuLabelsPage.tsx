import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useMenuLabels, getGroupsForTab, getContextForTab } from "@/hooks/useMenuLabels";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";

type TabValue = "brand" | "branch" | "customer_app";

export default function MenuLabelsPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabValue>("brand");

  const context = getContextForTab(tab);
  const groups = getGroupsForTab(tab);
  const { customLabels } = useMenuLabels(context);

  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    customLabels?.forEach((l) => {
      map[l.key] = l.custom_label;
    });
    setEdits(map);
  }, [customLabels]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentBrandId) throw new Error("Marca não selecionada");
      const entries = Object.entries(edits).filter(([, val]) => val && val.trim() !== "");
      for (const [key, custom_label] of entries) {
        await supabase.from("menu_labels").upsert(
          { brand_id: currentBrandId, context, key, custom_label },
          { onConflict: "brand_id,context,key" }
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu-labels"] });
      toast.success("Rótulos salvos!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleChange = (key: string, value: string) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Nomes e Rótulos"
        description="Personalize os nomes dos menus e botões. Deixe em branco para usar o nome padrão."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList>
          <TabsTrigger value="brand">Sidebar Empreendedor</TabsTrigger>
          <TabsTrigger value="branch">Sidebar Cidade</TabsTrigger>
          <TabsTrigger value="customer_app">App do Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="space-y-4 mt-4">
          {groups.map((group) => (
            <Card key={group.groupLabel}>
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.groupLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {group.items.map((item) => (
                  <div key={item.key} className="flex items-center gap-3">
                    <span className="text-sm min-w-[180px] shrink-0">{item.defaultLabel}</span>
                    <Input
                      value={edits[item.key] || ""}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      placeholder={item.defaultLabel}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar Rótulos
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
