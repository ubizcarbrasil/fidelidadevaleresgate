import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import BrandThemeEditor from "@/components/BrandThemeEditor";
import type { BrandTheme } from "@/hooks/useBrandTheme";

export default function BrandForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [theme, setTheme] = useState<BrandTheme>({});
  const [loading, setLoading] = useState(false);

  const { data: tenants } = useQuery({
    queryKey: ["tenants-select"],
    queryFn: async () => {
      const { data } = await supabase.from("tenants").select("id, name").eq("is_active", true).order("name");
      return data || [];
    },
  });

  useEffect(() => {
    if (isEdit) {
      supabase.from("brands").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error) { toast.error("Brand não encontrada"); navigate("/brands"); return; }
        setName(data.name);
        setSlug(data.slug);
        setTenantId(data.tenant_id);
        setIsActive(data.is_active);
        if (data.brand_settings_json && typeof data.brand_settings_json === "object" && !Array.isArray(data.brand_settings_json)) {
          setTheme(data.brand_settings_json as unknown as BrandTheme);
        }
      });
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      toast.error("Selecione um tenant");
      return;
    }
    setLoading(true);

    // Clean empty values from theme
    const cleanTheme = JSON.parse(JSON.stringify(theme, (_, v) => (v === "" || v === undefined ? undefined : v)));
    const payload = {
      name,
      slug,
      tenant_id: tenantId,
      is_active: isActive,
      brand_settings_json: Object.keys(cleanTheme).length > 0 ? cleanTheme : null,
    };

    const { error } = isEdit
      ? await supabase.from("brands").update(payload).eq("id", id!)
      : await supabase.from("brands").insert(payload);

    if (error) toast.error(error.message);
    else { toast.success(isEdit ? "Brand atualizada!" : "Brand criada!"); navigate("/brands"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate("/brands")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">Geral</TabsTrigger>
            <TabsTrigger value="theme">Tema Visual</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>{isEdit ? "Editar Brand" : "Nova Brand"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tenant</Label>
                  <Select value={tenantId} onValueChange={setTenantId}>
                    <SelectTrigger><SelectValue placeholder="Selecione um tenant" /></SelectTrigger>
                    <SelectContent>
                      {tenants?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Ativo</Label>
                  <div className="pt-2"><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme" className="mt-4">
            <BrandThemeEditor value={theme} onChange={setTheme} />
          </TabsContent>
        </Tabs>

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
          <Button type="button" variant="outline" onClick={() => navigate("/brands")}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
