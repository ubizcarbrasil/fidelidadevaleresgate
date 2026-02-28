import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandGuard } from "@/hooks/useBrandGuard";
import { useMenuLabels } from "@/hooks/useMenuLabels";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function MenuLabelsPage() {
  const { currentBrandId } = useBrandGuard();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"admin" | "customer_app">("admin");
  const { allDefaults, customLabels } = useMenuLabels(tab);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    customLabels?.forEach((l) => { map[l.key] = l.custom_label; });
    setEdits(map);
  }, [customLabels]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentBrandId) throw new Error("Marca não selecionada");
      const entries = Object.entries(edits).filter(([key, val]) => val && val !== allDefaults[key]);
      for (const [key, custom_label] of entries) {
        await supabase.from("menu_labels").upsert(
          { brand_id: currentBrandId, context: tab, key, custom_label },
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

  return (
    <div className="p-6 space-y-4">
      <PageHeader
        title="Nomes e Rótulos"
        description="Personalize os nomes dos menus e botões exibidos no painel admin e no aplicativo do cliente. Deixe em branco para usar o nome padrão."
      />

      <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="admin">Painel Admin</TabsTrigger>
          <TabsTrigger value="customer_app">App do Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chave</TableHead>
                <TableHead>Padrão</TableHead>
                <TableHead>Personalizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(allDefaults).map(([key, defaultLabel]) => (
                <TableRow key={key}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{key}</TableCell>
                  <TableCell className="text-sm">{defaultLabel}</TableCell>
                  <TableCell>
                    <Input
                      value={edits[key] || ""}
                      onChange={(e) => setEdits({ ...edits, [key]: e.target.value })}
                      placeholder={defaultLabel}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4">
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="gap-1.5">
              <Save className="h-4 w-4" /> Salvar Rótulos
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
