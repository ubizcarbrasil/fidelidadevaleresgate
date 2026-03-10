import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function VoucherForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!id;

  const [code, setCode] = useState(() => generateCode());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountPercent, setDiscountPercent] = useState("10");
  const [branchId, setBranchId] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [campaign, setCampaign] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [bgColor, setBgColor] = useState("#E91E63");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [loading, setLoading] = useState(false);

  const { data: branches } = useQuery({
    queryKey: ["branches-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("branches")
        .select("id, name, brands(name)")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  useEffect(() => {
    if (isEdit) {
      supabase.from("vouchers").select("*").eq("id", id).single().then(({ data, error }) => {
        if (error) { toast.error("Voucher não encontrado"); navigate("/vouchers"); return; }
        setCode(data.code);
        setTitle(data.title);
        setDescription(data.description || "");
        setDiscountPercent(String(data.discount_percent));
        setBranchId(data.branch_id);
        setMaxUses(String(data.max_uses));
        setExpiresAt(data.expires_at ? data.expires_at.slice(0, 16) : "");
        setCampaign(data.campaign || "");
        setCustomerName(data.customer_name || "");
        setCustomerPhone(data.customer_phone || "");
        setCustomerEmail(data.customer_email || "");
        setRedirectUrl((data as any).redirect_url || "");
        setBgColor((data as any).bg_color || "#E91E63");
        setTextColor((data as any).text_color || "#FFFFFF");
      });
    }
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) {
      toast.error("Selecione uma branch");
      return;
    }
    setLoading(true);
    const payload: Record<string, any> = {
      code,
      title,
      description: description || null,
      discount_percent: parseFloat(discountPercent),
      branch_id: branchId,
      max_uses: parseInt(maxUses),
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      campaign: campaign || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      customer_email: customerEmail || null,
      redirect_url: redirectUrl || null,
      bg_color: bgColor || null,
      text_color: textColor || null,
      ...(isEdit ? {} : { created_by: user?.id }),
    };

    const { error } = isEdit
      ? await supabase.from("vouchers").update(payload).eq("id", id!)
      : await supabase.from("vouchers").insert(payload);

    if (error) toast.error(error.message);
    else { toast.success(isEdit ? "Voucher atualizado!" : "Voucher criado!"); navigate("/vouchers"); }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" onClick={() => navigate("/vouchers")} className="gap-2">
        <ArrowLeft className="h-4 w-4" />Voltar
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? "Editar Voucher" : "Novo Voucher"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Branch (Filial)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="Selecione uma branch" /></SelectTrigger>
                <SelectContent>
                  {branches?.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name} ({(b.brands as any)?.name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Código</Label>
                <div className="flex gap-2">
                  <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required className="font-mono" />
                  {!isEdit && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setCode(generateCode())}>
                      Gerar
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: 10% desconto aniversário" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do voucher..." />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Desconto (%)</Label>
                <Input type="number" min="1" max="100" step="0.01" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Máximo de Usos</Label>
                <Input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Validade</Label>
                <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Campanha / Motivo</Label>
              <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="Ex: Black Friday 2026" />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Dados do Cliente (opcional)</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3 text-muted-foreground">Personalização do Cupom</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Link de Redirecionamento (Webview)</Label>
                  <Input type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://exemplo.com/promo" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cor de Fundo</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-10 rounded-lg border border-input cursor-pointer" />
                      <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="font-mono" placeholder="#E91E63" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Cor do Texto</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg border border-input cursor-pointer" />
                      <Input value={textColor} onChange={(e) => setTextColor(e.target.value)} className="font-mono" placeholder="#FFFFFF" />
                    </div>
                  </div>
                </div>
                {/* Preview */}
                <div className="rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${bgColor} 0%, ${bgColor}cc 100%)` }}>
                  <div className="px-5 py-4" style={{ color: textColor }}>
                    <span className="text-lg font-bold">Prévia do Cupom</span>
                    <p className="text-xs mt-1" style={{ opacity: 0.8 }}>Assim será exibido para o cliente</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/vouchers")}>Cancelar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
