import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Rocket } from "lucide-react";

export default function TenantForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("free");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (isEdit) {
      supabase.from("tenants").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error) { toast.error("Tenant não encontrado"); navigate("/tenants"); return; }
        setName(data.name);
        setSlug(data.slug);
        setPlan(data.plan);
        setIsActive(data.is_active);
      });
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = { name, slug, plan, is_active: isActive };

    const { error } = isEdit
      ? await supabase.from("tenants").update(payload).eq("id", id!)
      : await supabase.from("tenants").insert(payload);

    if (error) {
      toast.error(error.message);
    } else if (isEdit) {
      toast.success("Tenant atualizado!");
      navigate("/tenants");
    } else {
      toast.success("Organização criada!");
      setCreated(true);
    }
    setLoading(false);
  };

  if (created) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Card className="border-green-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Organização Criada!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A organização <strong>{name}</strong> foi criada com sucesso. Deseja provisionar uma marca completa com cidade, domínio e contas de teste?
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/tenants")}>
                Voltar para Organizações
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() =>
                  navigate(`/provision-brand?tenant_name=${encodeURIComponent(name)}&tenant_slug=${encodeURIComponent(slug)}`)
                }
              >
                <Rocket className="h-4 w-4" />
                Provisionar Marca Completa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/tenants")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar Tenant" : "Novo Tenant"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ativo</Label>
                <div className="pt-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/tenants")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
