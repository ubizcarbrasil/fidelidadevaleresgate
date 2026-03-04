import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Package, Store, Coins, Layout, Save, Rocket } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StarterKitConfig {
  demo_sections_count: number;
  demo_stores_count: number;
  initial_customer_points: number;
  default_home_template_id: string | null;
}

export default function StarterKitConfigPage() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const [config, setConfig] = useState<StarterKitConfig>({
    demo_sections_count: 3,
    demo_stores_count: 2,
    initial_customer_points: 1000,
    default_home_template_id: null,
  });
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [seeding, setSeeding] = useState(false);

  const { data: configRow, isLoading } = useQuery({
    queryKey: ["platform_config", "starter_kit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_config")
        .select("*")
        .eq("key", "starter_kit")
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: templates } = useQuery({
    queryKey: ["home_template_library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_template_library")
        .select("id, name, is_default")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands-for-seed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches-for-seed", selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      const { data, error } = await supabase
        .from("branches")
        .select("id, name")
        .eq("brand_id", selectedBrandId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBrandId,
  });

  useEffect(() => {
    if (configRow?.value_json) {
      const v = configRow.value_json as unknown as StarterKitConfig;
      setConfig({
        demo_sections_count: v.demo_sections_count ?? 3,
        demo_stores_count: v.demo_stores_count ?? 2,
        initial_customer_points: v.initial_customer_points ?? 1000,
        default_home_template_id: v.default_home_template_id ?? null,
      });
    }
  }, [configRow]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("platform_config")
        .update({ value_json: config as any, updated_at: new Date().toISOString() })
        .eq("key", "starter_kit");
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_config"] });
      toast({ title: "Salvo!", description: "Configuração do Kit Inicial atualizada." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    },
  });

  const handleSeedDemoStores = async () => {
    if (!selectedBrandId) {
      toast({ title: "Selecione uma marca", variant: "destructive" });
      return;
    }

    const branchId = branches?.[0]?.id;
    if (!branchId) {
      toast({ title: "Nenhuma filial encontrada para essa marca", variant: "destructive" });
      return;
    }

    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-demo-stores", {
        body: { brand_id: selectedBrandId, branch_id: branchId },
      });

      if (error) throw error;

      toast({
        title: "Parceiros demo criados!",
        description: `${data.created} criados, ${data.skipped} já existiam.`,
      });
    } catch (err: any) {
      toast({
        title: "Erro ao criar parceiros demo",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fields: { key: keyof StarterKitConfig; label: string; description: string; icon: typeof Package; min: number; max: number }[] = [
    { key: "demo_sections_count", label: "Seções Demo", description: "Quantas seções de vitrine serão criadas ao provisionar uma nova empresa.", icon: Layout, min: 0, max: 20 },
    { key: "demo_stores_count", label: "Parceiros Demo", description: "Quantos parceiros fictícios serão criados para popular a vitrine inicial.", icon: Store, min: 0, max: 50 },
    { key: "initial_customer_points", label: "Pontos Iniciais do Cliente Teste", description: "Saldo de pontos que o cliente teste receberá ao ser provisionado.", icon: Coins, min: 0, max: 100000 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Kit Inicial" description="Configure os dados padrão criados ao provisionar uma nova empresa pelo wizard." />

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((f) => (
          <Card key={f.key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <f.icon className="h-4 w-4 text-primary" />
                {f.label}
              </CardTitle>
              <CardDescription className="text-xs">{f.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                type="number"
                min={f.min}
                max={f.max}
                value={config[f.key] as number}
                onChange={(e) => setConfig((prev) => ({ ...prev, [f.key]: Number(e.target.value) }))}
              />
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4 text-primary" />
              Template de Home Padrão
            </CardTitle>
            <CardDescription className="text-xs">
              Qual modelo de Home Page será aplicado automaticamente nas novas empresas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={config.default_home_template_id ?? "none"}
              onValueChange={(v) => setConfig((prev) => ({ ...prev, default_home_template_id: v === "none" ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Nenhum selecionado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (usar padrão do sistema)</SelectItem>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.is_default ? "(padrão)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configuração
        </Button>
      </div>

      {/* Seed Demo Stores Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Rocket className="h-4 w-4 text-primary" />
            Injetar 40 Parceiros Demo em Marca Existente
          </CardTitle>
          <CardDescription className="text-xs">
            Cria 40 estabelecimentos fictícios com ofertas, catálogo e logos realistas na marca selecionada. Parceiros já existentes não serão duplicados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Marca</label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Filial</label>
              <Select disabled value={branches?.[0]?.id || ""}>
                <SelectTrigger>
                  <SelectValue placeholder={selectedBrandId ? (branches?.length ? branches[0].name : "Nenhuma filial") : "Selecione a marca primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSeedDemoStores}
            disabled={seeding || !selectedBrandId || !branches?.length}
            className="w-full sm:w-auto"
          >
            {seeding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
            {seeding ? "Criando parceiros..." : "Injetar 40 Parceiros Demo"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
