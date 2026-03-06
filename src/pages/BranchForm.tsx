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
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useBrandGuard } from "@/hooks/useBrandGuard";

const STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function BranchForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { isRootAdmin, currentBrandId } = useBrandGuard();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [brandId, setBrandId] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [isActive, setIsActive] = useState(true);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: brands } = useQuery({
    queryKey: ["brands-select", currentBrandId, isRootAdmin],
    queryFn: async () => {
      let query = supabase.from("brands").select("id, name, tenants(name)").eq("is_active", true);
      if (!isRootAdmin && currentBrandId) {
        query = query.eq("id", currentBrandId);
      }
      const { data } = await query.order("name");
      return data || [];
    },
  });

  // Auto-select brand when user has access to only one
  useEffect(() => {
    if (!brandId && brands && brands.length === 1) {
      setBrandId(brands[0].id);
    }
  }, [brands, brandId]);

  useEffect(() => {
    if (isEdit) {
      supabase.from("branches").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error) { toast.error("Branch não encontrada"); navigate("/branches"); return; }
        setName(data.name);
        setSlug(data.slug);
        setBrandId(data.brand_id);
        setCity(data.city || "");
        setState(data.state || "");
        setTimezone(data.timezone);
        setIsActive(data.is_active);
        setLatitude((data as any).latitude?.toString() || "");
        setLongitude((data as any).longitude?.toString() || "");
      });
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      toast.error("Selecione uma brand");
      return;
    }
    setLoading(true);
    const payload: any = {
      name, slug, brand_id: brandId, city: city || null, state: state || null, timezone, is_active: isActive,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
    };

    const { error } = isEdit
      ? await supabase.from("branches").update(payload).eq("id", id!)
      : await supabase.from("branches").insert(payload);

    if (error) toast.error(error.message);
    else { toast.success(isEdit ? "Branch atualizada!" : "Branch criada!"); navigate("/branches"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/branches")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar Cidade" : "Nova Cidade"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
               <Label>Marca</Label>
               <Select value={brandId} onValueChange={setBrandId}>
                 <SelectTrigger><SelectValue placeholder="Selecione uma marca" /></SelectTrigger>
                <SelectContent>
                  {brands?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({(b.tenants as any)?.name})</SelectItem>
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
                <Label>Identificador</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} required />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-23.5505" />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-46.6333" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ativo</Label>
              <div className="pt-2"><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/branches")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
